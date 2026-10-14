// Template "photophone": a photo of a phone (held in a hand, on a stand, a product render...) with
// your real app screen placed into its screen in perspective. The screen is live: taps, likes with
// floating hearts, a card swiped away, a feed flicked, a swipe to another screenshot. Like "photo",
// it cuts to new framings on the beat (e.g. a close-up of the screen), drifts and pulses.
//
// storyboard: { "template": "photophone", "beats": 12, "image": "assets/shot06_discover.jpg",
//               "quad": [[0.354, 0.193], [0.643, 0.196], [0.650, 0.811], [0.351, 0.810]],
//               "screens": ["assets/screen_discover.png"], "taps": [{ "t": 3, "x": 0.58, "y": 0.77 }], "burst": true,
//               "swipeCard": { "t": 4, "box": [0.04, 0.24, 0.92, 0.6] },
//               "flick": { "t": 1, "top": 0.1, "bottom": 0.92, "amount": 0.5 },
//               "cuts": [{ "beat": 0 }, { "beat": 6, "zoom": 1.6, "anchor": [0.5, 0.5] }],
//               "fit": "height", "at": 0.72, "move": "push", "side": "left",
//               "kicker": "Discover", "lines": ["Discover", "their world."], "accent": "world.", "sub": "..." }
// quad:   the photo's screen corners (0..1 of the photo: top-left, top-right, bottom-right, bottom-left)
// grow:   enlarge the fitted screen a little (default 1.015) so none of the photo's own screen shows
// radius: the screen's corner rounding (0..0.1 of its height, default 0.045)
// fit / at / anchor / scale / fill / blend: how the photo is laid out (see photo.ts; "fill": "brand"
//          with "blend": "multiply" puts a product shot on white onto the brand gradient)
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import type { FSPass } from '../engine/gl';
import { Layer2D, W, clearRT } from '../engine/gl';
import { filmEdgeFade } from './_launch';
import { PhotoLayer, PhotoScreen, ScreenPainter, photoCopy, photoMove, shadeForText, type Align, type PhotoCopy, type PhotoOpts, type ScreenOpts } from './_cine';
import { cutAt, frameCut, makeOverlay, renderOverlay, rhythm, textMotion, wobble, type Cut } from './_motion';

type Quad = [number, number][];

export default class PhotoPhoneShot extends Scene {
  photo!: PhotoLayer;
  base: PhotoOpts = {};
  painter!: ScreenPainter;
  screen!: PhotoScreen;
  layer = new Layer2D();
  overlay: FSPass = makeOverlay();
  align: Align = 'left';
  seed = 0;

  override async init() {
    const p = this.ctx.params;
    this.align = p.side === 'right' ? 'right' : 'left';
    this.base = { ...(p as PhotoOpts) };
    this.photo = new PhotoLayer((p.image as string | undefined) ?? '', { ...this.base });
    this.painter = new ScreenPainter((p.screens as string[] | undefined) ?? ['discover']);
    this.seed = parseInt(this.ctx.id, 10) || 0;
    await Promise.all([this.photo.load(), this.painter.load()]);
    this.screen = new PhotoScreen(this.painter.texture);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params, audio } = this.ctx;
    const dur = f.end - f.start, beat = 60 / audio.bpm;
    const { cut, t0, p } = cutAt(params.cuts as Cut[] | undefined, f.lt, beat, dur);
    frameCut(this.photo, this.base, cut);
    const { zoom, panX } = photoMove(cut.move ?? params.move, p, this.align === 'right' ? 1 : -1);
    const [wx, wy] = wobble(f.t);
    clearRT(renderer, out, [0, 0, 0]);
    comp.draw(renderer, this.photo.draw(zoom, panX + wx, wy, 0, f.t), out);

    // the app screen, fitted into the photo's screen corners wherever the photo is this frame
    const quad = params.quad as Quad | undefined;
    if (quad && this.photo.img) {
      const opts: ScreenOpts = { ...(params as ScreenOpts), island: false };
      this.painter.paint(f.lt, dur, opts);
      const corners = quad.map(([u, v]) => this.photo.toFrame(u, v));
      this.screen.render(renderer, out, corners, (params.grow as number | undefined) ?? 1.015, (params.radius as number | undefined) ?? 0.045);
    }
    renderOverlay(this.overlay, renderer, out, f.t, this.seed, params.fill === 'brand' ? 0.6 : 1, (params.leak as number | undefined) ?? 1);

    const c = this.layer.ctx;
    this.layer.clear();
    if (params.fill !== 'brand') shadeForText(c, this.align, 'middle', (params.shade as number | undefined) ?? 0.55);
    // the text column runs from the frame edge to just short of the phone, measured on the shot's first
    // framing (so a close-up cut doesn't squeeze it, and every frame gets the same layout)
    const first = (params.cuts as Cut[] | undefined)?.[0] ?? { beat: 0 };
    const o0: PhotoOpts = { ...this.base, anchor: first.anchor ?? this.base.anchor, at: first.at ?? this.base.at, scale: (this.base.scale ?? 1) * (first.zoom ?? 1) };
    const xs = (quad ?? [[0.5, 0.5]]).map(([u, v]) => this.photo.probe(o0, 1.04, u, v)[0]);
    const x = this.align === 'left' ? 140 : Math.max(...xs) + 110;
    const textW = Math.max(400, (params.textWidth as number | undefined) ?? (this.align === 'left' ? Math.min(...xs) - 110 - x : W - 140 - x));
    const lineBeats = params.lineBeats as number | undefined;
    const copy: PhotoCopy = { ...(params as PhotoCopy), lineGap: lineBeats ? lineBeats * beat : undefined };
    photoCopy(c, copy, x, 'left', textW, params.valign ?? 'middle', f.lt, 0.4);

    comp.draw(renderer, this.layer.upload(), out, textMotion(f.lt, dur, params.exit));
    return { ...rhythm(f, (params.pulse as number | undefined) ?? 1, f.lt - t0), fade: filmEdgeFade(f, this.ctx) };
  }

}
