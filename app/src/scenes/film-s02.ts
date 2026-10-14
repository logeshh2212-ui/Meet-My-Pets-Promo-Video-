// S02 · Sign in (one bar, 3.311–6.622 s). "Keyboard world": no phone. A giant keyboard lies across the
// floor; the Login card's pieces float above it as thick slabs (the mascot, the logo and "Welcome" behind).
//   0.00  the camera skims low across the keys; the pieces arrive from the depth
//   0.25  the email types: each letter's key lights as a paw presses it; the field fills in
//   1.25  a whip up to the password: keys flash, dots appear
//   2.50  a push onto the Login button: paw press, a shockwave ring, a loading spinner, then a red burst
// Pieces are cut from the Figma export "Login Page.png"; the keyboard is drawn in the app's style.
import type { Frame } from '../engine/scene';
import { W, H } from '../engine/gl';
import { F, font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { Widget, drawPawTap, typed, type Rect } from './_ui';
import { Keyboard } from './_kit';
import { C, Shot, bump } from './_shot';
import { castShadows } from './_world';

const CARD: [number, number, number] = [246, 242, 242], PAGE: [number, number, number] = [255, 250, 250];
const FIELD = '#F8F5F5';
const EMAIL = 'pawrent@pawmail.com', PASS = 'pawsome1';
const T = { email: 0.25, per: 0.045, pass: 1.36, perPass: 0.055, login: 2.5 };

export default class SignIn extends Shot {
  kb = new Keyboard();
  w: Record<string, Widget> = {};

  async setup() {
    this.makeWorld('signin', { floorY: -0.62, center: [0, 0, 0], seed: 3 });
    const img = await this.img(this.shot.screen_asset?.[0] ?? '');
    if (!img) return;
    const add = (name: string, rect: Rect, o: { radius?: number; key?: [number, number, number] }, slab: boolean) => {
      const w = new Widget(img, rect, o);
      if (slab) w.slab(0.03);
      this.w[name] = w;
      this.stage.scene.add(w.group);
    };
    add('mascot', [128, 36, 140, 94], { key: PAGE }, false);
    add('logo', [155, 139, 85, 83], { key: CARD }, false);
    add('welcome', [112, 222, 170, 38], { key: CARD }, false);
    add('email', [31, 344, 332, 44], { radius: 22 }, true);
    add('password', [31, 432, 332, 44], { radius: 22 }, true);
    add('login', [31, 546, 332, 48], { radius: 24 }, true);
    this.stage.scene.add(this.kb.widget.group);
    castShadows(this.kb.widget.group);
  }

  frame(lt: number) {
    this.camera(lt, [
      // the card stands right of centre (x = 0.45) so the headline has the left of the frame
      { t: 0, pos: [-1.3, -0.32, 1.7], at: [0.5, -0.42, 0.2] },
      { t: 0.32, pos: [-0.35, 0.12, 2.3], at: [0.15, 0.3, 0], e: ease.inOutCubic },
      { t: 1.2, pos: [-0.15, 0.14, 2.25], at: [0.15, 0.28, 0], e: ease.inOutCubic },
      { t: 1.42, pos: [0.95, 0.05, 2.15], at: [0.2, 0.06, 0], e: ease.inOutExpo },
      { t: 2.3, pos: [0.8, 0.0, 2.1], at: [0.22, 0.04, 0], e: ease.inOutCubic },
      { t: 2.55, pos: [0.5, -0.16, 1.35], at: [0.45, -0.2, 0], e: ease.inOutExpo },
      { t: 3.311, pos: [0.46, -0.18, 1.05], at: [0.45, -0.2, 0], e: ease.outCubic },
    ]);
    // the keyboard: huge, lying tilted across the floor; it lights the key being typed
    this.kb.widget.setWorld([0.45, -0.56, 0.35], [-1.2, 0, 0], 3.3);
    const ch = this.currentKey(lt);
    this.kb.draw(ch);
    // the pieces arrive from the depth, staggered, then float
    const arrive = (i: number) => ease.outExpo(prog(lt, i * 0.04, i * 0.04 + 0.5));
    const bob = (i: number) => Math.sin(lt * 1.6 + i) * 0.012;
    const put = (name: string, i: number, pos: [number, number, number], s: number, tilt: [number, number] = [0, 0], press = 0) => {
      const w = this.w[name];
      if (!w) return;
      const k = arrive(i);
      w.setWorld([pos[0], pos[1] + bob(i), lerp(-3, pos[2], k)], [tilt[0], tilt[1], 0], s * (1 - 0.06 * press));
      w.mesh.material.opacity = clamp(k * 1.5);
      w.shine(lt * 0.35 + i * 0.2);
    };
    put('mascot', 0, [0.05, 0.92, -0.9], 2.2);
    put('logo', 1, [0.75, 0.98, -1.1], 2.0);
    put('welcome', 2, [1.2, 0.8, -0.8], 2.2);
    put('email', 3, [0.45, 0.32, 0], 2.3, [-0.12, 0.1]);
    put('password', 4, [0.45, 0.06, 0.05], 2.3, [-0.12, -0.08]);
    put('login', 5, [0.45, -0.2, 0.12], 2.4, [-0.1, 0], bump(lt, T.login, 0.28));
    this.paintFields(lt);
  }

  /** The key being pressed right now (one per typed character), or '' between presses. */
  private currentKey(lt: number): string {
    const pick = (text: string, t0: number, per: number) => {
      const i = Math.floor((lt - t0) / per);
      return i >= 0 && i < text.length && (lt - t0) % per < per * 0.7 ? text[i]! : '';
    };
    return pick(EMAIL, T.email, T.per) || pick(PASS, T.pass, T.perPass);
  }

  private paintFields(lt: number) {
    const e = this.w.email, p = this.w.password, l = this.w.login;
    const blink = Math.floor(lt * 3) % 2;
    if (e) {
      const text = lt >= T.email ? typed(EMAIL, lt, T.email, T.per) : '';
      e.drawKeyed(`${text.length}|${lt >= T.email}|${blink}|${lt < T.pass}`, (c) => {
        if (lt < T.email) return;
        c.fillStyle = FIELD; c.fillRect(38, 350, 290, 32);
        ring(c, e.rect, lt < T.pass);
        c.font = font(F.brandBody(400), 15); c.fillStyle = C.ink; c.textBaseline = 'middle';
        c.fillText(text, 47, 366.5);
        if (blink === 0 && lt < T.pass) { c.fillStyle = C.orange; c.fillRect(47 + measure(text, F.brandBody(400), 15) + 1.5, 357, 1.6, 19); }
      });
    }
    if (p) {
      const n = lt >= T.pass ? Math.min(PASS.length, Math.floor((lt - T.pass) / T.perPass) + 1) : 0;
      p.drawKeyed(`${n}|${lt >= T.pass && lt < T.login}`, (c) => {
        if (lt < T.pass) return;
        c.fillStyle = FIELD; c.fillRect(38, 438, 280, 32);
        ring(c, p.rect, lt < T.login);
        c.fillStyle = C.ink;
        for (let i = 0; i < n; i++) { c.beginPath(); c.arc(50 + i * 11, 454, 3.6, 0, Math.PI * 2); c.fill(); }
      });
    }
    if (l) {
      const m = ease.inOutCubic(prog(lt, T.login + 0.12, T.login + 0.38));
      l.drawKeyed(m <= 0 ? 'idle' : `${m.toFixed(2)}|${Math.round(lt * 30)}`, m <= 0 ? undefined : (c) => {
        const [x, y, ww, hh] = l.rect, cx = x + ww / 2, cy = y + hh / 2, pw = lerp(ww, hh, m);
        c.fillStyle = C.red; c.beginPath(); c.roundRect(cx - pw / 2, y, pw, hh, hh / 2); c.fill();
        c.globalAlpha = 1 - clamp(m * 3);
        c.font = font(F.brandBody(400), 20); c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('Login', cx, cy + 1);
        c.globalAlpha = clamp(m * 2 - 1);
        c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.lineCap = 'round';
        const a = lt * 11; c.beginPath(); c.arc(cx, cy, 11, a, a + 4.2); c.stroke();
      }, m <= 0 ? 1 : 0);
    }
  }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    this.headline(c, lt, { x: 110, y: 520, size: 104, at: 0.3, until: 2.45 });
    const cam = this.stage.cam;
    // a paw on every key press (small and quick: typing)
    const ch = this.currentKey(lt);
    if (ch) {
      const kc = this.kb.keyCenter(ch);
      if (kc) { const [x, y] = this.kb.widget.toFrame(cam, kc[0], kc[1]); drawPawTap(c, x, y, 0.05, 58); }
    }
    if (this.w.email && lt > T.email - 0.3 && lt < T.email) drawPawTap(c, ...this.w.email.toFrame(cam, 110, 366), lt - T.email, 60);
    if (this.w.login) {
      const [lx, ly] = this.w.login.toFrame(cam, 197, 570);
      drawPawTap(c, lx, ly + 40, lt - T.login, 90, '#FFFFFF');
      // the shockwave of the press
      const r = prog(lt, T.login, T.login + 0.5);
      if (r > 0 && r < 1) { c.strokeStyle = `rgba(255,23,68,${0.7 * (1 - r)})`; c.lineWidth = 8; c.beginPath(); c.ellipse(lx, ly, 200 + 700 * ease.outCubic(r), 60 + 260 * ease.outCubic(r), 0, 0, Math.PI * 2); c.stroke(); }
      const burst = ease.inOutCubic(prog(lt, 2.88, 3.24));
      if (burst > 0) { c.fillStyle = C.red; c.beginPath(); c.arc(lx, ly, 40 + Math.hypot(W, H) * burst, 0, Math.PI * 2); c.fill(); }
    }
  }
}

function ring(c: CanvasRenderingContext2D, r: Rect, on: boolean) {
  if (!on) return;
  const [x, y, w, h] = r;
  c.save(); c.strokeStyle = C.orange; c.lineWidth = 2; c.shadowColor = 'rgba(255,122,0,0.6)'; c.shadowBlur = 8;
  c.beginPath(); c.roundRect(x + 1, y + 1, w - 2, h - 2, h / 2 - 1); c.stroke(); c.restore();
}
