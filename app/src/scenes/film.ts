// The animatic: one scene that draws every shot of the launch film from its storyboard entry
// (docs/launch-film/storyboard.launch.json → ctx.params), so the whole 76 s film plays in the
// right order, on the right beats, with the real app screens, before the final shots exist.
// A shot gets its own scene later (scenes/film-s05.ts …) and the timeline picks that instead.
//
// What it draws, back to front:
//   1. the background: the shot's photo plate (with a slow push-in), the coral brand gradient,
//      the warm studio, or the dark ember space (S14–S15)
//   2. the 3D phone showing the shot's Figma screens (swiping from one to the next)
//   3. the brand mark + wordmark (S03, S21)
//   4. the copy in "tag type": words spring in one by one; the accent word hangs in a collar-tag pill
//   5. review labels (shot id, act, timecode, beat ticks); hide them with ?labels=0
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { clamp, ease, prog } from '../engine/util';
import { Phone3D, applyPose, loadImageQuiet, makeStage, phonePose, renderStage, type Move } from './_cine';
import { drawCover } from './_launch';
import type { LaunchShot } from '../timeline';

/** The brand colours (from the app's AppColors). */
const C = { primary: '#FF1744', secondary: '#FF7A00', accent: '#FFC107', ink: '#212738', paper: '#FFFAFA' };

/** Stand-in plates until the generated images are in app/public/assets/film/. */
const TEMP_PLATES: Record<string, string> = {
  'assets/film/p01_eye_macro.png': 'assets/shot01_pet_eye.jpg',
  'assets/film/p02_doorstep.png': 'assets/shot02_curious_dog.jpg',
  'assets/film/p10_friendship.png': 'assets/shot10_real_friendship.jpg',
};

type Look = 'photo' | 'coral' | 'end' | 'dark' | 'studio';

/**
 * 16:9 layout: which side the phone stands on (-1 left, 0 centre, 1 right); the copy takes the other
 * side. It alternates by act for rhythm: Sign in right, You left, Create right, Discover left, Feed right, Match right, Chat left.
 */
const PHONE_SIDE: Record<string, number> = {
  S04: 1, S05: -1, S06: 1, S07: -1, S08: 1, S09: 0.6, S10: 0.6, S11: 0.6, S12: -1, S13: -1, S14: -1, S16: 0.6,
};
/** Where the copy block sits on the photo shots: [x, y, align]. */
const PHOTO_COPY: Record<string, [number, number, 'left' | 'right']> = {
  S01: [160, 820, 'left'], S02: [1760, 230, 'right'], S15: [160, 380, 'left'],
};
const LABELS = typeof location === 'undefined' || new URLSearchParams(location.search).get('labels') === '1'; // review labels only on request

export default class FilmAnimatic extends Scene {
  bg = new Layer2D();
  fg = new Layer2D();
  shot!: LaunchShot;
  look: Look = 'studio';
  plate: HTMLImageElement | null = null;
  mark: HTMLImageElement | null = null;
  phone: Phone3D | null = null;
  stage: ReturnType<typeof makeStage> | null = null;
  move: Move = 'float';
  side = 0;
  bgDrawn = false;

  override async init() {
    const s = (this.shot = this.ctx.params as LaunchShot);
    // (the fallback animatic: used only for shots that have no film-sNN.ts scene yet)
    const image = (s as { image?: string | null }).image ?? '';
    this.look = s.template === 'photo' ? 'photo' : s.template === 'endcard' ? 'end' : s.template === 'match' ? 'dark' : 'studio';
    if (this.look === 'photo') this.plate = (await loadImageQuiet(image)) ?? (await loadImageQuiet(TEMP_PLATES[image] ?? ''));
    if (s.template === 'endcard') this.mark = await loadImageQuiet('assets/brand/mmp_mark_film.svg');
    const screens = s.screen_asset ?? [];
    if (screens.length && this.look !== 'photo') {
      this.phone = new Phone3D(screens);
      await this.phone.load();
      this.stage = makeStage(this.ctx.renderer);
      this.stage.scene.add(this.phone.group);
      this.side = PHONE_SIDE[s.id] ?? 1;
      this.move = s.id === 'S04' ? 'rise' : s.id === 'S08' ? 'reveal' : s.template === 'feature' ? 'push' : s.template === 'features' ? 'orbit' : 'float';
    }
  }

  render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const s = this.shot, dur = s.end - s.start, lt = f.lt;

    // 1. background (redrawn every frame only when it moves)
    if (this.look === 'photo' || !this.bgDrawn) { this.drawBackground(lt / dur); this.bgDrawn = true; this.bg.upload(); }
    comp.draw(renderer, this.bg.texture, out, { mode: 'normal' }); // the layer is opaque: it overwrites `out`

    // 2. the phone
    if (this.phone && this.stage) {
      const pose = phonePose(this.move, lt, lt / dur, this.side);
      applyPose(this.phone, this.stage.cam, pose);
      this.phone.update(lt, dur, {}, 0, pose.ry);
      renderStage(renderer, this.stage.scene, this.stage.cam, out);
    }

    // 3–5. brand, copy, labels
    const c = this.fg.ctx;
    this.fg.clear();
    if (this.mark) this.drawBrand(c, lt);
    else this.drawCopy(c, lt, dur);
    if (LABELS) this.drawLabels(c, f, dur);
    comp.draw(renderer, this.fg.upload(), out);

    const light = this.look === 'studio' || this.look === 'end';
    return {
      hud: 0,
      bloom: light ? 0.05 : 0.25,
      bloomThreshold: light ? 2.5 : 1.0,
      vignette: light ? 0.1 : 0.3,
      ca: light ? 0.05 : 0.2,
      grain: 0.02,
      fade: s.id === 'S01' ? 1 - prog(f.t, 0, 0.67) : 0, // the film opens from black with the first sound
    };
  }

  // ---------------------------------------------------------------- background

  private drawBackground(p: number) {
    const c = this.bg.ctx;
    this.bg.clear();
    if (this.look === 'photo') {
      c.fillStyle = '#0B0807'; c.fillRect(0, 0, W, H);
      if (this.plate) {
        const k = 1 + 0.08 * ease.inOutQuad(clamp(p)); // slow push-in over the shot
        c.save(); c.translate(W / 2, H / 2); c.scale(k, k); c.translate(-W / 2, -H / 2);
        drawCover(c, this.plate, 0, 0, W, H);
        c.restore();
      }
      const g = c.createLinearGradient(0, 0, 0, H); // keep the copy readable at top and bottom
      g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      return;
    }
    if (this.look === 'coral') {
      if (this.plate) { drawCover(c, this.plate, 0, 0, W, H); return; } // P03, the generated gradient plate
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#FF4D6D'); g.addColorStop(1, '#FF8A3D');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      radial(c, W / 2, H * 0.4, 700, 'rgba(255,255,255,0.18)');
      return;
    }
    if (this.look === 'dark') {
      c.fillStyle = '#120A0A'; c.fillRect(0, 0, W, H);
      radial(c, W / 2, H * 0.45, 800, 'rgba(255,90,40,0.28)');
      return;
    }
    // studio / end card: warm off-white, peach toward the edges
    c.fillStyle = '#FFE3D6'; c.fillRect(0, 0, W, H);
    radial(c, W / 2, H * 0.42, 1250, C.paper);
  }

  // ---------------------------------------------------------------- brand (S03, S21)

  private drawBrand(c: CanvasRenderingContext2D, lt: number) {
    const s = this.shot, onCoral = s.id === 'S03';
    const k = ease.outBack(clamp(lt / 0.6)), size = 260;
    c.save();
    c.globalAlpha = clamp(lt / 0.3);
    c.translate(W / 2, H * 0.3); c.scale(k, k);
    c.drawImage(this.mark!, -size / 2, -size / 2, size, size);
    c.restore();
    // wordmark on beat 2, tagline on beat 3, the Coming soon pill on beat 4
    const beat = 0.8277;
    const word = 'MeetMyPets.', fam = F.wordmark(), ws = 140;
    const kw = prog(lt, beat, beat + 0.5, ease.outCubic);
    if (kw > 0) {
      c.save();
      c.globalAlpha = kw;
      c.font = font(fam, ws); c.textAlign = 'center';
      c.fillStyle = onCoral ? '#FFFFFF' : C.ink;
      c.fillText(word, W / 2, H * 0.66 + (1 - kw) * 30);
      c.restore();
    }
    const kt = prog(lt, 2 * beat, 2 * beat + 0.5, ease.outCubic);
    if (kt > 0) {
      c.save(); c.globalAlpha = kt;
      c.font = font(F.brandBody(400), 46); c.textAlign = 'center';
      c.fillStyle = onCoral ? 'rgba(255,255,255,0.92)' : '#667086';
      c.fillText(s.sub, W / 2, H * 0.76 + (1 - kt) * 20);
      c.restore();
    }
    const badge = (s as { badges?: string[] }).badges?.[0];
    const kb = prog(lt, 3 * beat, 3 * beat + 0.5, ease.outBack);
    if (badge && kb > 0) {
      c.save(); c.globalAlpha = clamp(kb);
      c.font = font(F.brandBody(600), 40);
      const w = measure(badge, F.brandBody(600), 40) + 96, h = 84;
      c.translate(W / 2, H * 0.87); c.scale(kb, kb);
      c.lineWidth = 3; c.strokeStyle = C.primary;
      c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h / 2); c.stroke();
      c.fillStyle = C.primary; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(badge, 0, 2);
      c.restore();
    }
  }

  // ---------------------------------------------------------------- copy ("tag type")

  private drawCopy(c: CanvasRenderingContext2D, lt: number, dur: number) {
    const s = this.shot;
    const lines = (s.title || '').split('\n').filter(Boolean);
    const light = this.look === 'studio';
    const ink = light ? C.ink : '#FFFFFF';
    const out = 1 - prog(lt, dur - 0.45, dur - 0.1, ease.inCubic); // gone before the cut
    const size = lines.length > 2 ? 84 : 96, lead = size * 1.12;
    const subLines = s.sub ? s.sub.split('\n').length : 0;
    // the copy column: beside the phone (on the other side), or where the photo leaves room
    const photo = PHOTO_COPY[s.id];
    const side = this.phone ? this.side : 0;
    const align: 'left' | 'right' | 'center' = photo ? photo[2] : Math.abs(side) > 0.3 ? 'left' : 'center';
    const x0 = photo ? photo[0] : side > 0.3 ? 160 : side < -0.3 ? 1060 : W / 2;
    const blockH = lines.length * lead + subLines * 52 + (s.kicker ? 60 : 0);
    let y = photo ? photo[1] : align === 'center' ? 190 : H / 2 - blockH / 2 + size * 0.8;
    c.save();
    c.globalAlpha = out;
    if (s.kicker) {
      const kk = prog(lt, 0.05, 0.45, ease.outCubic);
      c.globalAlpha = out * kk;
      c.font = font(F.brandDisplay(600), 30); c.textAlign = align;
      c.fillStyle = light ? C.primary : '#FFD27A';
      c.fillText(s.kicker.toUpperCase().split('').join(' '), x0, y - size * 0.95);
      c.globalAlpha = out;
    }
    // words spring in one after another (a word every 1/16 note), line by line; the accent words of a
    // line are one phrase that lands together in a single tag
    const fam = F.brandDisplay(700), step = 0.8277 / 4;
    const accentWords = new Set((s.accent || '').split(' ').map(norm).filter(Boolean));
    let wi = 0;
    for (const line of lines) {
      const runs: { text: string; accent: boolean }[] = [];
      for (const w of line.split(' ')) {
        const a = accentWords.has(norm(w)), last = runs.at(-1);
        if (a && last?.accent) last.text += ' ' + w;
        else runs.push({ text: w, accent: a });
      }
      const space = measure(' ', fam, size);
      const widths = runs.map((r) => measure(r.text, fam, size) + (r.accent ? size * 0.44 : 0));
      const lineW = widths.reduce((a, b) => a + b, 0) + space * (runs.length - 1);
      let x = align === 'left' ? x0 : align === 'right' ? x0 - lineW : x0 - lineW / 2;
      runs.forEach((r, i) => {
        const t0 = 0.2 + wi * step, k = prog(lt, t0, t0 + 0.45, ease.outBack);
        if (k > 0) this.drawWord(c, r.text, x + (r.accent ? size * 0.22 : 0), y, size, fam, k, lt - t0, r.accent, ink, !light);
        x += widths[i]! + space;
        wi += r.text.split(' ').length;
      });
      y += lead;
    }
    if (s.sub) {
      const ks = prog(lt, 0.25 + wi * step + 0.2, 0.25 + wi * step + 0.7, ease.outCubic);
      c.globalAlpha = out * ks;
      c.font = font(F.brandBody(400), 40); c.textAlign = align;
      c.fillStyle = light ? '#667086' : 'rgba(255,255,255,0.9)';
      s.sub.split('\n').forEach((l, i) => c.fillText(l, x0, y + 10 + i * 52 + (1 - ks) * 16));
    }
    c.restore();
  }

  /** One word: springs up into place; an accent word hangs in a collar-tag pill that swings and settles. */
  private drawWord(c: CanvasRenderingContext2D, w: string, x: number, y: number, size: number, fam: string, k: number, age: number, accent: boolean, ink: string, shadow: boolean) {
    c.save();
    c.font = font(fam, size);
    c.textAlign = 'left';
    const ww = measure(w, fam, size);
    if (accent) {
      // the tag: a pill hanging from a small ring above its centre; damped pendulum swing
      const swing = 0.22 * Math.exp(-age * 5) * Math.cos(age * 16);
      const px = x - size * 0.22, pw = ww + size * 0.44, ph = size * 1.12, py = y - size * 0.88;
      c.translate(px + pw / 2, py - size * 0.18);
      c.rotate(swing);
      c.scale(k, k);
      c.translate(-(px + pw / 2), -(py - size * 0.18));
      const g = c.createLinearGradient(px, py, px + pw, py + ph);
      g.addColorStop(0, C.primary); g.addColorStop(1, C.secondary);
      c.fillStyle = g;
      c.beginPath(); c.roundRect(px, py, pw, ph, ph / 2); c.fill();
      c.strokeStyle = C.accent; c.lineWidth = size * 0.05; // the ring
      c.beginPath(); c.arc(px + pw / 2, py - size * 0.08, size * 0.1, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#FFFFFF';
      c.fillText(w, x, y);
    } else {
      c.globalAlpha *= clamp(k);
      if (shadow) { c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 18; }
      c.fillStyle = ink;
      c.fillText(w, x, y + (1 - Math.min(1, k)) * size * 0.3);
    }
    c.restore();
  }

  // ---------------------------------------------------------------- review labels

  private drawLabels(c: CanvasRenderingContext2D, f: Frame, dur: number) {
    const s = this.shot;
    c.save();
    c.font = font(F.mono(500), 22);
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.beginPath(); c.roundRect(24, H - 92, W - 48, 64, 14); c.fill();
    c.fillStyle = '#FFFFFF'; c.textAlign = 'left';
    c.fillText(`${s.id} · ${s.act}`, 44, H - 52);
    c.textAlign = 'right';
    c.fillText(`${f.t.toFixed(2)} s  (${s.start.toFixed(2)}–${s.end.toFixed(2)})`, W - 44, H - 52);
    // shot progress and a tick that flashes on every beat
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(44, H - 40, W - 88, 4);
    c.fillStyle = C.secondary; c.fillRect(44, H - 40, (W - 88) * clamp(f.lt / dur), 4);
    const flash = Math.exp(-f.beatPhase * 6);
    c.fillStyle = `rgba(255,193,7,${0.25 + 0.75 * flash})`;
    c.beginPath(); c.arc(W - 40, 40, 10 + 8 * flash, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}

/** A word without its trailing punctuation, for matching accent words. */
const norm = (w: string) => w.replace(/[.,!?…]+$/u, '');

function radial(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)').replace(/^#[0-9A-F]{6}$/i, 'rgba(255,250,250,0)'));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

