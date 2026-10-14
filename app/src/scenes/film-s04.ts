// S04 · Feed (one bar, 9.933–13.244 s). "Endless scroll wall": no phone. A tall wall of posts rushes up past
// the camera and decelerates until Lily's post lands in the centre; it pops out of the wall.
//   0.00  the wall scrolls fast, slowing like a real fling (Lily's post stops in the middle)
//   0.80  Lily's post pops forward out of the wall
//   0.95  double paw-tap: a glossy 3D heart bursts out of the photo toward the camera;
//         the rail heart fills red and 111 rolls to 112
//   1.70  paw-tap "Follow": "Following"
//   2.55  the post sinks back and the wall flicks away upward
// Posts are cut from the Figma exports ("Feed page.png": Lily's post; "Discover page (1).png", "Discover page.png").
import type { Frame } from '../engine/scene';
import { W, H } from '../engine/gl';
import { F, font } from '../engine/type';
import { ease, lerp, prog } from '../engine/util';
import { UNIT, Widget, drawPawTap, type Rect } from './_ui';
import { C, Shot, THREE, bump } from './_shot';

const POST: Rect = [24, 104, 345, 516];
const T = { like1: 0.95, like2: 1.08, follow: 1.72 };
const RAIL: Record<string, Rect> = { heart: [314, 368, 48, 48], comment: [318, 430, 40, 42], share: [318, 492, 40, 38] };
const COLS = [-0.78, 0, 0.78], ROW = 1.12, ROWS = 7, TILE = 1.22;

/** A small copy of a part of an image (for the wall's many tiles: cheap textures). */
function thumb(img: HTMLImageElement, r: Rect, s = 1.4): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.round(r[2] * s); cv.height = Math.round(r[3] * s);
  const k = img.naturalWidth / 393;
  cv.getContext('2d')!.drawImage(img, r[0] * k, r[1] * k, r[2] * k, r[3] * k, 0, 0, cv.width, cv.height);
  return cv;
}

export default class Feed extends Shot {
  wall = new THREE.Group();
  tiles: { w: Widget; col: number; row: number }[] = [];
  post: Widget | null = null;
  rail: Record<string, Widget> = {};
  heart: THREE.Mesh | null = null;

  async setup() {
    this.makeWorld('feed', { center: [0.35, 0, -0.5], seed: 5 });
    const [lab, feed, disc] = await Promise.all([this.img(this.shot.screen_asset?.[0] ?? ''), this.img(this.shot.screen_asset?.[1] ?? ''), this.img('assets/figma/Discover page.png')]);
    if (!feed) return;
    // the wall: rows of posts in three columns (the centre one of row 0 is Lily's, the hero)
    const sources = [lab && thumb(lab, [24, 183, 345, 516]), thumb(feed, POST), disc && thumb(disc, [25, 207, 345, 499])].filter(Boolean) as HTMLCanvasElement[];
    for (let row = -ROWS; row <= ROWS; row++) for (let col = 0; col < 3; col++) {
      if (row === 0 && col === 1) continue;
      const cv = sources[(row * 3 + col + 30) % sources.length]!;
      const w = new Widget(cv, [0, 0, cv.width / 1.4, cv.height / 1.4], { scale: 1.4 * (393 / 393), radius: 26 });
      this.tiles.push({ w, col, row });
      this.wall.add(w.group);
    }
    this.stage.scene.add(this.wall);
    // Lily's post, full resolution, with its rail buttons lifted out as separate slabs
    this.post = new Widget(feed, POST, { radius: 32 }).slab(0.035);
    this.stage.scene.add(this.post.group);
    const [px, py, pw, ph] = POST;
    for (const [name, r] of Object.entries(RAIL)) {
      const w = new Widget(feed, r, { radius: 12 }).slab(0.02, '#FFFFFF');
      w.group.position.set((r[0] + r[2] / 2 - (px + pw / 2)) * UNIT, -(r[1] + r[3] / 2 - (py + ph / 2)) * UNIT, 0.0);
      this.post.group.add(w.group);
      this.rail[name] = w;
    }
    // the 3D heart that bursts out on the like
    const s = new THREE.Shape();
    s.moveTo(0, -0.42); s.bezierCurveTo(-0.62, -0.02, -0.5, 0.5, 0, 0.2); s.bezierCurveTo(0.5, 0.5, 0.62, -0.02, 0, -0.42);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 32 });
    geo.center();
    this.heart = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.22, metalness: 0.1, emissive: new THREE.Color('#FF1744'), emissiveIntensity: 0.25 }));
    this.heart.castShadow = true;
    this.stage.scene.add(this.heart);
  }

  frame(lt: number) {
    this.camera(lt, [
      { t: 0, pos: [-0.35, -0.35, 3.3], at: [0.35, 0.05, 0] },
      { t: 0.8, pos: [-0.15, -0.2, 3.0], at: [0.4, 0, 0], e: ease.inOutCubic },
      { t: 1.6, pos: [0.0, -0.1, 2.6], at: [0.45, 0, 0], e: ease.inOutCubic },
      { t: 2.5, pos: [-0.05, -0.12, 2.7], at: [0.42, 0.05, 0], e: ease.inOutCubic },
      { t: 3.311, pos: [-0.2, 0.4, 3.0], at: [0.4, 0.9, 0], e: ease.inCubic },
    ]);
    // the wall: a fling that decelerates onto Lily's post; at the end it flicks away upward
    const settle = ease.outExpo(prog(lt, 0, 0.85)), flick = ease.inExpo(prog(lt, 2.6, 3.3));
    const off = lerp(-ROW * 9, 0, settle) + flick * ROW * 7;
    this.wall.position.set(0.4, 0, -0.25);
    this.wall.rotation.set(0.05, -0.32, 0);
    for (const t of this.tiles) {
      let y = -t.row * ROW + off;
      y = ((y + ROW * (ROWS + 0.5)) % (ROW * (2 * ROWS + 1)) + ROW * (2 * ROWS + 1)) % (ROW * (2 * ROWS + 1)) - ROW * (ROWS + 0.5); // endless
      t.w.setWorld([COLS[t.col]!, y, 0], [0, 0, 0], TILE);
      t.w.mesh.material.opacity = 0.9;
    }
    // Lily's post rides with the wall, then pops forward out of it, then sinks back for the flick
    const post = this.post;
    if (!post) return;
    const pop = ease.outBack(prog(lt, 0.8, 1.15)) * (1 - ease.inCubic(prog(lt, 2.45, 2.7)));
    this.wall.updateMatrixWorld(true);
    const at = this.wall.localToWorld(new THREE.Vector3(0, off, 0.0));
    post.setWorld([at.x + 0.05 * pop, at.y, at.z + 0.55 * pop], [0.05 * (1 - pop), -0.32 + 0.12 * pop, 0], TILE * (1 + 0.28 * pop));
    post.shine(lt * 0.3);
    const lift = ease.outBack(prog(lt, 0.9, 1.2));
    for (const [name, w] of Object.entries(this.rail)) {
      w.group.position.z = 0.1 * lift;
      w.mesh.scale.setScalar(1 + 0.3 * bump(lt, name === 'heart' ? T.like2 : -1, 0.3));
    }
    // the heart bursts out of the photo toward the camera, spinning, then fades
    const h = this.heart!, hk = prog(lt, T.like2, T.like2 + 0.9);
    h.visible = hk > 0 && hk < 1;
    if (h.visible) {
      post.group.updateMatrixWorld(true);
      const from = post.group.localToWorld(new THREE.Vector3(0, 0.12, 0.05)), to = this.stage.cam.position.clone().lerp(from, 0.45);
      const k = ease.outCubic(hk);
      h.position.lerpVectors(from, to, k);
      h.rotation.set(0.2, lerp(-0.6, 0.6, k) + hk * 2, 0);
      const s = ease.outBack(Math.min(1, hk * 3)) * 0.32 * (1 - ease.inCubic(prog(hk, 0.6, 1)));
      h.scale.setScalar(Math.max(0.001, s));
    }
    // repaints: Lily's name over "Ruby / Maine Coon", Follow → Following; the rail heart and the count
    const following = lt >= T.follow, liked = lt >= T.like2, roll = ease.outCubic(prog(lt, T.like2, T.like2 + 0.3));
    post.drawKeyed(`p${following}`, (c) => {
      post.blurOut(c, [34, 118, 88, 32]);
      post.blurOut(c, [236, 106, 136, 46]);
      post.blurOut(c, [84, 524, 130, 40]);
      for (const r of Object.values(RAIL)) post.blurOut(c, [r[0] - 2, r[1] - 2, r[2] + 4, r[3] + 4], 7);
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 6;
      c.font = font(F.brandDisplay(600), 15); c.fillStyle = '#FFFFFF'; c.fillText('Lily', 87, 542);
      c.font = font(F.brandBody(400), 11); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Aussie  •  Bengaluru', 87, 557);
      c.shadowBlur = 0;
      c.fillStyle = following ? C.orange : C.red; c.beginPath(); c.roundRect(following ? 240 : 246, 122, following ? 84 : 72, 24, 12); c.fill();
      c.font = font(F.brandBody(400), 12); c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(following ? 'Following' : 'Follow', 282, 134.5);
    }, 1);
    const heart = this.rail.heart;
    heart?.drawKeyed(`h${liked}${roll.toFixed(2)}`, (c) => {
      heart.blurOut(c, [312, 366, 52, 52], 8);
      drawHeart(c, 338, 386, 15, liked ? C.red : null);
      c.save(); c.beginPath(); c.rect(314, 401, 48, 16); c.clip();
      c.font = font(F.brandBody(600), 10.5); c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 4;
      c.fillText('111 likes', 338, 409 - roll * 14);
      c.fillText('112 likes', 338, 423 - roll * 14);
      c.restore();
    }, 0);
  }

  overlay(c: CanvasRenderingContext2D, lt: number, _f: Frame) {
    this.headline(c, lt, { x: 100, y: 480, size: 88, at: 0.2, until: 2.6, title: 'Like what\nyou love.' });
    const post = this.post, cam = this.stage.cam;
    if (!post) return;
    const [hx, hy] = post.toFrame(cam, 196, 330);
    drawPawTap(c, hx, hy, lt - T.like1, 80, '#FFFFFF');
    drawPawTap(c, hx + 12, hy + 8, lt - T.like2, 80, '#FFFFFF');
    drawPawTap(c, ...post.toFrame(cam, 282, 134), lt - T.follow, 70, '#FFFFFF');
  }
}

/** A heart centred on (x, y), `s` = half its width; `fill` null = a white outline. */
export function drawHeart(c: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string | null) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(0, s * 0.95);
  c.bezierCurveTo(-s * 1.35, 0, -s * 0.9, -s * 1.05, 0, -s * 0.35);
  c.bezierCurveTo(s * 0.9, -s * 1.05, s * 1.35, 0, 0, s * 0.95);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); } else { c.strokeStyle = '#FFFFFF'; c.lineWidth = s * 0.14; c.stroke(); }
  c.restore();
}

export { W, H };
