// Template "words": big phrases that slam onto the screen one after another, on the beat. With
// each phrase the background cuts to a new framing of the photo (or shows the brand gradient), and
// a light pop marks the hit. The fastest, most energetic shot type: use it between photo shots.
//
// storyboard: { "template": "words", "beats": 12, "each": 4,
//               "phrases": ["New faces.", "New friends.", "New adventures."], "accent": "friends.",
//               "image": "assets/shot04_dogs_meeting.jpg",
//               "crops": [[0.3, 0.6, 1.6], [0.62, 0.5, 1.7], [0.5, 0.5, 1.05]] }
// each:  beats per phrase (default 4 = one bar)
// crops: per phrase, the photo's framing: [anchor x, anchor y, zoom] (0..1 of the photo; zoom 1 = fill)
// Without "image" the phrases sit on the brand gradient with its ribbons.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import type { FSPass } from '../engine/gl';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { fitSize } from '../engine/type';
import { lerp, prog, ease } from '../engine/util';
import { displayFamily, filmEdgeFade } from './_launch';
import { PhotoLayer, accentColors, brandBackground, kineticLine } from './_cine';
import { makeOverlay, renderOverlay, rhythm, textMotion, wobble } from './_motion';

export default class WordsShot extends Scene {
  photo: PhotoLayer | null = null;
  bgLayer = new Layer2D();
  layer = new Layer2D();
  overlay: FSPass = makeOverlay();
  seed = 0;

  override async init() {
    const p = this.ctx.params;
    if (p.image) { this.photo = new PhotoLayer(p.image as string); await this.photo.load(); }
    this.seed = parseInt(this.ctx.id, 10) || 0;
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params, audio } = this.ctx;
    const dur = f.end - f.start, beat = 60 / audio.bpm;
    const phrases = (params.phrases as string[] | undefined) ?? [];
    const each = ((params.each as number | undefined) ?? 4) * beat;
    const i = Math.min(phrases.length - 1, Math.max(0, Math.floor(f.lt / each)));
    const local = f.lt - i * each; // seconds since this phrase hit

    // background: a new framing of the photo for every phrase, darkened; or the brand gradient
    clearRT(renderer, out, [0, 0, 0]);
    if (this.photo) {
      const [ax, ay, z] = (params.crops as [number, number, number][] | undefined)?.[i] ?? [0.5, 0.5, 1];
      this.photo.o = { anchor: [ax, ay], scale: z };
      const [wx, wy] = wobble(f.t, 1.5);
      comp.draw(renderer, this.photo.draw(1.04 + 0.05 * Math.min(1, local / each), wx, wy, 0.45), out);
      renderOverlay(this.overlay, renderer, out, f.t, this.seed, 1, 0.6);
    } else {
      brandBackground(this.bgLayer.ctx, f.t, 1);
      comp.draw(renderer, this.bgLayer.upload(), out);
    }

    // the phrase slams in: from 125% down to full size in a quarter second, then keeps growing slowly
    const c = this.layer.ctx;
    this.layer.clear();
    const phrase = phrases[i];
    if (phrase) {
      const size = Math.min((params.size as number | undefined) ?? 210, fitSize(phrase, displayFamily(), W - 260));
      const k = prog(local, 0, 0.28, ease.outExpo);
      const s = lerp(1.25, 1, k) * (1 + 0.035 * Math.min(1, local / each));
      c.save();
      c.globalAlpha = Math.min(1, k * 2);
      c.translate(W / 2, H / 2);
      c.scale(s, s);
      // drawn fully revealed (t far past its entrance): the slam is the motion here
      kineticLine(c, phrase, 0, size * 0.35, size, 99, 0, { align: 'center', accent: params.accent as string | string[] | undefined, shadow: true, accentColors: accentColors(this.photo ? params.accentStyle : 'gold') });
      c.restore();
    }
    comp.draw(renderer, this.layer.upload(), out, textMotion(f.lt, dur, params.exit));

    // a light pop on every hit, and the beat pulse (a kick on each new phrase)
    return { ...rhythm(f, (params.pulse as number | undefined) ?? 1, local), flash: 0.16 * Math.exp(-local * 9), fade: filmEdgeFade(f, this.ctx) };
  }
}
