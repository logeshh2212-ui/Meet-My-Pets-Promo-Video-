// Template "flythrough": your photos as cards floating in a dark 3D space, and the camera flying
// past them: it surges forward on every bar and glides, passing one card after another, left and
// right. Near cards slide by faster than far ones (real parallax), and cards fade into the dark
// with distance, so still photos read as a camera move. A phrase slams in with each card.
//
// The flight: on each downbeat the camera surges forward (the last card whooshes past, close to
// the lens) and settles with the next card framed on one side, drifting slowly until the next bar.
//
// storyboard: { "template": "flythrough", "beats": 12, "each": 4,
//               "images": ["assets/shot02_curious_dog.jpg", "assets/shot04_dogs_meeting.jpg", "assets/shot10_real_friendship.jpg"],
//               "phrases": ["New faces.", "New friends.", "New adventures."], "accent": "New friends." }
// each:    beats per card (default 4 = one bar); the camera reaches the next card on each
// anchors: optional, per image, the point to keep when cropping it to the card's shape ([x, y], 0..1)
import * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { fitSize } from '../engine/type';
import { HEX } from '../engine/palette';
import { ease, lerp, prog } from '../engine/util';
import { displayFamily, filmEdgeFade } from './_launch';
import { accentColors, kineticLine, loadImageQuiet, makeBackdrop, renderStage, updateBackdrop } from './_cine';
import { makeOverlay, renderOverlay, rhythm, textMotion } from './_motion';

const CARD_W = 1.6, CARD_H = 1.0; // card size in world units
const GAP = 3.2; // distance between cards along the flight path

/** A card texture: the photo cropped to the card's shape around `anchor`, with rounded corners. */
function cardTexture(img: HTMLImageElement | null, anchor: [number, number]): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 1280; cv.height = 800;
  const c = cv.getContext('2d')!;
  c.beginPath(); c.roundRect(0, 0, cv.width, cv.height, 56); c.clip();
  if (img) {
    const s = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    const x = Math.min(0, Math.max(cv.width - w, cv.width / 2 - anchor[0] * w));
    const y = Math.min(0, Math.max(cv.height - h, cv.height / 2 - anchor[1] * h));
    c.drawImage(img, x, y, w, h);
  } else { c.fillStyle = '#2A1C14'; c.fillRect(0, 0, cv.width, cv.height); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export default class FlythroughShot extends Scene {
  bg = makeBackdrop();
  overlay = makeOverlay();
  layer = new Layer2D();
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(40, W / H, 0.05, 60);
  seed = 0;

  override async init() {
    const p = this.ctx.params;
    const srcs = (p.images as string[] | undefined) ?? [];
    const anchors = (p.anchors as [number, number][] | undefined) ?? [];
    const imgs = await Promise.all(srcs.map((s) => loadImageQuiet(s)));
    const phrases = (p.phrases as string[] | undefined) ?? [];
    // one card per phrase, plus a few more beyond, so there is always depth ahead
    const n = Math.max(phrases.length, srcs.length) + 3;
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
    for (let i = 0; i < n; i++) {
      const k = i % Math.max(1, srcs.length);
      const mat = new THREE.MeshBasicMaterial({ map: cardTexture(imgs[k] ?? null, anchors[k] ?? [0.5, 0.5]), transparent: true, toneMapped: false });
      const card = new THREE.Mesh(geo, mat);
      const side = i % 2 ? 1 : -1;
      // alternating left and right of the path, turned in toward it, at slightly different heights
      card.position.set(side * 0.62, Math.sin(i * 2.1) * 0.1, -i * GAP);
      card.rotation.set(0, -side * 0.28, Math.sin(i * 1.3) * 0.04);
      this.scene.add(card);
    }
    // far cards sink into the dark, like depth in a real lens
    this.scene.fog = new THREE.Fog(new THREE.Color(HEX.ink), 2.5, 11);
    this.seed = parseInt(this.ctx.id, 10) || 0;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params, audio } = this.ctx;
    const dur = f.end - f.start, beat = 60 / audio.bpm;
    const each = ((params.each as number | undefined) ?? 4) * beat;
    const u = Math.max(0, f.lt / each); // which card we are on (fractional)
    const i = Math.floor(u), frac = u - i;
    // the flight: most of the distance in a fast surge right after the downbeat (the first ~0.35 of the
    // bar), then a slow drift; continuous across bars. After the surge card i is 2.2 units ahead.
    const surge = 0.85 * ease.outExpo(Math.min(1, frac / 0.35)) + 0.15 * frac;
    const g = i + surge;
    const side = i % 2 ? 1 : -1;
    const cam = this.cam;
    cam.position.set(side * 0.12 * surge, 0.05 + Math.sin(f.t * 0.9) * 0.03, 5.08 - GAP * g);
    cam.lookAt(side * 0.15, 0, cam.position.z - 5); // turned a little toward this bar's card
    cam.rotation.z += Math.sin(f.t * 0.7) * 0.012 - side * 0.015; // a slight bank toward it

    updateBackdrop(this.bg, f.t, prog(f.lt, 0, 0.8), W / 2, H / 2, [-g * 120, 0]);
    this.bg.render(renderer, out);
    renderStage(renderer, this.scene, cam, out);
    renderOverlay(this.overlay, renderer, out, f.t, this.seed, 1.2, 0.8);

    // the phrase for this card slams in on the downbeat, on the side away from the card
    const c = this.layer.ctx;
    this.layer.clear();
    const phrases = (params.phrases as string[] | undefined) ?? [];
    const phrase = phrases[Math.min(i, phrases.length - 1)];
    if (phrase) {
      const size = Math.min((params.size as number | undefined) ?? 130, fitSize(phrase, displayFamily(), W * 0.33));
      const k = prog(frac * each, 0, 0.28, ease.outExpo);
      const s = lerp(1.2, 1, k);
      c.save();
      c.globalAlpha = Math.min(1, k * 2);
      c.translate(side > 0 ? W * 0.21 : W * 0.79, H * 0.52); // the open side, away from the card
      c.scale(s, s);
      kineticLine(c, phrase, 0, size * 0.35, size, 99, 0, { align: 'center', accent: params.accent as string | string[] | undefined, shadow: true, accentColors: accentColors(params.accentStyle) });
      c.restore();
    }
    comp.draw(renderer, this.layer.upload(), out, textMotion(f.lt, dur, params.exit));
    return { ...rhythm(f, (params.pulse as number | undefined) ?? 1, frac * each), fade: filmEdgeFade(f, this.ctx) };
  }
}
