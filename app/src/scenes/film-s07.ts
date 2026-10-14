// S07 · Chat (one bar, 19.866–23.177 s). "Conversation in the air": Bubbly's sticker on the left, Lily's
// (Online) on the right, a keyboard and the message box below them. The messages fly between them.
//   0.00  the red of "Chat Now" wipes up off the scene
//   0.40  "Playdate at the park?" types in, each key lighting up
//   1.66  paw-tap send: the orange bubble flies in an arc from Bubbly's side across to Lily; she bounces
//   2.08  typing dots by Lily; 2.50 her reply flies back across to Bubbly: "Yes! See you at 5 🐾"
// The bubbles, the message box and the keyboard are drawn in code in the app's chat style (Messaging page).
import type { Frame } from '../engine/scene';
import { W, H } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { Widget, drawPawTap, typed } from './_ui';
import { FACES, Keyboard, src, sticker } from './_kit';
import { C, Shot, bump } from './_shot';

const SENT = 'Playdate at the park?', REPLY = 'Yes! See you at 5 🐾';
const T = { type: 0.4, per: 0.05, send: 1.68, fly: 1.72, land: 2.05, dots: 2.1, reply: 2.5, back: 2.82 };

function bubble(text: string, sent: boolean): Widget {
  const fam = F.brandBody(400), size = 15, w = Math.ceil(measure(text, fam, size) + 32), h = 36;
  return new Widget(src(w, h, (c) => {
    c.fillStyle = sent ? C.orange : '#FFDFC1'; c.beginPath(); c.roundRect(0, 0, w, h, 18); c.fill();
    c.font = font(fam, size); c.fillStyle = sent ? '#FFFFFF' : C.ink; c.textBaseline = 'middle'; c.fillText(text, 16, h / 2 + 1);
  }), [0, 0, w, h], { scale: 4, radius: 18 }).slab(0.025, sent ? '#FF7A00' : '#FFDFC1');
}

export default class Chat extends Shot {
  kb = new Keyboard();
  bubbly: Widget | null = null;
  lily: Widget | null = null;
  input!: Widget;
  sent!: Widget;
  reply!: Widget;
  dots!: Widget;

  async setup() {
    this.makeWorld('chat', { floorY: -0.95, center: [0, 0, -0.3], seed: 17 });
    const faces = await this.img(FACES.bubbly.file);
    if (faces) {
      this.bubbly = sticker(faces, FACES.bubbly.rect, 150, 'coral');
      this.lily = sticker(faces, FACES.lily.rect, 150, 'amber');
      this.stage.scene.add(this.bubbly.group, this.lily.group);
    }
    this.input = new Widget(src(340, 52, () => {}), [0, 0, 340, 52], { scale: 4, radius: 26 }).slab(0.025);
    this.sent = bubble(SENT, true);
    this.reply = bubble(REPLY, false);
    this.dots = new Widget(src(64, 36, () => {}), [0, 0, 64, 36], { scale: 4, radius: 18 }).slab(0.02, '#FFDFC1');
    for (const w of [this.input, this.sent, this.reply, this.dots, this.kb.widget]) this.stage.scene.add(w.group);
  }

  frame(lt: number) {
    this.camera(lt, [
      { t: 0, pos: [-0.7, 0.05, 2.7], at: [0, -0.05, 0] },
      { t: 1.6, pos: [-0.45, 0.02, 2.55], at: [0, -0.05, 0], e: ease.inOutCubic },
      { t: 2.05, pos: [0.45, 0.06, 2.45], at: [0.05, 0.05, 0], e: ease.inOutExpo },
      { t: 3.311, pos: [0.05, 0.02, 2.45], at: [0, 0.05, 0], e: ease.inOutCubic },
    ]);
    // the two pets, each bouncing when a message reaches them
    const hop = (t0: number) => Math.abs(Math.sin(Math.max(0, lt - t0) * 9)) * 0.07 * Math.exp(-Math.max(0, lt - t0) * 4) * (lt > t0 ? 1 : 0);
    this.bubbly?.setWorld([-1.0, 0.22 + hop(T.back + 0.2), 0], [0, 0.3, 0], 1.35);
    this.lily?.setWorld([1.0, 0.22 + hop(T.land), 0], [0, -0.3, 0], 1.35);
    // the keyboard and the message box
    this.kb.widget.setWorld([0, -0.78, 0.35], [-1.05, 0, 0], 2.0);
    const ch = lt >= T.type && lt < T.send ? SENT[Math.floor((lt - T.type) / T.per)] ?? '' : '';
    this.kb.draw((lt - T.type) % T.per < T.per * 0.7 ? ch : '');
    this.input.setWorld([0, -0.3, 0.35], [-0.12, 0, 0], 1.75 * (1 - 0.03 * bump(lt, T.send)));
    const text = lt >= T.type && lt < T.fly ? typed(SENT, lt, T.type, T.per) : '';
    this.input.drawKeyed(`i${text.length}${bump(lt, T.send) > 0}`, (c) => {
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.roundRect(0, 0, 340, 52, 26); c.fill();
      c.font = font(F.brandBody(400), 16); c.textBaseline = 'middle';
      if (text) { c.fillStyle = C.ink; c.fillText(text, 20, 27); } else { c.fillStyle = '#98A0B3'; c.fillText('Message...', 20, 27); }
      c.fillStyle = C.orange; c.beginPath(); c.arc(312, 26, 20, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(304, 17); c.lineTo(322, 26); c.lineTo(304, 35); c.lineTo(307, 26); c.closePath(); c.fill();
    }, 0);
    // the sent bubble: from the message box, in an arc, across to Lily's side
    const f = ease.inOutCubic(prog(lt, T.fly, T.land));
    this.sent.group.visible = lt >= T.fly;
    this.sent.setWorld([lerp(-0.1, 0.3, f), lerp(-0.3, 0.36, f) + Math.sin(f * Math.PI) * 0.22, lerp(0.35, 0.12, f)], [0, -0.1 * f, 0.15 * Math.sin(f * Math.PI)], 1.6);
    this.sent.shine(lt * 0.5);
    // typing dots by Lily, then her reply flies back across to Bubbly
    const dk = ease.outBack(prog(lt, T.dots, T.dots + 0.2)) * (1 - prog(lt, T.reply, T.reply + 0.06));
    this.dots.group.visible = dk > 0.01;
    this.dots.setWorld([0.62, 0.05, 0.12], [0, -0.15, 0], 1.6 * Math.max(0.01, dk));
    this.dots.drawKeyed(`d${Math.round(lt * 24)}`, (c) => {
      c.fillStyle = '#FFDFC1'; c.beginPath(); c.roundRect(0, 0, 64, 36, 18); c.fill();
      c.fillStyle = C.grey;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(18 + i * 14, 18 - 4 * Math.max(0, Math.sin(lt * 14 - i * 0.9)), 3.6, 0, Math.PI * 2); c.fill(); }
    }, 0);
    const r = ease.inOutCubic(prog(lt, T.reply, T.back));
    this.reply.group.visible = lt >= T.reply;
    this.reply.setWorld([lerp(0.75, -0.25, r), lerp(0.1, 0.12, r) + Math.sin(r * Math.PI) * 0.22, 0.12], [0, 0.1 * r, -0.15 * Math.sin(r * Math.PI)], 1.6 * ease.outBack(prog(lt, T.reply, T.reply + 0.2)));
    this.reply.shine(lt * 0.5 + 0.4);
  }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    const cam = this.stage.cam;
    const wipe = ease.inOutCubic(prog(lt, 0, 0.32));
    if (wipe < 1) { c.fillStyle = C.red; c.fillRect(0, 0, W, H * (1 - wipe)); }
    // names under the stickers (Lily is Online, as in the app's chat header)
    c.save();
    c.textAlign = 'center'; c.font = font(F.brandDisplay(700), 34);
    if (this.bubbly) { const [x, y] = this.bubbly.toFrame(cam, 75, 175); c.fillStyle = C.ink; c.fillText('Bubbly', x, y); }
    if (this.lily) {
      const [x, y] = this.lily.toFrame(cam, 75, 175);
      c.fillStyle = C.orange; c.fillText('Lily', x, y);
      c.font = font(F.brandBody(400), 22); c.fillStyle = C.grey; c.fillText('Online', x + 10, y + 34);
      c.fillStyle = '#34C759'; c.beginPath(); c.arc(x - 34, y + 26, 6, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    this.headline(c, lt, { x: W / 2, y: 140, size: 84, at: 0.35, until: 1.7, align: 'center', title: 'Say hello.' });
    const [sx, sy] = this.input.toFrame(cam, 312, 26);
    drawPawTap(c, sx, sy, lt - T.send, 70);
    const ch = lt >= T.type && lt < T.send ? SENT[Math.floor((lt - T.type) / T.per)] ?? '' : '';
    const kc = ch ? this.kb.keyCenter(ch) : null;
    if (kc && (lt - T.type) % T.per < T.per * 0.7) drawPawTap(c, ...this.kb.widget.toFrame(cam, kc[0], kc[1]), 0.05, 46);
    return void clamp;
  }
}
