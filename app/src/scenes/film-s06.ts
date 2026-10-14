// S06 · Match (one bar, 16.555–19.866 s). "Face to face", in a dark ember space.
//   0.00  Bubbly's and Lily's photo stickers slide in from the sides; each shoots its loop to the middle
//   0.42  the loops lock into the double-loop: a flash and a ring; the stickers bounce, hearts float up
//   0.60  the real match screen rises between them
//   0.95  a notification drops in from the top: "Lily liked you back! 💛"
//   2.52  paw-tap "Chat Now": it presses, then swells red until it fills the frame (into the chat)
// The screen is the rebuilt match screen (assets/figma_rebuilt/match@4x.png); faces from the Figma designs.
import type { Frame } from '../engine/scene';
import { W, H } from '../engine/gl';
import { clamp, ease, lerp, prog } from '../engine/util';
import { UNIT, Widget, drawPawTap } from './_ui';
import { FACES, banner, sticker } from './_kit';
import { C, Shot, THREE, bump } from './_shot';
import { drawLoop } from './_mark';
import { drawHeart } from './film-s04';

const LOCK = 0.42, TAP = 2.52;

export default class Match extends Shot {
  screen: Widget | null = null;
  chat: Widget | null = null;
  bubbly: Widget | null = null;
  lily: Widget | null = null;
  note: Widget | null = null;

  async setup() {
    this.makeWorld('match', { floorY: -0.75, center: [0, 0, -0.5], seed: 13 });
    const [img, faces] = await Promise.all([this.img(this.shot.screen_asset?.[0] ?? ''), this.img(FACES.bubbly.file)]);
    if (img) {
      this.screen = new Widget(img, [0, 0, 393, 852], { radius: 44 }).slab(0.03, '#2A1A1C');
      this.chat = new Widget(img, [24, 598, 345, 54], { radius: 27 });
      this.stage.scene.add(this.screen.group, this.chat.group);
    }
    if (faces) {
      this.bubbly = sticker(faces, FACES.bubbly.rect, 150, 'coral');
      this.lily = sticker(faces, FACES.lily.rect, 150, 'amber');
      this.stage.scene.add(this.bubbly.group, this.lily.group);
    }
    this.note = banner('Lily liked you back! 💛');
    this.stage.scene.add(this.note.group);
  }

  frame(lt: number) {
    this.camera(lt, [
      { t: 0, pos: [0, 0.1, 1.4], at: [0, 0.02, 0] },
      { t: 0.9, pos: [-0.25, 0.12, 2.45], at: [0, -0.02, 0] },
      { t: 2.45, pos: [-0.05, 0.08, 2.3], at: [0, -0.05, 0], e: ease.inOutCubic },
      { t: 3.311, pos: [0, -0.36, 1.2], at: [0, -0.5, 0], e: ease.inCubic },
    ]);
    // the stickers slide in and bounce when the loops lock
    const inK = ease.outExpo(prog(lt, 0, 0.4)), joy = Math.exp(-Math.max(0, lt - LOCK) * 5) * Math.sin(Math.max(0, lt - LOCK) * 22);
    const hop = (i: number) => Math.abs(Math.sin(Math.max(0, lt - LOCK - i * 0.12) * 7)) * 0.06 * Math.exp(-Math.max(0, lt - LOCK) * 1.6);
    this.bubbly?.setWorld([lerp(-2.4, -0.86, inK), 0.02 + hop(0), 0.15], [0, 0.25, 0.05 * joy], 1.55 * (1 + 0.1 * joy));
    this.lily?.setWorld([lerp(2.4, 0.86, inK), 0.02 + hop(1), 0.15], [0, -0.25, -0.05 * joy], 1.55 * (1 + 0.1 * joy));
    this.bubbly?.shine(lt * 0.4); this.lily?.shine(lt * 0.4 + 0.3);
    // the match screen rises between them
    const s = this.screen;
    if (s) {
      const form = ease.outCubic(prog(lt, LOCK + 0.1, LOCK + 0.55));
      s.setWorld([0, lerp(-1.3, -0.2, form), -0.25], [0, 0, 0], lerp(0.55, 0.8, form));
      s.mesh.material.opacity = form;
      s.group.visible = form > 0.001;
      const swell = ease.inCubic(prog(lt, TAP + 0.25, 3.25));
      const c = this.chat!;
      s.group.updateMatrixWorld(true);
      c.group.position.copy(s.group.localToWorld(new THREE.Vector3(0, -(625 - 426) * UNIT, 0.01 + 0.3 * swell)));
      c.group.quaternion.copy(s.group.quaternion);
      c.group.scale.setScalar(s.group.scale.x * (1 + 6 * swell) * (1 - 0.06 * bump(lt, TAP)));
      c.mesh.material.opacity = form;
      c.group.visible = form > 0.001;
    }
    // the notification drops in from the top, then slides back up
    const n = this.note!;
    const drop = ease.outBack(prog(lt, 0.62, 0.9)) * (1 - ease.inCubic(prog(lt, 1.55, 1.75)));
    n.group.visible = drop > 0.001;
    n.setWorld([0, lerp(1.3, 0.48, drop), 0.5], [0.1, 0, 0], 1.25);
  }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    const cam = this.stage.cam;
    // the loops shoot from each sticker and lock in the middle
    if (this.bubbly && this.lily && lt < LOCK + 0.7) {
      const [bx, by] = this.bubbly.toFrame(cam, 75, 75), [lx, ly] = this.lily.toFrame(cam, 75, 75);
      const mx = (bx + lx) / 2, my = Math.min(by, ly) - 30, size = 260;
      const fly = ease.outExpo(prog(lt, 0.12, LOCK));
      const fade = 1 - prog(lt, LOCK + 0.3, LOCK + 0.7);
      c.save(); c.globalAlpha = fade;
      c.shadowColor = 'rgba(255,140,60,0.8)'; c.shadowBlur = 34;
      drawLoop(c, 'L', mx, my, size * lerp(0.3, 1, fly), C.red, lerp(bx - mx, 0, fly), lerp(by - my, 0, fly), -(1 - fly) * 1.4);
      drawLoop(c, 'R', mx, my, size * lerp(0.3, 1, fly), C.amber, lerp(lx - mx, 0, fly), lerp(ly - my, 0, fly), (1 - fly) * 1.4);
      c.restore();
      const fl = prog(lt, LOCK, LOCK + 0.5);
      if (fl > 0 && fl < 1) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.65 * Math.pow(1 - fl, 3); c.fillStyle = 'rgb(255,150,80)'; c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = 1 - fl; c.strokeStyle = C.amber; c.lineWidth = 7;
        c.beginPath(); c.arc(mx, my, size * 0.6 + 640 * ease.outCubic(fl), 0, Math.PI * 2); c.stroke();
        c.restore();
      }
    }
    // little hearts float up between them
    for (let i = 0; i < 9; i++) {
      const a = lt - LOCK - i * 0.09;
      if (a < 0 || a > 1.4) continue;
      const k = a / 1.4, x = W / 2 + Math.sin(i * 2.1) * 260 + Math.sin(a * 4 + i) * 20, y = H * 0.55 - 420 * ease.outCubic(k);
      c.save(); c.globalAlpha = (1 - k) * 0.9;
      drawHeart(c, x, y, 18 + (i % 3) * 8, i % 2 ? C.red : C.orange);
      c.restore();
    }
    this.headline(c, lt, { x: W / 2, y: 150, size: 80, at: 1.72, until: 2.5, align: 'center', ink: '#FFFFFF', title: 'The vibe is mutual.' });
    if (this.chat) drawPawTap(c, ...this.chat.toFrame(cam, 196, 625), lt - TAP, 80, '#FFFFFF');
    const red = prog(lt, 3.05, 3.3);
    if (red > 0) { c.fillStyle = C.red; c.globalAlpha = clamp(red * 1.2); c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  }
}
