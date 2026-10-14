// Motion that keeps still photos from feeling like a slide show:
//   - cuts:    punch-ins on the beat (new framings of the same photo, like extra camera angles)
//   - rhythm:  the whole frame kicks a little on every beat and harder on every bar
//   - wobble:  a gentle hand-held drift
//   - overlay: out-of-focus lights and a warm light leak drifting in FRONT of the photo (depth)
//   - text motion: text leaves by sliding up, not just fading
import * as THREE from 'three';
import type { Frame, PostOverrides } from '../engine/scene';
import { FSPass } from '../engine/gl';
import { clamp, ease, prog } from '../engine/util';
import type { PhotoLayer, PhotoOpts } from './_cine';

// ------------------------------------------------------------------ punch-in cuts

/**
 * One framing of a photo inside a shot, starting `beat` beats into the shot. zoom multiplies the
 * shot's size (1.6 = a close-up), anchor is the point to centre (0..1 of the photo), at moves a
 * full-height photo across the frame, move overrides the shot's camera move for this cut.
 */
export interface Cut { beat: number; zoom?: number; anchor?: [number, number]; at?: number; move?: string }

/** The cut playing at scene time lt: which one, when it started (s), and 0..1 progress through it. */
export function cutAt(cuts: Cut[] | undefined, lt: number, beatLen: number, dur: number) {
  const list: Cut[] = cuts?.length ? cuts : [{ beat: 0 }];
  let i = 0;
  list.forEach((c, j) => { if (lt >= c.beat * beatLen) i = j; });
  const t0 = list[i]!.beat * beatLen, t1 = i + 1 < list.length ? list[i + 1]!.beat * beatLen : dur;
  return { cut: list[i]!, i, t0, p: clamp((lt - t0) / Math.max(0.01, t1 - t0)) };
}

/** Points a photo layer at a cut's framing (the shot's own settings, overridden by the cut's). */
export function frameCut(photo: PhotoLayer, base: PhotoOpts, cut: Cut) {
  photo.o = { ...base, anchor: cut.anchor ?? base.anchor, at: cut.at ?? base.at, scale: (base.scale ?? 1) * (cut.zoom ?? 1) };
}

// ------------------------------------------------------------------ rhythm

/**
 * The frame's beat pulse, as post-processing overrides: a small zoom kick on every beat, a bigger
 * one on every bar's downbeat, and a kick when a new cut starts (`cutT` s ago). strength 0 = still.
 */
export function rhythm(f: Frame, strength = 1, cutT = 99): PostOverrides {
  if (strength <= 0) return {};
  const beatKick = Math.exp(-f.beatPhase * 7), barKick = Math.exp(-f.barPhase * 16), cutKick = Math.exp(-cutT * 9);
  return { zoom: 1 + strength * (0.006 * beatKick + 0.018 * barKick + 0.035 * cutKick) };
}

/** A gentle hand-held camera drift in px (two slow wobbles per axis, never repeating exactly). */
export function wobble(t: number, amount = 1): [number, number] {
  return [
    amount * (Math.sin(t * 1.3) * 6 + Math.sin(t * 2.9 + 1.0) * 3),
    amount * (Math.sin(t * 1.7 + 2.0) * 4 + Math.sin(t * 3.3 + 0.5) * 2),
  ];
}

// ------------------------------------------------------------------ depth overlay

/**
 * Lights in front of the picture, added on top of it: big soft out-of-focus discs drifting
 * sideways (faster than the photo moves, so they read as close to the lens) and a warm light leak
 * sliding across. Uniforms: t (s), k (0..1 strength), leak (0..1), seed (a different pattern per shot).
 */
export function makeOverlay(): FSPass {
  return new FSPass(
    /* glsl */ `uniform float t, k, leak, seed;
    void main() {
      vec2 p = FRAG_PX;
      vec3 col = vec3(0.0);
      for (int l = 0; l < 2; l++) {
        float fl = float(l);
        float cell = 420.0 + fl * 180.0;
        vec2 drift = vec2(t * (40.0 + fl * 35.0), sin(t * 0.3 + fl) * 30.0);
        vec2 id = floor((p - drift) / cell);
        vec2 r = hash22(id + seed + fl * 13.0);
        if (r.x > 0.3) continue;
        vec2 c = (id + 0.25 + 0.5 * hash22(id * 2.3 + fl + seed)) * cell + drift;
        float rad = cell * (0.1 + 0.1 * r.y);
        col += mix(C_EMBER, C_BONE, r.y) * smoothstep(rad, rad * 0.3, length(p - c)) * 0.05;
      }
      // the light leak: a warm glow drifting across the frame from left to right
      float lx = mix(-500.0, 2420.0, fract(t * 0.045 + seed * 0.37));
      vec2 q = (p - vec2(lx, 820.0)) / vec2(700.0, 950.0);
      col += (C_EMBER * 0.6 + C_SIGNAL * 0.4) * exp(-dot(q, q) * 2.0) * 0.14 * leak;
      fragColor = vec4(col * k, 1.0);
    }`,
    { t: { value: 0 }, k: { value: 1 }, leak: { value: 1 }, seed: { value: 0 } },
    { blending: THREE.AdditiveBlending, transparent: true },
  );
}

/** Draws the overlay over `out` (seed: any number, different per shot). */
export function renderOverlay(pass: FSPass, renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, t: number, seed: number, k = 1, leak = 1) {
  pass.u.t!.value = t;
  pass.u.k!.value = k;
  pass.u.leak!.value = leak;
  pass.u.seed!.value = seed;
  pass.render(renderer, out);
}

// ------------------------------------------------------------------ text motion

/**
 * How a shot's text layer leaves: over the last half second it slides up and fades (a whip or zoom
 * exit keeps it: the move carries it away). Returns compositor options for comp.draw.
 */
export function textMotion(lt: number, dur: number, exit?: unknown): { opacity: number; offset: [number, number] } {
  if (exit === 'whip' || exit === 'zoom') return { opacity: 1, offset: [0, 0] };
  const k = prog(lt, dur - 0.55, dur - 0.1, ease.inCubic);
  return { opacity: 1 - k, offset: [0, -0.035 * k] };
}
