// S09 · End (26.488–30.585 s, from the track's final hit to its end). The brand frame.
//   0.00  out of the white flash, Bubbly's coral loop and Lily's amber loop slam together on the final hit
//   0.15  they become the woven logo (mmp_mark_film.svg)
//   0.83  "MeetMyPets." writes itself (Love Ya Like A Sister)
//   1.24  "The Social App for Every Pet"     1.66  the "Download now" button
//   then the frame holds, still, to the last frame (the music has faded by ~2.8 s)
import type { Frame } from '../engine/scene';
import { W, H } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { BEAT, C, Shot } from './_shot';
import { drawLoop } from './_mark';

export default class End extends Shot {
  mark: HTMLImageElement | null = null;

  async setup() {
    this.makeWorld('end', { count: 14, center: [0, 0, -0.5], seed: 23 });
    this.punch = 0.012;
    this.mark = await this.img('assets/brand/mmp_mark_film.svg');
  }

  frame() { /* 2D only */ }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    const cx = W / 2, my = H * 0.33, size = 330;
    // the loops slam together
    const fly = ease.outExpo(prog(lt, 0, 0.16));
    const woven = prog(lt, 0.12, 0.32);
    const settle = 1 + 0.08 * Math.exp(-lt * 6) * Math.cos(lt * 22);
    c.save();
    c.translate(cx, my); c.scale(settle, settle); c.translate(-cx, -my);
    if (woven < 1) {
      c.globalAlpha = 1 - woven;
      drawLoop(c, 'L', cx, my, size, C.red, -(1 - fly) * 700, 0, -(1 - fly) * 1.2);
      drawLoop(c, 'R', cx, my, size, C.amber, (1 - fly) * 700, 0, (1 - fly) * 1.2);
    }
    if (this.mark && woven > 0) {
      c.globalAlpha = woven;
      const glow = 0.04 * Math.sin(lt * 2.2);
      c.drawImage(this.mark, cx - size / 2 * (1 + glow * 0.3), my - size / 2 * (1 + glow * 0.3), size * (1 + glow * 0.3), size * (1 + glow * 0.3));
    }
    c.restore();
    // a soft ring from the hit
    const r = prog(lt, 0, 0.6);
    if (r > 0 && r < 1) { c.strokeStyle = `rgba(255,122,0,${0.6 * (1 - r)})`; c.lineWidth = 5; c.beginPath(); c.arc(cx, my, size * 0.55 + 520 * ease.outCubic(r), 0, Math.PI * 2); c.stroke(); }
    // white flash fading off (continuing S08's)
    const fl = 1 - prog(lt, 0, 0.25);
    if (fl > 0) { c.fillStyle = `rgba(255,255,255,${fl})`; c.fillRect(0, 0, W, H); }

    // the wordmark writes itself
    const word = 'MeetMyPets.', fam = F.wordmark(), ws = 136;
    const n = Math.floor(prog(lt, BEAT, BEAT + 0.4) * word.length + 1e-4);
    if (n > 0) {
      const full = measure(word, fam, ws), x0 = cx - full / 2;
      c.font = font(fam, ws); c.textBaseline = 'alphabetic';
      const shown = word.slice(0, n), cut = Math.min(n, 6);
      c.fillStyle = C.ink; c.fillText(shown.slice(0, cut), x0, H * 0.65);
      if (n > 6) { c.fillStyle = C.red; c.fillText(shown.slice(6), x0 + measure('MeetMy', fam, ws), H * 0.65); }
    }
    const kt = ease.outCubic(prog(lt, 1.5 * BEAT, 1.5 * BEAT + 0.45));
    if (kt > 0) {
      c.globalAlpha = kt;
      c.font = font(F.brandBody(400), 42); c.fillStyle = C.grey; c.textAlign = 'center';
      c.fillText('The Social App for Every Pet', cx, H * 0.745 + (1 - kt) * 16);
      c.globalAlpha = 1; c.textAlign = 'left';
    }
    const kb = ease.outBack(prog(lt, 2 * BEAT, 2 * BEAT + 0.4));
    if (kb > 0) {
      const label = 'Download now', fb = F.brandBody(600), w = measure(label, fb, 34) + 80, h = 72;
      c.save();
      c.translate(cx, H * 0.85); c.scale(kb, kb);
      c.globalAlpha = clamp(kb);
      // a filled call-to-action button (the app's red), with a soft glow
      c.shadowColor = 'rgba(255,23,68,0.35)'; c.shadowBlur = 24; c.shadowOffsetY = 6;
      c.fillStyle = C.red;
      c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h / 2); c.fill();
      c.shadowColor = 'transparent';
      c.font = font(fb, 34); c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(label, 0, 2);
      c.restore();
    }
  }
}

export { lerp };
