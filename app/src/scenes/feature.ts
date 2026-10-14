// Template "feature": the 3D phone shows one feature. A tap lands on part of the screen, then that
// part lifts out of the glass toward the camera as a floating card (the rest of the screen dims),
// while the headline and a line of explanation appear beside it.
//
// "background": "assets/....jpg" puts a blurred photo behind the phone instead of the dark studio.
// storyboard: { "template": "feature", "beats": 8, "side": "right", "move": "orbit",
//               "screens": ["assets/reminders.png"], "focus": [0.07, 0.18, 0.86, 0.1],
//               "kicker": "Reminders", "lines": ["Never miss", "a walk."], "accent": "walk.",
//               "sub": "Gentle nudges for walks, meals and medicine." }
// focus = the part that lifts out: [x, y, width, height] as fractions of the screen, from its top-left.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { ease, prog } from '../engine/util';
import { filmEdgeFade, reveal } from './_launch';
import { PhotoLayer, Phone3D, applyPose, makeBackdrop, makeStage, phonePose, renderStage, sideCopy, sideOf, textOut, updateBackdrop, type Copy, type Focus, type Move, type Tap } from './_cine';

const POP_AT = 1.3; // seconds into the shot when the card lifts out

export default class FeatureShot extends Scene {
  bg = makeBackdrop();
  layer = new Layer2D();
  stage!: ReturnType<typeof makeStage>;
  phone!: Phone3D;
  photo: PhotoLayer | null = null;
  side = 1;
  focus: Focus = [0.07, 0.18, 0.86, 0.13];
  taps: Tap[] = [];

  override async init() {
    const p = this.ctx.params;
    this.side = sideOf(p.side);
    this.focus = (p.focus as Focus | undefined) ?? this.focus;
    // by default a tap lands in the middle of the focus region just before it lifts
    const [fx, fy, fw, fh] = this.focus;
    this.taps = (p.taps as Tap[] | undefined) ?? [{ t: POP_AT - 0.45, x: fx + fw / 2, y: fy + fh / 2 }];
    this.stage = makeStage(this.ctx.renderer);
    this.phone = new Phone3D((p.screens as string[] | undefined) ?? ['assets/home.png']);
    await this.phone.load();
    if (p.background) { this.photo = new PhotoLayer(p.background as string); await this.photo.load(14); }
    this.phone.makePop(this.focus);
    this.stage.scene.add(this.phone.group);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    const dur = f.end - f.start;
    const pose = phonePose((params.move as Move | undefined) ?? 'orbit', f.lt, f.p, this.side);
    const popK = prog(f.lt, POP_AT, POP_AT + 0.9, ease.outExpo);
    // as the card lifts, the phone turns a little more toward us
    pose.ry *= 1 - 0.35 * popK;

    if (this.photo) {
      // a blurred, darkened photo behind the phone (like a shallow depth of field), drifting slowly
      clearRT(renderer, out, [0, 0, 0]);
      comp.draw(renderer, this.photo.draw(1.06 + 0.04 * f.p, -pose.x * 40 - f.p * 30, 0, 0.35), out);
    } else {
      updateBackdrop(this.bg, f.t, reveal(f.lt, 0, 1.0), W / 2 + pose.x * 480, H / 2, [-f.lt * 20, 0]);
      this.bg.render(renderer, out);
    }

    this.stage.rim.intensity = 3 + 3 * popK;
    this.phone.update(f.lt, dur, { taps: this.taps, scroll: params.scroll as number | undefined }, popK, pose.ry);
    applyPose(this.phone, this.stage.cam, pose);
    renderStage(renderer, this.stage.scene, this.stage.cam, out);

    const c = this.layer.ctx;
    this.layer.clear();
    sideCopy(c, params as Copy, this.side, f.lt, 0.4);
    comp.draw(renderer, this.layer.upload(), out, { opacity: textOut(f.lt, dur, params.exit) });
    return { fade: filmEdgeFade(f, this.ctx) };
  }
}
