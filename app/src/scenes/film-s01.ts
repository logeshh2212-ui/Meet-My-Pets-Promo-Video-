// S01 · Hello (0–3.311 s). Text first, then the logo.
//   0.00–1.30  on the quiet build, "Their social life starts here." types itself word by word
//   1.35–1.66  the letters squeeze to the centre while two loops fly in from the sides
//   1.656      THE DROP: the loops lock into the double-loop, the paper bursts into coral
//   1.85–2.45  "MeetMyPets." writes itself under the mark (Love Ya Like A Sister)
//   2.55–3.31  the camera flies through the left loop's hole into the app (warm paper)
import type { Frame } from '../engine/scene';
import { W, H } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { BEAT, C, Shot } from './_shot';
import { drawLoop } from './_mark';

const LINE = ['Their', 'social', 'life', 'starts', 'here.'];
const DROP = 2 * BEAT; // 1.656

export default class Intro extends Shot {
  async setup() { this.makeWorld('hello', { count: 16, center: [0, 0, -0.5], seed: 1 }); }
  frame() { /* everything is 2D */ }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    const cx = W / 2, cy = H / 2;
    // the zoom through the loop at the end: everything scales about the left loop's hole
    const zk = ease.inExpo(prog(lt, DROP + 0.9, 3.311));
    const zoom = Math.pow(26, zk), hole: [number, number] = [cx - 34, cy - 40];
    c.save();
    c.translate(hole[0], hole[1]); c.scale(zoom, zoom); c.translate(-hole[0], -hole[1]);

    // 1. the line types itself, then squeezes into the centre
    const squeeze = ease.inCubic(prog(lt, DROP - 0.3, DROP));
    if (lt < DROP + 0.05) {
      const fam = F.brandDisplay(700), size = 104, space = measure(' ', fam, size);
      const widths = LINE.map((w) => measure(w, fam, size));
      const total = widths.reduce((a, b) => a + b, 0) + space * (LINE.length - 1);
      let x = cx - total / 2;
      c.font = font(fam, size); c.textBaseline = 'middle';
      LINE.forEach((w, i) => {
        const t0 = 0.05 + i * (BEAT / 3.2), k = ease.outBack(prog(lt, t0, t0 + 0.3));
        if (k > 0) {
          const wx = x + widths[i]! / 2;
          c.save();
          c.globalAlpha = clamp(k) * (1 - squeeze);
          c.translate(lerp(wx, cx, squeeze), cy + (1 - Math.min(1, k)) * 40);
          c.scale(lerp(1, 0.15, squeeze), lerp(1, 0.6, squeeze));
          c.fillStyle = w === 'here.' ? C.red : C.ink;
          c.fillText(w, -widths[i]! / 2, 0);
          c.restore();
        }
        x += widths[i]! + space;
      });
    }

    // 2. the drop: a coral burst from the centre fills the frame
    const burst = ease.outExpo(prog(lt, DROP, DROP + 0.45));
    if (burst > 0) {
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#FF2E63'); g.addColorStop(1, '#FF8A3D');
      c.fillStyle = g;
      c.beginPath(); c.arc(cx, cy, Math.hypot(W, H) * 0.6 * burst, 0, Math.PI * 2); c.fill();
      // a white shock ring
      const r = prog(lt, DROP, DROP + 0.5);
      if (r > 0 && r < 1) {
        c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - r)})`; c.lineWidth = 6;
        c.beginPath(); c.arc(cx, cy - 40, 120 + 600 * ease.outCubic(r), 0, Math.PI * 2); c.stroke();
      }
    }

    // 3. the two loops fly in from the sides and lock on the drop
    const fly = ease.outExpo(prog(lt, DROP - 0.35, DROP));
    if (fly > 0) {
      const size = 300, my = cy - 40, settle = 1 + 0.12 * Math.exp(-Math.max(0, lt - DROP) * 7) * Math.cos(Math.max(0, lt - DROP) * 20);
      const col = burst > 0.2 ? '#FFFFFF' : C.red;
      c.save();
      c.translate(cx, my); c.scale(settle, settle); c.translate(-cx, -my);
      drawLoop(c, 'L', cx, my, size, col, -(1 - fly) * 900, 0, -(1 - fly) * 1.2);
      drawLoop(c, 'R', cx, my, size, burst > 0.2 ? '#FFFFFF' : C.orange, (1 - fly) * 900, 0, (1 - fly) * 1.2);
      c.restore();
    }

    // 4. the wordmark writes itself, letter by letter
    const word = 'MeetMyPets.';
    const n = Math.floor(prog(lt, DROP + 0.2, DROP + 0.75) * word.length + 0.0001);
    if (n > 0) {
      const fam = F.wordmark(), size = 118, full = measure(word, fam, size);
      c.font = font(fam, size); c.textBaseline = 'alphabetic'; c.fillStyle = '#FFFFFF';
      c.fillText(word.slice(0, n), cx - full / 2, cy + 230);
    }
    c.restore();

    // the hole opens onto the warm paper of the app's world
    const paper = prog(lt, 3.0, 3.311);
    if (paper > 0) { c.fillStyle = `rgba(255,248,245,${paper})`; c.fillRect(0, 0, W, H); }
  }
}
