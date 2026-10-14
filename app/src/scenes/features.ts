// Template "features": a heading, then two to four feature cards that rise in one after another.
//
// storyboard: { "template": "features", "duration": 6, "heading": "Made for pet people.",
//               "items": [{ "title": "Profiles", "text": "Photos, birthdays and quirks." }, ...] }
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { font, measure } from '../engine/type';
import { rgba } from '../engine/palette';
import { drawPaw, drawReveal, displayFamily, labelFamily, filmEdgeFade, makeSpotlight, pushIn, reveal } from './_launch';

type Item = { title: string; text: string };
const CARD_W = 440, CARD_H = 320, GAP = 48, TOP = 430;

/** Splits text into lines no wider than maxW. */
function wrap(text: string, family: string, size: number, maxW: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(' ')) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && measure(next, family, size) > maxW) { lines.push(cur); cur = word; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

export default class FeaturesShot extends Scene {
  layer = new Layer2D();
  bg = makeSpotlight(W / 2, H / 2 + 120, 900);
  items: Item[] = [];

  override init() {
    this.items = ((this.ctx.params.items as Item[] | undefined) ?? []).slice(0, 4);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    this.bg.u.k!.value = 0.7 * reveal(f.lt, 0, 1.2);
    this.bg.render(renderer, out);

    const c = this.layer.ctx;
    this.layer.clear();
    pushIn(c, f.p, 0.03);

    const heading = params.heading as string | undefined;
    if (heading) drawReveal(c, heading, W / 2, 300, 84, displayFamily(), reveal(f.lt, 0.15, 1.0), 'bone', 'center');

    const n = this.items.length;
    const x0 = W / 2 - (n * CARD_W + (n - 1) * GAP) / 2;
    const lab = labelFamily();
    this.items.forEach((it, i) => {
      const k = reveal(f.lt, 0.6 + i * 0.25, 0.9); // cards 0.25 s apart
      if (k <= 0) return;
      const x = x0 + i * (CARD_W + GAP), y = TOP + (1 - k) * 60;
      c.save();
      c.globalAlpha = k;
      c.fillStyle = rgba('ink2');
      c.beginPath(); c.roundRect(x, y, CARD_W, CARD_H, 36); c.fill();
      drawPaw(c, x + 70, y + 76, 64, rgba('signal'));
      c.fillStyle = rgba('bone');
      c.font = font(displayFamily(), 44);
      c.fillText(it.title, x + 40, y + 180);
      c.fillStyle = rgba('ash');
      c.font = font(lab, 28);
      wrap(it.text, lab, 28, CARD_W - 80).forEach((line, j) => c.fillText(line, x + 40, y + 228 + j * 38));
      c.restore();
    });

    comp.draw(renderer, this.layer.upload(), out);
    return { fade: filmEdgeFade(f, this.ctx) };
  }
}