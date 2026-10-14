// Template "logo": the closing brand moment. The app icon resolves out of a blur with a glow behind
// it, a beam of light sweeps across it, then the name rises, the tagline fades up and a small
// availability note appears. The film fades to black at its end.
//
// storyboard: { "template": "logo", "beats": 10, "logo": "assets/logo.png", "name": "Meet My Pets",
//               "tagline": "Every pet. One home.", "note": "Coming soon on iOS and Android" }
// Without a logo file it draws an app icon: a paw on the accent gradient.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { font, measure } from '../engine/type';
import { rgba } from '../engine/palette';
import { ease, lerp, prog } from '../engine/util';
import { T, drawPaw, filmEdgeFade, labelFamily, loadImage, reveal } from './_launch';
import { bodyText, kineticLine, makeBackdrop, updateBackdrop } from './_cine';

const ICON = 210, ICON_Y = 390; // icon size and centre (px)

export default class LogoShot extends Scene {
  bg = makeBackdrop();
  layer = new Layer2D();
  logo: HTMLImageElement | null = null;

  override async init() {
    this.logo = await loadImage((this.ctx.params.logo as string | undefined) ?? 'assets/logo.png');
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    updateBackdrop(this.bg, f.t, reveal(f.lt, 0, 1.4), W / 2, ICON_Y, [0, f.lt * 10], 0.6);
    this.bg.render(renderer, out);

    const c = this.layer.ctx;
    this.layer.clear();

    // 1. glow, then the icon resolving out of a blur as it settles to full size
    const k = prog(f.lt, 0.15, 1.4, ease.outExpo);
    if (k > 0) {
      const glow = c.createRadialGradient(W / 2, ICON_Y, 0, W / 2, ICON_Y, 300);
      glow.addColorStop(0, rgba('signal', 0.28 * k));
      glow.addColorStop(1, rgba('signal', 0));
      c.fillStyle = glow;
      c.fillRect(W / 2 - 300, ICON_Y - 300, 600, 600);

      c.save();
      c.globalAlpha = Math.min(1, k * 1.4);
      c.filter = k < 1 ? `blur(${((1 - k) * 22).toFixed(2)}px)` : 'none';
      c.translate(W / 2, ICON_Y);
      c.scale(lerp(0.8, 1, k), lerp(0.8, 1, k));
      this.drawIcon(c);
      // 2. a beam of light sweeps across the icon (clipped to its shape)
      const s = prog(f.lt, 1.4, 2.3, ease.inOutCubic);
      if (s > 0 && s < 1) {
        c.beginPath(); c.roundRect(-ICON / 2, -ICON / 2, ICON, ICON, ICON * 0.22); c.clip();
        const sx = lerp(-ICON * 1.2, ICON * 1.2, s);
        const g = c.createLinearGradient(sx - 70, -ICON / 2, sx + 70, ICON / 2);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = g;
        c.fillRect(-ICON, -ICON, ICON * 2, ICON * 2);
      }
      c.restore();
    }

    // 3. the name, the tagline, the note
    const name = (params.name as string | undefined) ?? T.brand.name;
    kineticLine(c, name, W / 2, 660, 104, f.lt, 0.75, { align: 'center', accent: params.accent as string | string[] | undefined });
    bodyText(c, (params.tagline as string | undefined) ?? T.brand.tagline, W / 2, 740, 36, W, f.lt, 1.25, 'center');
    const note = params.note as string | undefined;
    if (note) {
      const kn = prog(f.lt, 1.9, 2.7, ease.outQuart), lab = labelFamily(), size = 22;
      c.save();
      c.globalAlpha = kn;
      c.font = font(lab, size);
      c.letterSpacing = `${size * 0.12}px`;
      c.fillStyle = rgba('ash');
      c.fillText(note, W / 2 - measure(note, lab, size, size * 0.12) / 2, H - 120);
      c.restore();
    }

    comp.draw(renderer, this.layer.upload(), out);
    return { fade: filmEdgeFade(f, this.ctx) };
  }

  /** Your logo (fitted inside the icon square), or a drawn app icon: a paw on the accent gradient. */
  private drawIcon(c: CanvasRenderingContext2D) {
    if (this.logo) {
      const s = Math.min(ICON / this.logo.naturalWidth, ICON / this.logo.naturalHeight);
      const w = this.logo.naturalWidth * s, h = this.logo.naturalHeight * s;
      c.drawImage(this.logo, -w / 2, -h / 2, w, h);
      return;
    }
    const g = c.createLinearGradient(-ICON / 2, -ICON / 2, ICON / 2, ICON / 2);
    g.addColorStop(0, rgba('ember'));
    g.addColorStop(1, rgba('blood'));
    c.fillStyle = g;
    c.beginPath(); c.roundRect(-ICON / 2, -ICON / 2, ICON, ICON, ICON * 0.22); c.fill();
    drawPaw(c, 0, 4, ICON * 0.62, 'rgba(255,255,255,0.96)');
  }
}
