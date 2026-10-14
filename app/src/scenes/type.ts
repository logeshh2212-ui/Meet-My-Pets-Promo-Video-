// Template "type": one to three big centred lines that sharpen into place one after another, with
// an optional accent-coloured word and a smaller line underneath. The keynote "statement" shot.
//
// storyboard: { "template": "type", "duration": 3, "lines": ["Meet My Pets."], "accent": "Pets.", "sub": "..." }
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { fitSize, measure } from '../engine/type';
import { displayFamily, labelFamily, drawReveal, filmEdgeFade, makeSpotlight, pushIn, reveal } from './_launch';

export default class TypeShot extends Scene {
  bg = makeSpotlight(W / 2, H / 2, 900);
  layer = new Layer2D();
  lines: string[] = [];
  size = 160;

  override init() {
    const p = this.ctx.params;
    this.lines = (p.lines as string[] | undefined) ?? ['Your headline here.'];
    // the largest size (max 170 px) at which the longest line fits with 200 px margins
    this.size = Math.min(170, ...this.lines.map((l) => fitSize(l, displayFamily(), W - 400)));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    this.bg.u.k!.value = 0.8 * reveal(f.lt, 0, 1.2);
    this.bg.render(renderer, out);

    const c = this.layer.ctx;
    this.layer.clear();
    pushIn(c, f.p); // the whole shot drifts slowly closer

    const fam = displayFamily(), size = this.size, lh = size * 1.08;
    const sub = params.sub as string | undefined;
    const block = this.lines.length * lh + (sub ? size * 0.6 : 0);
    let y = H / 2 - block / 2 + size * 0.78;

    this.lines.forEach((line, i) => {
      const k = reveal(f.lt, 0.25 + i * 0.45, 1.0); // each line starts 0.45 s after the previous one
      const words = line.split(' ');
      const space = measure(' ', fam, size);
      const widths = words.map((w) => measure(w, fam, size));
      let x = W / 2 - (widths.reduce((a, b) => a + b, 0) + space * (words.length - 1)) / 2;
      words.forEach((w, j) => {
        drawReveal(c, w, x, y, size, fam, k, w === params.accent ? 'signal' : 'bone');
        x += widths[j]! + space;
      });
      y += lh;
    });
    if (sub) drawReveal(c, sub, W / 2, y - lh + size * 0.75, size * 0.3, labelFamily(), reveal(f.lt, 0.45 + this.lines.length * 0.45, 1.0), 'ash', 'center');

    comp.draw(renderer, this.layer.upload(), out);
    return { fade: filmEdgeFade(f, this.ctx) };
  }
}