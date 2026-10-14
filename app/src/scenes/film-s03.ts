// S03 · Your pet (one bar, 6.622–9.933 s). "Polaroid desk": the profile is built from objects on a desk,
// seen from above, the camera slowly turning.
//   0.00  the red of S02 shrinks into the location card's button; paw-tap; a pin drops
//   0.83  a polaroid of Bubbly falls onto the desk and bounces
//   1.20  a collar tag: "Bubbly" is stamped onto it letter by letter
//   1.62  the "Female" chip pops and turns red under a paw
//   1.90  trait blocks rain down; "Playful" and "Friendly" are tapped orange
//   2.35  the progress medal fills to 100%; "Create Their Profile" is pressed;
//   2.75  the polaroid lifts toward the camera inside Bubbly's coral loop (into the Feed)
// The objects are drawn in code in the app's style; the button is cut from "Create Pet Profile Page 01 (1).png".
import type { Frame } from '../engine/scene';
import { W, H } from '../engine/gl';
import { F, font } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { Widget, drawPawTap } from './_ui';
import { FACES, src } from './_kit';
import { C, Shot, bump } from './_shot';

const DESK = -0.6, FLAT = -Math.PI / 2;
const T = { pin: 0.4, photo: 0.83, tag: 1.2, female: 1.66, playful: 2.05, friendly: 2.24, create: 2.55 };
const TRAITS = ['Playful', 'Friendly', 'Calm', 'Active', 'Gentle'];

export default class CreatePet extends Shot {
  w: Record<string, Widget> = {};
  traits: Widget[] = [];
  face: HTMLImageElement | null = null;

  async setup() {
    this.makeWorld('profile', { floorY: DESK, center: [0.4, DESK, 0], seed: 11 });
    this.face = await this.img(FACES.bubbly.file);
    const create = await this.img(this.shot.screen_asset?.[0] ?? '');
    const add = (name: string, w: Widget) => { this.w[name] = w; this.stage.scene.add(w.group); return w; };
    // the location card (its own red button), standing on the desk at first
    add('loc', new Widget(src(300, 150, (c) => {
      c.fillStyle = '#FFF4EC'; c.beginPath(); c.roundRect(0, 0, 300, 150, 22); c.fill();
      c.fillStyle = C.orange; c.beginPath(); c.arc(150, 32, 16, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(150, 30, 5.5, 0, Math.PI * 2); c.fill();
      c.font = font(F.brandDisplay(700), 17); c.fillStyle = C.ink; c.textAlign = 'center';
      c.fillText('Choose Your Location', 150, 74);
      c.fillStyle = C.red; c.beginPath(); c.roundRect(40, 94, 220, 38, 19); c.fill();
      c.font = font(F.brandBody(600), 13); c.fillStyle = '#FFFFFF'; c.textBaseline = 'middle';
      c.fillText('Use My Current Location', 150, 113.5);
    }), [0, 0, 300, 150], { scale: 4, radius: 22 }).slab(0.03));
    // the polaroid: Bubbly's photo with a white frame and her name in the margin
    const face = this.face;
    add('polaroid', new Widget(src(150, 176, (c) => {
      c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, 150, 176);
      if (face) c.drawImage(face, FACES.bubbly.rect[0], FACES.bubbly.rect[1], FACES.bubbly.rect[2], FACES.bubbly.rect[3], 11, 11, 128, 128);
      c.font = font(F.wordmark(), 17); c.fillStyle = C.ink; c.textAlign = 'center'; c.fillText('Bubbly', 75, 162);
    }), [0, 0, 150, 176], { scale: 4, radius: 3 }).slab(0.012));
    add('tag', new Widget(src(150, 64, () => {}), [0, 0, 150, 64], { scale: 4, radius: 26 }).slab(0.03, '#FFB547'));
    add('female', new Widget(src(110, 44, () => {}), [0, 0, 110, 44], { scale: 4, radius: 22 }).slab(0.02));
    add('medal', new Widget(src(120, 120, () => {}), [0, 0, 120, 120], { scale: 4, radius: 60 }).slab(0.03, '#FFFFFF', true));
    if (create) add('create', new Widget(create, [149, 721, 220, 48], { radius: 24 }).slab(0.03, '#FF7A00'));
    TRAITS.forEach((label) => {
      const t = new Widget(src(110, 40, () => {}), [0, 0, 110, 40], { scale: 4, radius: 20 }).slab(0.035, '#FFFFFF');
      this.traits.push(t); this.stage.scene.add(t.group);
    });
  }

  frame(lt: number) {
    this.camera(lt, [
      { t: 0, pos: [0.4, 1.5, 2.0], at: [0.4, -0.25, 0] },
      { t: 0.75, pos: [0.15, 2.1, 1.6], at: [0.45, DESK, 0.05], e: ease.inOutExpo },
      { t: 2.45, pos: [1.15, 1.85, 1.75], at: [0.5, DESK, 0.05], e: ease.inOutCubic },
      { t: 3.311, pos: [0.3, 0.55, 1.95], at: [0.15, 0.1, 0], e: ease.inOutCubic },
    ]);
    const lie = (w: Widget | undefined, x: number, z: number, rz: number, s: number, dropAt: number, h = 1.2) => {
      if (!w) return;
      const k = prog(lt, dropAt, dropAt + 0.32), fall = bounce(k);
      w.group.visible = lt >= dropAt;
      w.setWorld([x, DESK + 0.025 + (1 - fall) * h, z], [FLAT + (1 - fall) * 0.6, 0, rz + (1 - fall) * 0.8], s);
      w.shine(lt * 0.4 + x);
    };
    // the location card stands, is tapped, then falls flat and slides off
    const loc = this.w.loc;
    if (loc) {
      const away = ease.inCubic(prog(lt, 0.62, 0.85));
      loc.group.visible = away < 1;
      loc.setWorld([0.45, lerp(-0.12, DESK + 0.6, away), lerp(0.35, -1.2, away)], [lerp(-0.25, FLAT, away), 0, 0], 2.0 * (1 - 0.06 * bump(lt, T.pin)));
    }
    lie(this.w.polaroid, 0.15, 0.0, 0.1, 2.3, T.photo, 1.4);
    lie(this.w.tag, 0.98, -0.25, -0.22, 2.1, T.tag - 0.15);
    lie(this.w.female, 1.0, 0.32, 0.12, 2.0, T.female - 0.2);
    lie(this.w.medal, -0.55, 0.42, 0, 2.1, 2.2);
    lie(this.w.create, 0.42, 0.62, 0, 2.0, 2.4);
    this.traits.forEach((t, i) => lie(t, -0.75 + (i % 3) * 0.42, -0.45 + Math.floor(i / 3) * 0.3, (i - 2) * 0.2, 1.7, 1.86 + i * 0.05, 1.6));
    // the polaroid lifts to the camera at the end, inside the coral loop
    const lift = ease.inOutCubic(prog(lt, 2.75, 3.25));
    if (lift > 0 && this.w.polaroid) {
      const p = this.w.polaroid;
      p.setWorld([lerp(0.15, 0.15, lift), lerp(DESK + 0.025, 0.12, lift), lerp(0, 0.4, lift)], [lerp(FLAT, -0.15, lift), 0, lerp(0.1, 0, lift)], lerp(2.3, 2.6, lift));
    }
    if (this.w.create) this.w.create.mesh.scale.setScalar(1 - 0.08 * bump(lt, T.create, 0.3));
    this.paint(lt);
  }

  private paint(lt: number) {
    // the collar tag: "Bubbly" stamped letter by letter
    const n = Math.min(6, Math.max(0, Math.floor((lt - T.tag) / 0.07) + 1));
    this.w.tag?.drawKeyed(`t${n}`, (c) => {
      const g = c.createLinearGradient(0, 0, 150, 64); g.addColorStop(0, '#FFC94D'); g.addColorStop(1, C.orange);
      c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, 150, 64, 26); c.fill();
      c.fillStyle = '#FFF4E0'; c.beginPath(); c.arc(22, 32, 7, 0, Math.PI * 2); c.fill();
      c.font = font(F.brandDisplay(700), 30); c.fillStyle = '#8A3B00'; c.textBaseline = 'middle';
      c.fillText('Bubbly'.slice(0, n), 40, 34);
    }, 0);
    const on = lt >= T.female;
    this.w.female?.drawKeyed(`f${on}`, (c) => {
      c.beginPath(); c.roundRect(1, 1, 108, 42, 21);
      if (on) { c.fillStyle = C.red; c.fill(); } else { c.fillStyle = '#FFFAFA'; c.fill(); c.strokeStyle = C.red; c.lineWidth = 1.5; c.stroke(); }
      c.font = font(F.brandBody(600), 19); c.fillStyle = on ? '#FFFFFF' : C.red; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Female', 55, 23);
    }, 0);
    this.traits.forEach((t, i) => {
      const sel = (i === 0 && lt >= T.playful) || (i === 1 && lt >= T.friendly);
      t.drawKeyed(`c${sel}`, (c) => {
        c.fillStyle = sel ? '#FFE3CC' : '#FFFFFF'; c.beginPath(); c.roundRect(0.5, 0.5, 109, 39, 19.5); c.fill();
        c.strokeStyle = sel ? C.orange : '#E6DEDE'; c.lineWidth = 1.2; c.stroke();
        c.font = font(F.brandBody(sel ? 600 : 400), 16); c.fillStyle = sel ? C.orange : C.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(TRAITS[i]!, sel ? 61 : 55, 21);
        if (sel) { c.fillStyle = C.orange; c.beginPath(); c.arc(18, 20, 4, 0, Math.PI * 2); c.fill(); }
      }, 0);
    });
    // the medal: a ring that fills 30 → 100% as the profile completes, then a tick
    const pct = Math.round(lerp(30, 100, ease.inOutCubic(prog(lt, 2.2, T.create + 0.15))));
    const done = lt >= T.create + 0.15;
    this.w.medal?.drawKeyed(`m${pct}${done}`, (c) => {
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(60, 60, 59, 0, Math.PI * 2); c.fill();
      c.lineWidth = 12; c.strokeStyle = '#F6D9C6'; c.beginPath(); c.arc(60, 60, 42, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = C.orange; c.lineCap = 'round'; c.beginPath(); c.arc(60, 60, 42, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct) / 100); c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (done) { c.strokeStyle = C.orange; c.lineWidth = 7; c.beginPath(); c.moveTo(42, 61); c.lineTo(55, 74); c.lineTo(80, 48); c.stroke(); }
      else { c.font = font(F.brandDisplay(700), 24); c.fillStyle = C.orange; c.fillText(`${pct}%`, 60, 62); }
    }, 0);
  }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    const cam = this.stage.cam, loc = this.w.loc;
    // the red of S02 shrinks into the location button
    const shrink = ease.inOutCubic(prog(lt, 0, 0.32));
    if (loc && shrink < 1) {
      const [x0, y0] = loc.toFrame(cam, 40, 94), [x1, y1] = loc.toFrame(cam, 260, 132);
      c.fillStyle = C.red; c.beginPath();
      c.roundRect(lerp(-20, Math.min(x0, x1), shrink), lerp(-20, Math.min(y0, y1), shrink), lerp(W + 40, Math.abs(x1 - x0), shrink), lerp(H + 40, Math.abs(y1 - y0), shrink), lerp(0, Math.abs(y1 - y0) / 2, shrink));
      c.fill();
    }
    if (loc && lt < 0.85) {
      drawPawTap(c, ...loc.toFrame(cam, 150, 113), lt - T.pin, 80, '#FFFFFF');
      const pk = prog(lt, T.pin + 0.06, T.pin + 0.36);
      if (pk > 0) { const [px, py] = loc.toFrame(cam, 150, 32); drawPin(c, px, py - (1 - bounce(pk)) * 260, 70, 1 - prog(lt, 0.62, 0.8)); }
    }
    if (this.w.female) drawPawTap(c, ...this.w.female.toFrame(cam, 55, 22), lt - T.female, 70);
    if (this.traits[0]) drawPawTap(c, ...this.traits[0].toFrame(cam, 55, 20), lt - T.playful, 62);
    if (this.traits[1]) drawPawTap(c, ...this.traits[1].toFrame(cam, 55, 20), lt - T.friendly, 62);
    if (this.w.create) drawPawTap(c, ...this.w.create.toFrame(cam, 259, 745), lt - T.create, 80, '#FFFFFF');
    // Bubbly's coral loop draws round the rising polaroid
    const ring = ease.inOutCubic(prog(lt, 2.85, 3.2));
    if (ring > 0 && this.w.polaroid) {
      const [cx, cy] = this.w.polaroid.toFrame(cam, 75, 80), [ex] = this.w.polaroid.toFrame(cam, 150, 80);
      const r = Math.abs(ex - cx) * 1.25;
      const g = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, C.red); g.addColorStop(1, C.orange);
      c.strokeStyle = g; c.lineWidth = 16; c.lineCap = 'round';
      c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ring); c.stroke();
    }
    this.headline(c, lt, { x: 110, y: 260, size: 92, at: 0.95, until: 2.7, title: 'Their own\nspotlight.' });
  }
}

/** A ball dropped on the floor: 0 → 1 with shrinking bounces. */
function bounce(x: number) {
  const n = 7.5625, d = 2.75;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}

/** A map pin: a red teardrop with a white centre and a soft shadow. */
function drawPin(c: CanvasRenderingContext2D, x: number, y: number, s: number, a: number) {
  c.save();
  c.globalAlpha = a;
  c.fillStyle = 'rgba(80,10,20,0.25)'; c.beginPath(); c.ellipse(x, y + s * 0.05, s * 0.3, s * 0.08, 0, 0, Math.PI * 2); c.fill();
  c.translate(x, y - s * 0.55);
  c.fillStyle = C.red; c.beginPath(); c.arc(0, 0, s * 0.32, Math.PI * 0.82, Math.PI * 0.18); c.lineTo(0, s * 0.55); c.closePath(); c.fill();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, -s * 0.02, s * 0.12, 0, Math.PI * 2); c.fill();
  c.restore();
}

export { clamp };
