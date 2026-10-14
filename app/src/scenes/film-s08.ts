// S08 · Everything (one bar, 23.177–26.488 s). One feature per beat, whip-fast, with one word each:
//   beat 0  "Discover."  Lily's card whips in
//   beat 1  "Connect."   the match screen whips in
//   beat 2  "Belong."    the chat bubbles whip in
//   beat 3  everything swirls round Bubbly's photo and collapses into a point (the final hit is next)
import type { Frame } from '../engine/scene';
import { W, H } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { Widget } from './_ui';
import { BEAT, C, Shot, tagType } from './_shot';

const WORDS = ['Discover.', 'Connect.', 'Belong.'];

function canvas(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas');
  cv.width = w * 4; cv.height = h * 4;
  const c = cv.getContext('2d')!;
  c.scale(4, 4); draw(c);
  return cv;
}

export default class Montage extends Shot {
  items: Widget[] = [];
  coin: Widget | null = null;

  async setup() {
    this.makeWorld('montage', { count: 18, center: [0.5, 0, -0.5], seed: 21 });
    this.punch = 0.04; // harder hits in the montage
    const disc = await this.img('assets/figma/Discover page.png');
    const match = await this.img('assets/figma_rebuilt/match@4x.png');
    if (disc) this.items.push(new Widget(disc, [25, 207, 345, 499], { radius: 30 }).slab(0.03));
    if (match) this.items.push(new Widget(match, [0, 0, 393, 852], { radius: 44 }).slab(0.03, '#2A1A1C'));
    const fam = F.brandBody(400);
    const sw = measure('Playdate at the park?', fam, 14) + 30, rw = measure('Yes! See you at 5 🐾', fam, 14) + 30;
    this.items.push(new Widget(canvas(260, 84, (c) => {
      c.font = font(fam, 14); c.textBaseline = 'middle';
      c.fillStyle = C.orange; c.beginPath(); c.roundRect(260 - sw, 0, sw, 32, 16); c.fill();
      c.fillStyle = '#FFFFFF'; c.fillText('Playdate at the park?', 260 - sw + 15, 17);
      c.fillStyle = '#FFDFC1'; c.beginPath(); c.roundRect(0, 50, rw, 32, 16); c.fill();
      c.fillStyle = C.ink; c.fillText('Yes! See you at 5 🐾', 15, 67);
    }), [0, 0, 260, 84], { scale: 4 }));
    // Bubbly's photo in her coral loop (the coin from S03)
    this.coin = new Widget(canvas(120, 120, (c) => {
      c.save(); c.beginPath(); c.arc(60, 60, 50, 0, Math.PI * 2); c.clip();
      if (disc) c.drawImage(disc, 117 * 4, 94 * 4, 75 * 4, 75 * 4, 10, 10, 100, 100);
      c.restore();
      const g = c.createLinearGradient(0, 0, 120, 120); g.addColorStop(0, C.red); g.addColorStop(1, C.orange);
      c.strokeStyle = g; c.lineWidth = 7; c.beginPath(); c.arc(60, 60, 55, 0, Math.PI * 2); c.stroke();
    }), [0, 0, 120, 120], { scale: 4 });
    for (const w of [...this.items, this.coin]) this.stage.scene.add(w.group);
  }

  frame(lt: number) {
    const kick = Math.exp(-((lt % BEAT) / 0.12)); // a small punch-in on every beat
    this.camera(lt, [{ t: 0, pos: [0, 0, 3.2 - 0.12 * kick], at: [0.45, 0, 0] }]);
    const scales = [1.6, 1.2, 3.0];
    this.items.forEach((w, i) => {
      const t0 = i * BEAT;
      const inK = ease.outExpo(prog(lt, t0, t0 + 0.28));
      const outK = i < 2 ? ease.inExpo(prog(lt, t0 + BEAT - 0.18, t0 + BEAT)) : 0;
      // beat 3: everything comes back and swirls round the coin, shrinking into a point
      const sw = prog(lt, 3 * BEAT, 3.25), a = i * 2.1 + sw * 7;
      const swirl = ease.inCubic(sw);
      w.group.visible = lt >= t0 - 0.01;
      const base: [number, number, number] = [lerp(2.6, 0.62, inK) - 2.8 * outK, (i === 1 ? -1 : 1) * 0.6 * outK, 0];
      const swirlPos: [number, number, number] = [0.55 + Math.cos(a) * 0.7 * (1 - swirl), Math.sin(a) * 0.45 * (1 - swirl), 0];
      const s = scales[i]! * (sw > 0 ? 0.55 * (1 - swirl) : 1);
      w.setWorld(sw > 0 ? swirlPos : base, [0, lerp(-0.8, -0.2, inK), (sw > 0 ? a * 0.1 : 0)], Math.max(0.001, s), 0.2);
      if (sw > 0) w.group.visible = true;
    });
    const coin = this.coin!;
    const ck = ease.outBack(prog(lt, 3 * BEAT, 3 * BEAT + 0.25)) * (1 - ease.inCubic(prog(lt, 3.05, 3.26)));
    coin.group.visible = ck > 0.001;
    coin.setWorld([0.55, 0, 0.2], [0, 0, 0], Math.max(0.001, 2.4 * ck), 0.25);
  }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    WORDS.forEach((w, i) => tagType(c, lt, { title: w, accent: i === 2 ? w : '', x: 130, y: 600, size: 150, at: i * BEAT + 0.02, until: (i + 1) * BEAT, ink: '#FFFFFF' }));
    // the collapse ends in a white flash (the final hit follows)
    const fl = prog(lt, 3.15, 3.311);
    if (fl > 0) { c.fillStyle = `rgba(255,255,255,${clamp(fl * 1.4)})`; c.fillRect(0, 0, W, H); }
  }
}
