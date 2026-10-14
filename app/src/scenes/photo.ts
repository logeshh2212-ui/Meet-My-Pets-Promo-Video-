// Template "photo": a photograph that feels like footage: it cuts to new framings on the beat
// (punch-ins), drifts like a hand-held camera, pulses with the music and has lights drifting in
// front of it; kinetic headline text sits over it. The text's side is darkened so it stays readable.
//
// storyboard: { "template": "photo", "beats": 12, "image": "assets/shot02_curious_dog.jpg",
//               "move": "push", "anchor": [0.4, 0.5], "side": "right", "valign": "middle",
//               "cuts": [{ "beat": 0 }, { "beat": 4, "zoom": 1.5, "anchor": [0.4, 0.4] }],
//               "lineBeats": 4, "lines": ["Curious by nature.", "Made for connection."], "accent": "connection." }
// move:      "push" (in), "pull" (out), "track" (sideways), "still"
// anchor:    the point of the photo (0..1 across, 0..1 down) to keep in view when it is cropped to 16:9
// fit:       "cover" (default: fill the frame) or "height" (the whole photo, full height, at "at" 0..1 across)
// cuts:      new framings of the photo starting on given beats of the shot (zoom / anchor / at / move)
// lineBeats: beats between one headline line and the next (e.g. 4: the second line lands with the next cut)
// pulse:     how much the frame kicks on the beat, 0..1 (default 1);  leak: light leak 0..1 (default 1)
// x:         left edge of the text column in px (optional);  shade: text-side darkening 0..1 (default 0.6)
// side:      where the text goes: "left", "right" or "center";  valign: "top", "middle" or "bottom"
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import type { FSPass } from '../engine/gl';
import { Layer2D, W, clearRT } from '../engine/gl';
import { filmEdgeFade } from './_launch';
import { PhotoLayer, photoCopy, photoMove, shadeForText, type Align, type PhotoCopy, type PhotoOpts } from './_cine';
import { cutAt, frameCut, makeOverlay, renderOverlay, rhythm, textMotion, wobble, type Cut } from './_motion';

export default class PhotoShot extends Scene {
  photo!: PhotoLayer;
  base: PhotoOpts = {};
  layer = new Layer2D();
  overlay: FSPass = makeOverlay();
  align: Align = 'left';
  seed = 0;

  override async init() {
    const p = this.ctx.params;
    this.align = p.side === 'right' ? 'right' : p.side === 'center' ? 'center' : 'left';
    this.base = { ...(p as PhotoOpts) };
    this.photo = new PhotoLayer((p.image as string | undefined) ?? '', { ...this.base });
    this.seed = parseInt(this.ctx.id, 10) || 0; // a different light pattern in every shot
    await this.photo.load();
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params, audio } = this.ctx;
    const dur = f.end - f.start, beat = 60 / audio.bpm;
    // which framing (cut) is on screen, and the camera move inside it
    const { cut, t0, p } = cutAt(params.cuts as Cut[] | undefined, f.lt, beat, dur);
    frameCut(this.photo, this.base, cut);
    const { zoom, panX } = photoMove(cut.move ?? params.move, p, this.align === 'right' ? 1 : -1);
    const [wx, wy] = wobble(f.t);
    clearRT(renderer, out, [0, 0, 0]);
    comp.draw(renderer, this.photo.draw(zoom, panX + wx, wy), out);
    renderOverlay(this.overlay, renderer, out, f.t, this.seed, 1, (params.leak as number | undefined) ?? 1);

    const c = this.layer.ctx;
    this.layer.clear();
    shadeForText(c, this.align, params.valign, (params.shade as number | undefined) ?? 0.6);
    // the text column: 150 px from the edge on its side, or centred ("x" moves its left edge)
    const x = (params.x as number | undefined) ?? (this.align === 'left' ? 150 : this.align === 'right' ? W * 0.5 : W / 2);
    const maxW = this.align === 'center' ? W - 320 : this.align === 'right' ? W - 140 - x : W * 0.5 - 150;
    const lineBeats = params.lineBeats as number | undefined;
    const copy: PhotoCopy = { ...(params as PhotoCopy), lineGap: lineBeats ? lineBeats * beat : undefined };
    photoCopy(c, copy, x, this.align === 'center' ? 'center' : 'left', maxW, params.valign, f.lt);

    comp.draw(renderer, this.layer.upload(), out, textMotion(f.lt, dur, params.exit));
    return { ...rhythm(f, (params.pulse as number | undefined) ?? 1, f.lt - t0), fade: filmEdgeFade(f, this.ctx) };
  }
}
