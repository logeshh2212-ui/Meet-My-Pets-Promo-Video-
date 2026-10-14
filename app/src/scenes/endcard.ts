// Template "endcard": the paw logo scales in, the app name sharpens with a light sweep across it,
// then the tagline and a small availability note. The film fades to black at its end.
//
// storyboard: { "template": "endcard", "duration": 4.5, "name": "Meet My Pets",
//               "tagline": "Every pet. One home.", "note": "Coming soon on iOS and Android" }
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { font, measure } from '../engine/type';
import { rgba } from '../engine/palette';
import { lerp, prog } from '../engine/util';
import { T, drawPaw, drawReveal, displayFamily, labelFamily, filmEdgeFade, makeSpotlight, reveal } from './_launch';

export default class EndcardShot extends Scene {
  layer = new Layer2D();
  bg = makeSpotlight(W / 2, H / 2 - 40, 800);

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    this.bg.u.k!.value = reveal(f.lt, 0, 1.2);
    this.bg.render(renderer, out);

    const c = this.layer.ctx;
    this.layer.clear();

    // 1. logo: the paw scales up from 60 % as it fades in
    const kl = reveal(f.lt, 0.1, 1.0);
    c.save();
    c.globalAlpha = kl;
    c.translate(W / 2, 380);
    c.scale(0.6 + 0.4 * kl, 0.6 + 0.4 * kl);
    drawPaw(c, 0, 0, 150, rgba('signal'));
    c.restore();

    // 2. the name, then a soft light sweeping across it (drawn only over the name's own pixels)
    const name = (params.name as string | undefined) ?? T.brand.name;
    const fam = displayFamily(), size = 120, y = 620;
    const w = drawReveal(c, name, W / 2, y, size, fam, reveal(f.lt, 0.5, 1.0), 'bone', 'center');
    const s = prog(f.lt, 1.5, 2.6);
    if (s > 0 && s < 1) {
      const sx = lerp(W / 2 - w / 2 - 300, W / 2 + w / 2 + 300, s);
      const g = c.createLinearGradient(sx - 160, 0, sx + 160, 0);
      g.addColorStop(0, rgba('signal', 0));
      g.addColorStop(0.5, rgba('ember', 0.9));
      g.addColorStop(1, rgba('signal', 0));
      c.save();
      c.globalCompositeOperation = 'source-atop'; // paint only where the name already is
      c.fillStyle = g;
      c.fillRect(W / 2 - w / 2 - 20, y - size, w + 40, size * 1.4);
      c.restore();
    }

    // 3. tagline and the small availability note
    const tagline = (params.tagline as string | undefined) ?? T.brand.tagline;
    drawReveal(c, tagline, W / 2, y + 90, 48, labelFamily(), reveal(f.lt, 0.9, 1.0), 'ash', 'center');
    const note = params.note as string | undefined;
    if (note) {
      c.font = font(labelFamily(), 28);
      c.fillStyle = rgba('ash', 0.8 * reveal(f.lt, 1.4, 0.8));
      c.fillText(note, W / 2 - measure(note, labelFamily(), 28) / 2, 900);
    }

    comp.draw(renderer, this.layer.upload(), out);
    return { fade: filmEdgeFade(f, this.ctx) };
  }
}