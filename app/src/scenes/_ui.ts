// The widget kit for the interactive launch film. A Widget is a piece of the real app UI, cut pixel-exact
// from a Figma export (app/public/assets/figma, 393 x 852 design units), turned into a 3D layer that:
//   - sits exactly over its spot on the phone's screen (so it can lift off it, like an exploded view),
//   - can fly to any point in front of the camera ("hero" pose) and back,
//   - can be repainted every frame to show a state change (typing, a focus ring, a press, a toggle),
// and drawPawTap() shows the touch that triggers it: a paw that presses, with a ripple.
import * as THREE from 'three';
import { W, H } from '../engine/gl';
import { clamp, ease } from '../engine/util';
import { FRONT, SCREEN_H, SCREEN_W, SCR_H, SCR_W } from './_cine';
import { drawPaw } from './_launch';

/** The Figma frame (iPhone 14/15 Pro) in design units. */
export const FW = 393, FH = 852;
export type Rect = [x: number, y: number, w: number, h: number];

/** World units per design unit on the phone's screen. */
export const UNIT = SCREEN_W / FW;
/** The screen painter fits an export's width, so the frame covers this fraction of the screen's height. */
const FIT_H = (SCR_W * FH) / FW / SCR_H;

/** A point of the design frame (u, v from its top-left) on the phone's screen, in the phone's local space. */
export function screenPoint(u: number, v: number, z = 0): THREE.Vector3 {
  return new THREE.Vector3((u / FW - 0.5) * SCREEN_W, (0.5 - (v / FH) * FIT_H) * SCREEN_H, FRONT + 0.002 + z);
}

/** The same point on the screen painter's canvas, in canvas px (to paint the empty slot a lifted widget leaves). */
export const canvasPx = (u: number) => (u / FW) * SCR_W;

let glossT: THREE.CanvasTexture | null = null;
/** A diagonal band of soft light (repeats horizontally, so sliding its offset sweeps the sheen). */
function glossTex(): THREE.CanvasTexture {
  if (glossT) { const t = glossT.clone(); t.needsUpdate = true; return t; }
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0.3, 'rgba(255,255,255,0)'); g.addColorStop(0.47, 'rgba(255,255,255,0.9)'); g.addColorStop(0.53, 'rgba(255,255,255,0.9)'); g.addColorStop(0.7, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 512, 512);
  glossT = new THREE.CanvasTexture(cv);
  glossT.colorSpace = THREE.SRGBColorSpace;
  glossT.wrapS = THREE.RepeatWrapping;
  const t = glossT.clone(); t.needsUpdate = true;
  return t;
}

let shadowTex: THREE.CanvasTexture | null = null;
function softShadow(): THREE.CanvasTexture {
  if (shadowTex) return shadowTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d')!;
  c.filter = 'blur(26px)';
  c.fillStyle = 'rgba(60,20,20,1)';
  c.beginPath(); c.roundRect(52, 52, 152, 152, 40); c.fill();
  shadowTex = new THREE.CanvasTexture(cv);
  shadowTex.colorSpace = THREE.SRGBColorSpace;
  return shadowTex;
}

export interface WidgetOpts {
  /** Corner radius in design units (the widget is clipped to it: transparent outside). */
  radius?: number;
  /** Source px per design unit (default: the source's width / 393, i.e. a full-frame export). */
  scale?: number;
  /** Where its centre sits on the phone's screen, in design units (default: the centre of ect). */
  at?: [number, number];
  /** Key out this background colour (a cut-out: text, logos, icons floating on their own). */
  key?: [number, number, number];
}

/** A pose in the phone's local space (see heroPose). */
export interface LocalPose { pos: THREE.Vector3; quat: THREE.Quaternion; scale: number }
const IDENTITY = new THREE.Quaternion();

export class Widget {
  group = new THREE.Group();
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  canvas = document.createElement('canvas');
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  /** Where it sits flush on the screen (phone-local). */
  home: THREE.Vector3;
  /** Export px per design unit (4 for a @4x export). */
  s: number;
  private base: HTMLCanvasElement; // the crop (keyed), drawn under every repaint

  constructor(public img: HTMLImageElement | HTMLCanvasElement, public rect: Rect, public o: WidgetOpts = {}) {
    const [x, y, w, h] = rect;
    this.s = o.scale ?? (img instanceof HTMLImageElement ? img.naturalWidth : img.width) / FW;
    this.canvas.width = Math.round(w * this.s);
    this.canvas.height = Math.round(h * this.s);
    this.ctx = this.canvas.getContext('2d')!;
    this.base = document.createElement('canvas');
    this.base.width = this.canvas.width; this.base.height = this.canvas.height;
    const b = this.base.getContext('2d')!;
    b.drawImage(img, x * this.s, y * this.s, w * this.s, h * this.s, 0, 0, this.base.width, this.base.height);
    if (o.key) keyOut(b, this.base.width, this.base.height, o.key);
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w * UNIT, h * UNIT), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, toneMapped: false }));
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * UNIT * 1.3, h * UNIT * 1.6), new THREE.MeshBasicMaterial({ map: softShadow(), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    this.group.add(this.shadow, this.mesh);
    this.home = o.at ? screenPoint(o.at[0], o.at[1]) : screenPoint(x + w / 2, y + h / 2);
    this.draw();
  }

  /**
   * Inside a draw() paint: erases a part of the crop (text over a photo) by redrawing it heavily blurred,
   * so new text can go on top. `r` in frame design units.
   */
  blurOut(c: CanvasRenderingContext2D, r: Rect, blur = 9) {
    const [x, y, w, h] = this.rect;
    c.save();
    c.beginPath(); c.roundRect(r[0], r[1], r[2], r[3], Math.min(r[2], r[3]) / 2); c.clip();
    c.filter = `blur(${blur * this.s}px)`;
    for (let i = 0; i < 3; i++) c.drawImage(this.base, x, y, w, h);
    c.restore();
  }

  private lastKey: string | null = null;
  /** Like draw(), but only when `key` changed since the last call (a repaint re-uploads the texture: costly). */
  drawKeyed(key: string, paint?: (c: CanvasRenderingContext2D) => void, baseAlpha = 1) {
    if (key === this.lastKey) return;
    this.draw(paint, baseAlpha);
    this.lastKey = key;
  }

  slabMesh: THREE.Mesh | null = null;
  private gloss: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null;
  /**
   * Gives the widget real thickness: a rounded slab behind its face (lit, casts a shadow on the floor),
   * and a soft glossy sheen across the face that slides as it turns (call shine() per frame).
   */
  slab(depth = 0.035, color = '#FFFFFF', round = false) {
    const [, , w, h] = this.rect, ww = w * UNIT, hh = h * UNIT;
    const r = round ? Math.min(ww, hh) / 2 : Math.min((this.o.radius ?? 8) * UNIT, Math.min(ww, hh) / 2);
    const shape = new THREE.Shape(), x = -ww / 2, y = -hh / 2;
    shape.moveTo(x + r, y); shape.lineTo(x + ww - r, y); shape.absarc(x + ww - r, y + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(x + ww, y + hh - r); shape.absarc(x + ww - r, y + hh - r, r, 0, Math.PI / 2, false);
    shape.lineTo(x + r, y + hh); shape.absarc(x + r, y + hh - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(x, y + r); shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.3, bevelSize: depth * 0.25, bevelSegments: 4, curveSegments: 24 });
    geo.translate(0, 0, -depth - depth * 0.3 - 0.0008);
    this.slabMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.02 }));
    this.slabMesh.castShadow = true;
    this.mesh.add(this.slabMesh);
    if (round) { this.shadow.visible = false; return this; } // (a square sheen would show round a disc)
    this.gloss = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), new THREE.MeshBasicMaterial({ map: glossTex(), transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.gloss.position.z = 0.0006;
    this.mesh.add(this.gloss);
    this.shadow.visible = false; // the slab casts a real shadow now
    return this;
  }
  /** Slides the sheen across the face (`k` any number; use the widget's turn or time). */
  shine(k: number) {
    if (this.gloss) (this.gloss.material.map as THREE.Texture).offset.x = ((k % 1) + 1) % 1 - 0.5;
  }

  /** Places it freely in the world (for widgets that are not on a phone): position, rotation (radians), scale. */
  setWorld(pos: [number, number, number], rot: [number, number, number] = [0, 0, 0], scale = 1, shadow = 0) {
    this.group.position.set(pos[0], pos[1], pos[2]);
    this.group.rotation.set(rot[0], rot[1], rot[2]);
    this.group.scale.setScalar(scale);
    this.mesh.scale.setScalar(1);
    this.shadow.material.opacity = shadow;
    this.shadow.position.set(0.02, -0.04, -0.03);
  }

  /**
   * Repaints the widget: its crop, then `paint` on top. `paint` draws in design units of the whole frame
   * (the same coordinates as the Figma export), clipped to the widget's rounded shape.
   */
  draw(paint?: (c: CanvasRenderingContext2D) => void, baseAlpha = 1) {
    const c = this.ctx, [x, y, w, h] = this.rect;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.save();
    c.scale(this.s, this.s);
    if (this.o.radius) { c.beginPath(); c.roundRect(0, 0, w, h, this.o.radius); c.clip(); }
    c.globalAlpha = baseAlpha;
    c.drawImage(this.base, 0, 0, w, h);
    c.globalAlpha = 1;
    c.translate(-x, -y);
    paint?.(c);
    c.restore();
    this.tex.needsUpdate = true;
    this.lastKey = null;
  }

  /**
   * Places it. `lift` = how far it floats off the screen (world units); `k` 0..1 blends from there to the
   * `hero` pose (in front of the camera). Its soft shadow stays on the screen and fades as it rises or flies.
   */
  place(lift: number, k = 0, hero?: LocalPose, press = 0) {
    const p = this.home.clone();
    p.z += lift;
    if (hero && k > 0) {
      this.group.position.lerpVectors(p, hero.pos, k);
      this.group.quaternion.copy(IDENTITY).slerp(hero.quat, k);
      this.group.scale.setScalar(1 + (hero.scale - 1) * k);
    } else {
      this.group.position.copy(p);
      this.group.quaternion.identity();
      this.group.scale.setScalar(1);
    }
    this.mesh.scale.setScalar(1 - 0.06 * press); // a press squashes it a little
    const lk = clamp(lift / 0.08);
    this.shadow.material.opacity = 0.16 * lk * (1 - k);
    this.shadow.position.set(0.006 * lk, -0.02 * lk, -lift + 0.0005);
  }

  /** Where a point of the widget (design units, frame coordinates) is on the output frame, in px. */
  toFrame(cam: THREE.Camera, u: number, v: number): [number, number] {
    const [x, y, w, h] = this.rect;
    const local = new THREE.Vector3((u - x - w / 2) * UNIT, -(v - y - h / 2) * UNIT, 0.002);
    this.mesh.updateMatrixWorld(true);
    const p = this.mesh.localToWorld(local).project(cam);
    return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H];
  }
}

/** Makes pixels close to `rgb` transparent, with a soft edge (a cut-out of text or a logo from its background). */
function keyOut(c: CanvasRenderingContext2D, w: number, h: number, rgb: [number, number, number]) {
  const im = c.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const dist = Math.abs(d[i]! - rgb[0]) + Math.abs(d[i + 1]! - rgb[1]) + Math.abs(d[i + 2]! - rgb[2]);
    const a = clamp((dist - 6) / 40);
    if (a < 1) {
      // un-mix the background from anti-aliased edges so they don't keep a light fringe
      for (let k = 0; k < 3; k++) d[i + k] = a > 0 ? clamp((d[i + k]! - rgb[k]! * (1 - a)) / a, 0, 255) : 0;
      d[i + 3] = Math.round(d[i + 3]! * a);
    }
  }
  c.putImageData(im, 0, 0);
}

/**
 * The pose (in the phone's local space) that puts a widget in front of the camera, facing it:
 * `offset` = [right, up, distance] from the camera in world units, `scale` = how much bigger it gets,
 * `tilt` = a slight turn so it doesn't look flat.
 */
export function heroPose(phone: THREE.Object3D, cam: THREE.Camera, offset: [number, number, number], scale: number, tilt: [x: number, y: number] = [0, 0]): LocalPose {
  phone.updateMatrixWorld(true);
  cam.updateMatrixWorld(true);
  const world = new THREE.Vector3(offset[0], offset[1], -offset[2]).applyQuaternion(cam.quaternion).add(cam.position);
  const pos = phone.worldToLocal(world);
  const qPhone = phone.getWorldQuaternion(new THREE.Quaternion());
  // facing the camera, turned a little (`tilt`, radians about x and y) so it still reads as a 3D object
  const facing = cam.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt[0], tilt[1], 0)));
  const quat = qPhone.invert().multiply(facing);
  return { pos, quat, scale };
}

/**
 * A touch: a paw comes in, presses on (x, y) at age 0 (squash), lifts off; a ripple ring spreads from the
 * press. `age` = seconds since the press (negative while it approaches). Coral by default.
 */
export function drawPawTap(c: CanvasRenderingContext2D, x: number, y: number, age: number, size = 70, color = '#FF1744') {
  if (age < -0.3 || age > 0.8) return;
  if (age >= 0 && age < 0.7) {
    const r = ease.outCubic(age / 0.7);
    c.save();
    c.strokeStyle = color;
    c.globalAlpha = 0.7 * (1 - r);
    c.lineWidth = 4;
    c.beginPath(); c.arc(x, y, size * 0.3 + size * 1.1 * r, 0, Math.PI * 2); c.stroke();
    c.restore();
  }
  const arrive = ease.outCubic(clamp((age + 0.3) / 0.3));
  const leave = ease.inCubic(clamp((age - 0.25) / 0.45));
  const press = age >= 0 && age < 0.2 ? Math.sin((age / 0.2) * Math.PI) : 0;
  const s = size * (1 - 0.14 * press);
  const ox = (1 - arrive) * 50 + leave * 40, oy = -(1 - arrive) * 60 - leave * 50;
  c.save();
  c.globalAlpha = arrive * (1 - leave);
  c.shadowColor = 'rgba(80,10,20,0.35)'; c.shadowBlur = 18; c.shadowOffsetY = 6 * (1 - press);
  // the paw's pad lands on the point (drawPaw puts the pad 0.18 s below its centre)
  drawPaw(c, x + ox, y + oy - s * 0.18, s, color);
  c.restore();
}

/** The part of `text` typed by time t (one character every `per` seconds from t0). */
export const typed = (text: string, t: number, t0: number, per: number) => text.slice(0, Math.max(0, Math.floor((t - t0) / per) + 1) * (t >= t0 ? 1 : 0));
