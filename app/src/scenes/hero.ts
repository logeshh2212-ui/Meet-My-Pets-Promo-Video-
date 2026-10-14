// Template "hero": a real 3D phone under studio lights showing your app, with a headline beside it.
// The phone makes one of five camera moves; its screen can swipe between screenshots, scroll and
// show taps. Without screenshots it shows placeholder app screens.
//
// "background": "assets/....jpg" puts a blurred photo behind the phone instead of the dark studio.
// storyboard: { "template": "hero", "beats": 10, "move": "reveal", "side": "right",
//               "screens": ["assets/home.png"], "kicker": "Meet", "lines": ["Meet My Pets."],
//               "accent": "Pets.", "sub": "...", "taps": [{ "t": 2, "x": 0.5, "y": 0.4 }], "scroll": 0.5 }
// move: "reveal" (turns into the light), "orbit", "rise", "push" (camera pushes in), "float"
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H, clearRT } from '../engine/gl';
import { filmEdgeFade, reveal } from './_launch';
import { PhotoLayer, Phone3D, applyPose, makeBackdrop, makeStage, phonePose, renderStage, sideCopy, sideOf, textOut, updateBackdrop, type Copy, type Move, type Tap } from './_cine';

export default class HeroShot extends Scene {
  bg = makeBackdrop();
  layer = new Layer2D();
  stage!: ReturnType<typeof makeStage>;
  phone!: Phone3D;
  photo: PhotoLayer | null = null;
  side = 1;

  override async init() {
    const p = this.ctx.params;
    this.side = sideOf(p.side);
    this.stage = makeStage(this.ctx.renderer);
    this.phone = new Phone3D((p.screens as string[] | undefined) ?? ['assets/home.png']);
    await this.phone.load();
    if (p.background) { this.photo = new PhotoLayer(p.background as string); await this.photo.load(14); }
    this.stage.scene.add(this.phone.group);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    const dur = f.end - f.start;
    const pose = phonePose((params.move as Move | undefined) ?? 'reveal', f.lt, f.p, this.side);

    // the key light pools behind the phone (its screen position: 1920 px across ~ 4 world units)
    if (this.photo) {
      // a blurred, darkened photo behind the phone (like a shallow depth of field), drifting slowly
      clearRT(renderer, out, [0, 0, 0]);
      comp.draw(renderer, this.photo.draw(1.06 + 0.04 * f.p, -pose.x * 40 - f.p * 30, 0, 0.35), out);
    } else {
      updateBackdrop(this.bg, f.t, reveal(f.lt, 0, 1.2), W / 2 + pose.x * 480, H / 2, [-f.lt * 20, 0]);
      this.bg.render(renderer, out);
    }

    // the rim light swells as the phone turns into it
    this.stage.rim.intensity = 3 + 4 * Math.max(0, Math.sin(-pose.ry));
    this.phone.update(f.lt, dur, { taps: params.taps as Tap[] | undefined, scroll: params.scroll as number | undefined, swapAt: params.swapAt as number[] | undefined }, 0, pose.ry);
    applyPose(this.phone, this.stage.cam, pose);
    renderStage(renderer, this.stage.scene, this.stage.cam, out);

    const c = this.layer.ctx;
    this.layer.clear();
    sideCopy(c, params as Copy, this.side, f.lt, 0.7);
    comp.draw(renderer, this.layer.upload(), out, { opacity: textOut(f.lt, dur, params.exit) });
    return { fade: filmEdgeFade(f, this.ctx) };
  }
}
