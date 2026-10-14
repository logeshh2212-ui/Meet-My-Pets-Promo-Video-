// Template "lineup": three 3D phones rise out of the dark one after another, each showing a
// different screen, while the camera glides sideways past them. A headline sits above.
// The "everything in one app" shot.
//
// storyboard: { "template": "lineup", "beats": 8, "screens": ["assets/profile.png", "assets/home.png", "assets/health.png"],
//               "kicker": "All in one place", "lines": ["Everything they need."], "accent": "need." }
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { clamp, ease, lerp } from '../engine/util';
import { filmEdgeFade, reveal } from './_launch';
import { Phone3D, kicker, kineticLine, makeBackdrop, makeStage, renderStage, textOut, updateBackdrop } from './_cine';

// left, centre, right: the centre phone stands forward, the outer ones turn in toward it
const SLOTS = [{ x: -1.3, z: -0.35, ry: 0.35, delay: 0.25 }, { x: 0, z: 0.15, ry: 0, delay: 0 }, { x: 1.3, z: -0.35, ry: -0.35, delay: 0.4 }];

export default class LineupShot extends Scene {
  bg = makeBackdrop();
  layer = new Layer2D();
  stage!: ReturnType<typeof makeStage>;
  phones: Phone3D[] = [];

  override async init() {
    const screens = (this.ctx.params.screens as string[] | undefined) ?? ['assets/profile.png', 'assets/home.png', 'assets/health.png'];
    this.stage = makeStage(this.ctx.renderer);
    this.phones = SLOTS.map((_, i) => new Phone3D([screens[i] ?? screens[0] ?? 'home']));
    await Promise.all(this.phones.map((p) => p.load()));
    for (const p of this.phones) this.stage.scene.add(p.group);
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp, params } = this.ctx;
    const dur = f.end - f.start;
    const glide = ease.inOutCubic(f.p);

    updateBackdrop(this.bg, f.t, reveal(f.lt, 0, 1.2), W / 2, H / 2 + 80, [lerp(60, -60, glide), 0]);
    this.bg.render(renderer, out);

    this.phones.forEach((phone, i) => {
      const s = SLOTS[i]!;
      const k = ease.outExpo(clamp((f.lt - 0.1 - s.delay) / 1.5));
      phone.group.position.set(s.x, lerp(-2.6, -0.2, k) + Math.sin(f.lt * 1.1 + i) * 0.015, s.z);
      phone.group.rotation.set(lerp(0.6, 0.04, k), s.ry + Math.sin(f.lt * 0.5 + i) * 0.02, 0);
      phone.update(f.lt, dur, {}, 0, s.ry);
    });
    // the camera trucks sideways and eases in
    const cam = this.stage.cam;
    cam.position.set(lerp(-0.35, 0.35, glide), 0.05, lerp(5.1, 4.7, glide));
    cam.lookAt(0, -0.12, 0);
    this.stage.rim.intensity = 5;
    renderStage(renderer, this.stage.scene, cam, out);

    const c = this.layer.ctx;
    this.layer.clear();
    if (params.kicker) kicker(c, params.kicker as string, W / 2, 112, f.lt, 0.5, 'center');
    const line = ((params.lines as string[] | undefined) ?? []).join(' ');
    if (line) kineticLine(c, line, W / 2, 196, 72, f.lt, 0.7, { align: 'center', accent: params.accent as string | string[] | undefined });
    comp.draw(renderer, this.layer.upload(), out, { opacity: textOut(f.lt, dur, params.exit) });
    return { fade: filmEdgeFade(f, this.ctx) };
  }
}
