// More building blocks for the film, drawn in code in the app's style (warm whites, coral, orange):
//   sticker()   a pet's round photo with a white border (and an optional brand ring), as a thick 3D disc
//   Keyboard    a phone keyboard whose keys light up as the text types (sync it with typed())
//   banner()    a notification banner: "MeetMyPets · now — Lily liked you back! 💛"
//   pawTrail()  paw prints that walk across the frame, appearing one by one and fading
import { F, font, measure } from '../engine/type';
import { clamp, ease, prog } from '../engine/util';
import { Widget } from './_ui';
import { drawLoop, markGradient } from './_mark';
import { drawPaw } from './_launch';

const RED = '#FF1744', ORANGE = '#FF7A00', INK = '#212738', GREY = '#667086';

/** A canvas `w` x `h` design units at 4x, painted by `draw` in design units. */
export function src(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w * 4); cv.height = Math.ceil(h * 4);
  const c = cv.getContext('2d')!;
  c.scale(4, 4);
  draw(c);
  return cv;
}

/** Bubbly and Lily: where their faces are in the Figma exports (source px of a @4x export). */
export const FACES = {
  bubbly: { file: 'assets/figma/Discover page.png', rect: [117 * 4, 94 * 4, 75 * 4, 75 * 4] as const },
  lily: { file: 'assets/figma/Discover page.png', rect: [120 * 4, 340 * 4, 260 * 4, 260 * 4] as const },
};

/**
 * A pet sticker: the face cropped round, a thick white border, optionally a brand-gradient ring
 * (coral for Bubbly, amber for Lily), as a thick white 3D disc. `d` = diameter in design units.
 */
export function sticker(img: HTMLImageElement, rect: readonly [number, number, number, number], d = 120, ring: 'coral' | 'amber' | null = null): Widget {
  const cv = src(d, d, (c) => {
    const r = d / 2;
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(r, r, r, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(r, r, r - 7, 0, Math.PI * 2); c.clip();
    c.drawImage(img, rect[0], rect[1], rect[2], rect[3], 7, 7, d - 14, d - 14);
    c.restore();
    if (ring) {
      const g = c.createLinearGradient(0, d, d, 0);
      if (ring === 'coral') { g.addColorStop(0, RED); g.addColorStop(1, ORANGE); } else { g.addColorStop(0, ORANGE); g.addColorStop(1, '#FFC107'); }
      c.strokeStyle = g; c.lineWidth = 5; c.beginPath(); c.arc(r, r, r - 3, 0, Math.PI * 2); c.stroke();
    }
  });
  return new Widget(cv, [0, 0, d, d], { scale: 4, radius: d / 2 }).slab(0.03, '#FFFFFF', true);
}

/** A phone keyboard (warm light style). draw(pressed) lights the key just typed and shows its preview. */
export class Keyboard {
  widget: Widget;
  static ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  constructor() {
    this.widget = new Widget(src(393, 236, () => {}), [0, 0, 393, 236], { scale: 4, radius: 22 }).slab(0.02, '#F2EDED');
    this.draw('');
  }
  /** Where a key's centre is on the keyboard (design units), for placing a paw on it. */
  keyCenter(ch: string): [number, number] | null {
    const r = this.keyRect(ch === '@' || ch === '.' ? ' ' : ch);
    return r ? [r[0] + r[2] / 2, r[1] + r[3] / 2] : null;
  }
  private keyRect(ch: string): [number, number, number, number] | null {
    const kw = 33, kh = 42, gap = 6;
    for (let r = 0; r < 3; r++) {
      const row = Keyboard.ROWS[r]!, i = row.indexOf(ch.toLowerCase());
      if (i < 0) continue;
      const x0 = (393 - (row.length * kw + (row.length - 1) * gap)) / 2;
      return [x0 + i * (kw + gap), 14 + r * (kh + 12), kw, kh];
    }
    if (ch === ' ') return [98, 14 + 3 * 54, 196, 42];
    return null;
  }
  /** Repaints with `pressed` (the character just typed) lit; only when it changes. */
  draw(pressed: string) {
    this.widget.drawKeyed(`k${pressed}`, (c) => {
      c.fillStyle = '#EFE9E9'; c.fillRect(0, 0, 393, 236);
      c.font = font(F.brandBody(400), 19); c.textAlign = 'center'; c.textBaseline = 'middle';
      const key = (r: [number, number, number, number], label: string, on: boolean, dark = false) => {
        c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.roundRect(r[0], r[1] + 1.5, r[2], r[3], 7); c.fill();
        c.fillStyle = on ? '#FFE3CC' : dark ? '#DCD4D4' : '#FFFFFF'; c.beginPath(); c.roundRect(r[0], r[1], r[2], r[3], 7); c.fill();
        c.fillStyle = on ? ORANGE : INK; c.fillText(label, r[0] + r[2] / 2, r[1] + r[3] / 2 + 1);
      };
      for (const row of Keyboard.ROWS) for (const ch of row) key(this.keyRect(ch)!, ch, ch === pressed.toLowerCase());
      key([12, 176, 76, 42], '123', false, true);
      key(this.keyRect(' ')!, 'space', pressed === ' ');
      key([304, 176, 77, 42], 'return', false, true);
    }, 1);
  }
}

/** A notification banner, as the phone shows it: the app's mark, "MeetMyPets", "now", and the message. */
export function banner(message: string): Widget {
  const w = 360, h = 74;
  const cv = src(w, h, (c) => {
    c.fillStyle = 'rgba(255,255,255,0.97)'; c.beginPath(); c.roundRect(0, 0, w, h, 20); c.fill();
    c.fillStyle = '#FFF1EA'; c.beginPath(); c.roundRect(12, 13, 48, 48, 12); c.fill();
    drawLoop(c, 'L', 36, 37, 38, markGradient(c, 36, 37, 38));
    drawLoop(c, 'R', 36, 37, 38, markGradient(c, 36, 37, 38));
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.font = font(F.brandDisplay(700), 14); c.fillStyle = INK; c.fillText('MeetMyPets', 72, 32);
    c.font = font(F.brandBody(400), 12); c.fillStyle = GREY; c.textAlign = 'right'; c.fillText('now', w - 16, 32);
    c.textAlign = 'left'; c.font = font(F.brandBody(400), 14.5); c.fillStyle = INK; c.fillText(message, 72, 54);
  });
  return new Widget(cv, [0, 0, w, h], { scale: 4, radius: 20 }).slab(0.02, '#FFFFFF');
}

/**
 * Paw prints walking from (x0, y0) to (x1, y1): `n` prints, alternating left/right, the first at t0 and
 * one every `dt` seconds; each fades out 0.6 s after it lands.
 */
export function pawTrail(c: CanvasRenderingContext2D, lt: number, x0: number, y0: number, x1: number, y1: number, t0: number, n = 7, dt = 0.07, size = 46, color = 'rgba(255,23,68,0.85)') {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  for (let i = 0; i < n; i++) {
    const a = lt - (t0 + i * dt);
    if (a < 0 || a > 0.9) continue;
    const k = i / Math.max(1, n - 1), side = i % 2 ? 1 : -1;
    const x = x0 + (x1 - x0) * k - Math.sin(ang) * side * size * 0.45, y = y0 + (y1 - y0) * k + Math.cos(ang) * side * size * 0.45;
    const pop = ease.outBack(clamp(a / 0.15)), fade = 1 - prog(a, 0.5, 0.9);
    c.save();
    c.globalAlpha = fade;
    c.translate(x, y); c.rotate(ang + Math.PI / 2); c.scale(pop, pop);
    drawPaw(c, 0, 0, size, color);
    c.restore();
  }
}

export { measure };
