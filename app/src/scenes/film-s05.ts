// S05 · Discover (one bar, 13.244–16.555 s). "Card carousel": the Discover cards stand in a ring like a
// merry-go-round in front of the camera.
//   0.00  the ring spins in fast and slows until Max's card faces the camera
//   0.86  paw-tap ✕: Max's card is flicked out of the ring, spinning away
//   1.60  the ring turns on to Lily's card
//   2.52  paw-tap ♥: a heart stamps on her card; it rushes the camera (into the match)
// Lily's card is cut from "Discover page.png"; Max's is built from the labrador photo in "Discover page (1).png";
// the others are the community's pets (_pets.ts), so every card in the ring is a different dog.
import type { Frame } from '../engine/scene';
import { F, font, measure } from '../engine/type';
import { clamp, ease, lerp, prog } from '../engine/util';
import { Widget, drawPawTap } from './_ui';
import { src } from './_kit';
import { C, Shot, THREE, bump } from './_shot';
import { drawHeart } from './film-s04';
import { PETS, drawCover } from './_pets';

const T = { pass: 0.86, like: 2.52 };
const N = 6, R = 1.55, CENTER = new THREE.Vector3(0.62, 0, -1.55);

export default class Discover extends Shot {
  ring = new THREE.Group();
  cards: Widget[] = [];

  async setup() {
    this.makeWorld('discover', { floorY: -0.62, center: [0.45, 0, -1.2], seed: 9 });
    const [disc, lab] = await Promise.all([this.img(this.shot.screen_asset?.[0] ?? ''), this.img(this.shot.screen_asset?.[1] ?? '')]);
    if (!disc) return;
    const petCard = (name: string, info: string, photo: (c: CanvasRenderingContext2D) => void) => new Widget(src(345, 499, (c) => {
      c.save(); c.beginPath(); c.roundRect(0, 0, 345, 499, 30); c.clip(); photo(c); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.22)'; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1;
      const pill = Math.max(176, measure(info, F.brandBody(400), 11.5) + 36); // wide enough for long breeds
      c.beginPath(); c.roundRect(11, 11, pill, 62, 31); c.fill(); c.stroke();
      c.fillStyle = '#FFFFFF'; c.font = font(F.brandDisplay(700), 25); c.fillText(name, 26, 42);
      c.font = font(F.brandBody(400), 11.5); c.fillText(info, 26, 61);
      c.drawImage(disc, 34 * 4, 639 * 4, 326 * 4, 56 * 4, 9, 432, 326, 56);
    }), [0, 0, 345, 499], { scale: 4, radius: 30 }).slab(0.03);
    const labPhoto = (sy: number, flip: boolean) => (c: CanvasRenderingContext2D) => {
      if (!lab) return;
      c.save(); if (flip) { c.translate(345, 0); c.scale(-1, 1); }
      // the clean part of the photo (the feed's name row and like rail cropped off)
      const sw = 540, sh = 700, s = Math.max(345 / sw, 499 / sh);
      c.drawImage(lab, 60, sy, sw, sh, (345 - sw * s) / 2, (499 - sh * s) / 2, sw * s, sh * s);
      c.restore();
    };
    const photos = new Map<string, HTMLImageElement | null>();
    for (const p of PETS) if (!photos.has(p.file)) photos.set(p.file, await this.img(p.file));
    const petPhoto = (name: string) => (c: CanvasRenderingContext2D) => {
      const p = PETS.find((q) => q.name === name)!, im = photos.get(p.file);
      if (im) drawCover(c, im, p.crop, 0, 0, 345, 499);
    };
    const info = (name: string) => { const p = PETS.find((q) => q.name === name)!; return `•  ${p.breed}   •  ${p.age}`; };
    const lily = new Widget(disc, [25, 207, 345, 499], { radius: 30 }).slab(0.03);
    // the ring: Max (front first), Lily (next), then more pets round the back
    this.cards = [
      petCard('Max', '•  Labrador   •  3 yrs', labPhoto(470, false)),
      lily,
      petCard('Rocky', info('Rocky'), petPhoto('Rocky')),
      petCard('Coco', info('Coco'), petPhoto('Coco')),
      petCard('Milo', info('Milo'), petPhoto('Milo')),
      petCard('Daisy', info('Daisy'), petPhoto('Daisy')),
    ];
    for (const c of this.cards) this.ring.add(c.group);
    this.ring.position.copy(CENTER);
    this.stage.scene.add(this.ring);
  }

  /** The ring's turn: card i faces the camera when the angle is -i * step. */
  private angle(lt: number) {
    const step = (Math.PI * 2) / N;
    const spinIn = lerp(-Math.PI * 1.6, 0, ease.outExpo(prog(lt, 0, 0.8)));
    const toLily = -step * ease.inOutCubic(prog(lt, 1.45, 1.95));
    return spinIn + toLily;
  }

  frame(lt: number) {
    this.camera(lt, [
      { t: 0, pos: [0.62, 0.7, 2.3], at: [0.62, 0.02, -0.4] },
      { t: 0.8, pos: [0.4, 0.22, 2.2], at: [0.62, 0, -0.3], e: ease.inOutCubic },
      { t: 2.4, pos: [0.55, 0.12, 1.95], at: [0.62, 0, -0.2], e: ease.inOutCubic },
      { t: 3.311, pos: [0.62, 0.02, 0.75], at: [0.62, 0, -0.2], e: ease.inCubic },
    ]);
    const a = this.angle(lt), step = (Math.PI * 2) / N;
    this.cards.forEach((card, i) => {
      const th = a + i * step;
      let pos: [number, number, number] = [Math.sin(th) * R, 0.0, Math.cos(th) * R];
      let rot: [number, number, number] = [0, th * 0.3, 0]; // mostly facing the camera (a fanned deck going round)
      let s = 1.0;
      if (i === 0) { // Max: flicked out of the ring after the ✕
        const out = ease.inCubic(prog(lt, T.pass + 0.06, T.pass + 0.5));
        pos = [pos[0] - out * 3.2, pos[1] + out * 0.8, pos[2] + out * 0.4];
        rot = [rot[0], rot[1] - out * 2.4, rot[2] + out * 0.9];
        s *= 1 - 0.06 * bump(lt, T.pass);
        card.group.visible = out < 1;
      }
      if (i === 1) { // Lily: rushes the camera after the like
        const rush = ease.inCubic(prog(lt, T.like + 0.32, 3.311));
        pos = [pos[0], pos[1], pos[2] + rush * 0.9];
        s *= 1 + 0.04 * bump(lt, T.like, 0.3);
      }
      card.setWorld(pos, rot, s);
      card.shine(lt * 0.3 + i * 0.17);
    });
    const lily = this.cards[1];
    lily?.drawKeyed(`l${lt >= T.like}`, (c) => {
      if (lt < T.like) return;
      c.fillStyle = 'rgba(255,23,68,0.35)'; c.beginPath(); c.arc(230, 667, 30, 0, Math.PI * 2); c.fill();
    });
  }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    this.headline(c, lt, { x: 100, y: 470, size: 92, at: 0.2, until: 2.5, title: 'Pets\nnear you.' });
    const cam = this.stage.cam, max = this.cards[0], lily = this.cards[1];
    if (max) drawPawTap(c, ...max.toFrame(cam, 164, 667), lt - T.pass, 72, '#FFFFFF');
    if (lily) {
      drawPawTap(c, ...lily.toFrame(cam, 255, 667), lt - T.like, 72, '#FFFFFF');
      const st = prog(lt, T.like + 0.04, T.like + 0.3);
      if (st > 0) {
        const [x, y] = lily.toFrame(cam, 172, 330);
        c.save(); c.globalAlpha = clamp(st * 3);
        c.translate(x, y); c.rotate(-0.15); const k = lerp(1.8, 1, ease.outBack(st)); c.scale(k, k);
        c.shadowColor = 'rgba(255,23,68,0.6)'; c.shadowBlur = 30;
        drawHeart(c, 0, 0, 100, C.red);
        c.restore();
      }
    }
    // the ✕ flash as Max is passed
    const xf = prog(lt, T.pass + 0.04, T.pass + 0.34);
    if (xf > 0 && xf < 1 && max) {
      const [x, y] = max.toFrame(cam, 172, 250);
      c.save(); c.globalAlpha = 1 - xf; c.strokeStyle = C.red; c.lineWidth = 24; c.lineCap = 'round';
      const r = 90 + 30 * xf;
      c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); c.stroke();
      c.restore();
    }
  }
}
