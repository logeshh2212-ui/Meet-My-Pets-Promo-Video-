// Template "phone": a phone (drawn in code, no device photo needed) rises into a soft spotlight
// showing your app screenshot, next to a headline and a subline. Without a screenshot it shows a
// placeholder app screen, so the shot works before you have assets.
//
// storyboard: { "template": "phone", "duration": 5, "image": "assets/home.png",
//               "title": "All your pets.", "sub": "One beautiful home.", "side": "right" }
// Put the screenshot in app/public/assets/ (portrait, e.g. 1179 x 2556 from an iPhone).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { font } from '../engine/type';
import { rgba } from '../engine/palette';
import { drawCover, drawPaw, drawReveal, displayFamily, labelFamily, filmEdgeFade, loadImage, makeSpotlight, reveal } from './_launch';

const PH = 820, PW = Math.round(PH * 0.462); // phone size in px (a modern phone's proportions)

export default class PhoneShot extends Scene {
  layer = new Layer2D();
  bg = makeSpotlight();
  img: HTMLImageElement | null = null;
  phoneX = 0; textX = 0; textAlign: 'left' | 'center' = 'left';

  override async init() {
    const p = this.ctx.params;
    this.img = await loadImage(p.image as string | undefined);
    const side = (p.side as string | undefined) ?? 'right';
    this.phoneX = side === 'left' ? W * 0.3 : side === 'center' ? W / 2 : W * 0.7;
    this.textX = side === 'left' ? W * 0.52 : 200;
    this.bg.u.center!.value = [this.phoneX, H / 2 + 40];
    this.bg.u.radius!.value = 600;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    const k = reveal(f.lt, 0.1, 1.4); // the phone's entrance
    this.bg.u.k!.value = k;
    this.bg.render(renderer, out);

    const c = this.layer.ctx;
    this.layer.clear();

    // 1. the phone: rises 320 px, straightens from a slight tilt, then floats gently
    const cx = this.phoneX, cy = H / 2 + 40 + (1 - k) * 320 + Math.sin(f.lt * 1.3) * 6 * k;
    c.save();
    c.globalAlpha = Math.min(1, k * 1.5);
    c.translate(cx, cy);
    c.rotate((1 - k) * 0.08);
    c.shadowColor = rgba('signal', 0.25);
    c.shadowBlur = 90;
    c.fillStyle = rgba('ink2');
    c.beginPath(); c.roundRect(-PW / 2, -PH / 2, PW, PH, 64); c.fill(); // body
    c.shadowBlur = 0;
    c.strokeStyle = rgba('bone', 0.14); c.lineWidth = 2; c.stroke(); // edge highlight
    const sx = -PW / 2 + 14, sy = -PH / 2 + 14, sw = PW - 28, sh = PH - 28;
    c.beginPath(); c.roundRect(sx, sy, sw, sh, 52); c.clip(); // screen
    if (this.img) drawCover(c, this.img, sx, sy, sw, sh);
    else this.placeholder(c, sx, sy, sw, sh, f.lt);
    c.fillStyle = '#000';
    c.beginPath(); c.roundRect(-55, sy + 16, 110, 32, 16); c.fill(); // camera pill
    c.restore();

    // 2. headline and subline, after the phone has mostly arrived
    const title = params.title as string | undefined, sub = params.sub as string | undefined;
    if (title) drawReveal(c, title, this.textX, H / 2 - 10, 96, displayFamily(), reveal(f.lt, 0.6, 1.0));
    if (sub) drawReveal(c, sub, this.textX, H / 2 + 70, 44, labelFamily(), reveal(f.lt, 0.95, 1.0), 'ash');

    comp.draw(renderer, this.layer.upload(), out);
    return { fade: filmEdgeFade(f, this.ctx) };
  }

  /** A stand-in app screen: a title and three pet cards that slide in. */
  private placeholder(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lt: number) {
    c.fillStyle = rgba('ink');
    c.fillRect(x, y, w, h);
    c.fillStyle = rgba('bone');
    c.font = font(displayFamily(), 34);
    c.fillText('My Pets', x + 28, y + 120);
    for (let i = 0; i < 3; i++) {
      const k = reveal(lt, 0.9 + i * 0.15, 0.6);
      const cy = y + 160 + i * 150 + (1 - k) * 40;
      c.globalAlpha = k;
      c.fillStyle = rgba('ink2');
      c.beginPath(); c.roundRect(x + 20, cy, w - 40, 128, 24); c.fill();
      c.fillStyle = rgba('signal', 0.18);
      c.beginPath(); c.arc(x + 82, cy + 64, 40, 0, Math.PI * 2); c.fill();
      drawPaw(c, x + 82, cy + 66, 44, rgba('signal'));
      c.fillStyle = rgba('bone', 0.85);
      c.beginPath(); c.roundRect(x + 144, cy + 40, 120, 16, 8); c.fill();
      c.fillStyle = rgba('ash', 0.6);
      c.beginPath(); c.roundRect(x + 144, cy + 72, 170, 12, 6); c.fill();
    }
    c.globalAlpha = 1;
  }
}