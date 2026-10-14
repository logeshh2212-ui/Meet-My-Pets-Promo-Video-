// Template "title": cinematic kinetic type in a dark studio. Words rise one after another from
// behind an invisible edge, an optional kicker label sits above, and out-of-focus lights drift
// behind while the frame slowly pushes in.
//
// storyboard: { "template": "title", "beats": 8, "kicker": "Introducing",
//               "lines": ["Every pet", "has a story."], "accent": "story.", "sub": "..." }
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { fitSize } from '../engine/type';
import { displayFamily, filmEdgeFade, pushIn, reveal } from './_launch';
import { bodyText, kicker, kineticBlock, makeBackdrop, textOut, updateBackdrop } from './_cine';

export default class TitleShot extends Scene {
  bg = makeBackdrop();
  layer = new Layer2D();
  lines: string[] = [];
  size = 150;

  override init() {
    this.lines = (this.ctx.params.lines as string[] | undefined) ?? ['Your headline here.'];
    // the largest size (at most 150 px) at which every line fits with 180 px margins
    this.size = Math.min(150, ...this.lines.map((l) => fitSize(l, displayFamily(), W - 360)));
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    const dur = f.end - f.start;
    // the camera drifts: the bokeh slides against it, nearer lights faster (parallax)
    updateBackdrop(this.bg, f.t, reveal(f.lt, 0, 1.5), W / 2, H / 2, [-f.lt * 30, f.lt * 6]);
    this.bg.render(renderer, out);

    const c = this.layer.ctx;
    this.layer.clear();
    pushIn(c, f.p, 0.05);

    const size = this.size, n = this.lines.length;
    const sub = params.sub as string | undefined;
    // centre the block (headline lines + the sub line) vertically
    const blockH = (n - 1) * size * 1.05 + (sub ? size * 0.75 : 0);
    const y1 = H / 2 - blockH / 2 + size * 0.35;
    if (params.kicker) kicker(c, params.kicker as string, W / 2, y1 - size - 10, f.lt, 0.15, 'center');
    const yLast = kineticBlock(c, this.lines, W / 2, y1, size, f.lt, 0.35, { align: 'center', accent: params.accent as string | string[] | undefined, gap: 0.22 });
    if (sub) bodyText(c, sub, W / 2, yLast + size * 0.7, Math.max(30, size * 0.26), W - 400, f.lt, 0.6 + n * 0.22, 'center');

    comp.draw(renderer, this.layer.upload(), out, { opacity: textOut(f.lt, dur, params.exit) });
    return { fade: filmEdgeFade(f, this.ctx) };
  }
}
