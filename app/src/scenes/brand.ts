// Template "brand": the coral-to-orange brand world with flowing ribbons. Two layouts:
//   "reveal": the logo scales in at the centre and the name rises under it (the brand moment)
//   "end":    the end card: logo + name + tagline + a short line + "coming soon" labels on the
//             left, and the 3D phone showing the app on the right. The film fades out at its end.
//
// storyboard: { "template": "brand", "beats": 4, "layout": "reveal", "name": "MeetMyPets.", "accent": "Pets.",
//               "sub": "Their social life starts here.", "image": "assets/shot05_brand_reveal.jpg" }
//             { "template": "brand", "beats": 8, "layout": "end", "name": "MeetMyPets.",
//               "tagline": "Their social life starts here.", "line": "Discover. Connect. Belong.",
//               "badges": ["Coming soon on iOS", "Coming soon on Android"], "screens": ["assets/discover.png"] }
// "image": a photo for the background instead of the drawn gradient (tinted toward the brand colours).
// "art":   an image laid over the right side of the end card like ink (multiply: white disappears).
// The logo is assets/logo.png (transparent PNG) when it exists, otherwise the heart-loop drawn in code.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { font, measure } from '../engine/type';
import { ease, lerp, prog } from '../engine/util';
import { T, filmEdgeFade, labelFamily } from './_launch';
import { ACCENTS, PhotoLayer, Phone3D, applyPose, keyOutLight, bodyText, brandBackground, drawHeartLoop, goldGradient, kineticLine, loadImageQuiet, makeStage, phonePose, renderStage } from './_cine';
import { rhythm, textMotion } from './_motion';

export default class BrandShot extends Scene {
  bgLayer = new Layer2D();
  layer = new Layer2D();
  logo: HTMLImageElement | null = null;
  bgPhoto: PhotoLayer | null = null;
  art: HTMLCanvasElement | null = null;
  end = false;
  stage: ReturnType<typeof makeStage> | null = null;
  phone: Phone3D | null = null;

  override async init() {
    const p = this.ctx.params;
    this.end = p.layout === 'end';
    this.logo = await loadImageQuiet((p.logo as string | undefined) ?? 'assets/logo.png');
    if (p.image) { this.bgPhoto = new PhotoLayer(p.image as string); await this.bgPhoto.load(); }
    if (p.art) {
      const art = await loadImageQuiet(p.art as string);
      if (art) this.art = keyOutLight(art); // its pale background removed, so only the ribbon art shows
    }
    if (this.end) {
      this.stage = makeStage(this.ctx.renderer);
      this.phone = new Phone3D((p.screens as string[] | undefined) ?? ['assets/discover.png']);
      await this.phone.load();
      this.stage.scene.add(this.phone.group);
    }
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    const dur = f.end - f.start;

    // 1. the brand background, ribbons drawing in from the left
    clearRT(renderer, out, [0, 0, 0]);
    if (this.bgPhoto?.img) {
      // the background photo, slowly pushing in, deepened toward the brand colours so white type reads on it
      comp.draw(renderer, this.bgPhoto.draw(1.04 + 0.06 * f.p), out);
      const b = this.bgLayer.ctx;
      this.bgLayer.clear();
      const g = b.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(232,25,79,0.78)'); g.addColorStop(1, 'rgba(255,90,40,0.6)');
      b.fillStyle = g;
      b.fillRect(0, 0, W, H);
      comp.draw(renderer, this.bgLayer.upload(), out);
    } else {
      brandBackground(this.bgLayer.ctx, f.t, prog(f.lt, 0, 1.4, ease.outQuart));
      if (this.art) {
        // the art stands on the right at full height, behind the phone
        const b = this.bgLayer.ctx, a = this.art, h = H * 1.02, w = (a.width * h) / a.height;
        b.save();
        b.globalAlpha = prog(f.lt, 0, 1.0, ease.outQuart);
        b.drawImage(a, W * 0.79 - w / 2, (H - h) / 2 + (1 - f.p) * 20, w, h);
        b.restore();
      }
      comp.draw(renderer, this.bgLayer.upload(), out);
    }

    // 2. the phone (end card only), rising in on the right
    if (this.stage && this.phone) {
      const pose = phonePose('rise', f.lt, f.p, 1);
      pose.x = 1.05;
      this.phone.update(f.lt, dur, { island: params.island as boolean | undefined }, 0, pose.ry);
      applyPose(this.phone, this.stage.cam, pose);
      renderStage(renderer, this.stage.scene, this.stage.cam, out);
    }

    // 3. logo and words
    const c = this.layer.ctx;
    this.layer.clear();
    const name = (params.name as string | undefined) ?? T.brand.name;
    const accent = params.accent as string | string[] | undefined;
    const accentColors = ACCENTS.gold; // pink would vanish on the coral
    if (!this.end) {
      this.drawLogo(c, W / 2, 400, 230, prog(f.lt, 0.05, 1.1, ease.outExpo));
      kineticLine(c, name, W / 2, 700, 140, f.lt, 0.35, { align: 'center', accent, shadow: true, accentColors });
      if (params.sub) bodyText(c, params.sub as string, W / 2, 790, 40, W, f.lt, 0.9, 'center', 'bone');
      comp.draw(renderer, this.layer.upload(), out, textMotion(f.lt, dur, params.exit));
    } else {
      const x = 330;
      this.drawLogo(c, 200, 400, 170, prog(f.lt, 0.1, 1.0, ease.outExpo));
      kineticLine(c, name, x, 450, 116, f.lt, 0.35, { accent, shadow: true, accentColors });
      bodyText(c, (params.tagline as string | undefined) ?? T.brand.tagline, x, 535, 46, 900, f.lt, 0.75, 'left', 'bone');
      const line = params.line as string | undefined;
      if (line) this.spaced(c, line, x, 610, 30, prog(f.lt, 1.05, 1.8, ease.outQuart));
      const badges = params.badges as string[] | undefined;
      if (badges?.length) this.badges(c, badges, x, 660, prog(f.lt, 1.3, 2.1, ease.outQuart));
      comp.draw(renderer, this.layer.upload(), out);
    }
    return { ...rhythm(f, (params.pulse as number | undefined) ?? 0.7), fade: filmEdgeFade(f, this.ctx) };
  }

  /** The logo scaling up from 70 % as it fades in, with a soft glow behind it. */
  private drawLogo(c: CanvasRenderingContext2D, x: number, y: number, s: number, k: number) {
    if (k <= 0) return;
    c.save();
    c.globalAlpha = Math.min(1, k * 1.4);
    const glow = c.createRadialGradient(x, y, 0, x, y, s);
    glow.addColorStop(0, 'rgba(255,214,120,0.35)');
    glow.addColorStop(1, 'rgba(255,214,120,0)');
    c.fillStyle = glow;
    c.fillRect(x - s, y - s, s * 2, s * 2);
    c.translate(x, y);
    c.scale(lerp(0.7, 1, k), lerp(0.7, 1, k));
    if (this.logo) {
      const f = Math.min(s / this.logo.naturalWidth, s / this.logo.naturalHeight);
      c.drawImage(this.logo, (-this.logo.naturalWidth * f) / 2, (-this.logo.naturalHeight * f) / 2, this.logo.naturalWidth * f, this.logo.naturalHeight * f);
    } else {
      c.shadowColor = 'rgba(120,20,0,0.35)';
      c.shadowBlur = 24;
      drawHeartLoop(c, 0, 0, s, goldGradient(c, 0, 0, s));
    }
    c.restore();
  }

  /** A line of white text with wide letter spacing ("Discover. Connect. Belong."). */
  private spaced(c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, k: number) {
    if (k <= 0) return;
    const lab = labelFamily(), track = size * lerp(0.35, 0.18, k);
    c.save();
    c.globalAlpha = k * 0.92;
    c.font = font(lab, size);
    c.letterSpacing = `${track}px`;
    c.fillStyle = '#FFFFFF';
    c.fillText(text, x, y);
    c.restore();
  }

  /** "Coming soon" labels in one outlined pill, split by thin dividers. */
  private badges(c: CanvasRenderingContext2D, labels: string[], x: number, y: number, k: number) {
    if (k <= 0) return;
    const lab = labelFamily(), size = 26, pad = 36;
    const widths = labels.map((l) => measure(l, lab, size));
    const w = widths.reduce((a, b) => a + b, 0) + pad * 2 * labels.length;
    c.save();
    c.globalAlpha = k;
    c.translate(0, (1 - k) * 16);
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 2;
    c.beginPath(); c.roundRect(x, y, w, 72, 36); c.stroke();
    c.font = font(lab, size);
    c.fillStyle = '#FFFFFF';
    let bx = x;
    labels.forEach((l, i) => {
      c.fillText(l, bx + pad, y + 46);
      bx += widths[i]! + pad * 2;
      if (i < labels.length - 1) c.fillRect(bx - 1, y + 18, 2, 36);
    });
    c.restore();
  }
}
