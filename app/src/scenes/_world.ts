// The film's world: per act, a colour (a soft gradient backdrop), floating decor in depth (paw prints and
// little loops, blurred like out-of-focus objects, drifting slowly so every camera move shows parallax),
// a floor that catches soft shadows, and product-shot lighting with a shadow-casting key light.
import * as THREE from 'three';
import { W, H } from '../engine/gl';
import { mulberry32 } from '../engine/util';

export type Act = 'hello' | 'signin' | 'profile' | 'feed' | 'discover' | 'match' | 'chat' | 'montage' | 'end';

/** Backdrop gradient (top, bottom), a glow colour, and the decor's tint, per act. */
export const PALETTE: Record<Act, { top: string; bottom: string; glow: string; decor: string[]; dark?: boolean }> = {
  hello: { top: '#FFF7F2', bottom: '#FFE2D4', glow: 'rgba(255,255,255,0.9)', decor: ['#FF7A00', '#FF1744'] },
  signin: { top: '#FFF3EC', bottom: '#FFD2C2', glow: 'rgba(255,250,248,0.9)', decor: ['#FF1744', '#FF7A00'] },
  profile: { top: '#FFF6E8', bottom: '#FFD7AE', glow: 'rgba(255,252,245,0.9)', decor: ['#FF7A00', '#FFC107'] },
  feed: { top: '#FFF1F4', bottom: '#FFC6D2', glow: 'rgba(255,250,252,0.9)', decor: ['#FF1744', '#FF7A00'] },
  discover: { top: '#FFF4EF', bottom: '#FFCDB8', glow: 'rgba(255,252,250,0.9)', decor: ['#FF7A00', '#FF1744'] },
  match: { top: '#1C0E10', bottom: '#0C0607', glow: 'rgba(255,90,40,0.35)', decor: ['#FF7A00', '#FFC107'], dark: true },
  chat: { top: '#FFF9EA', bottom: '#FFDFA6', glow: 'rgba(255,253,245,0.9)', decor: ['#FF7A00', '#FFC107'] },
  montage: { top: '#FF3D6B', bottom: '#FF8A3D', glow: 'rgba(255,255,255,0.25)', decor: ['#FFFFFF', '#FFE0B2'] },
  end: { top: '#FFFAF8', bottom: '#FFE6DA', glow: 'rgba(255,255,255,0.95)', decor: ['#FF7A00', '#FF1744'] },
};

/** Paints an act's backdrop into a 2D canvas (the Shot's `bg` layer). */
export function paintBackdrop(c: CanvasRenderingContext2D, act: Act) {
  const p = PALETTE[act];
  const g = c.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, p.top); g.addColorStop(1, p.bottom);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = c.createRadialGradient(W * 0.58, H * 0.42, 0, W * 0.58, H * 0.42, W * 0.6);
  r.addColorStop(0, p.glow); r.addColorStop(1, p.glow.replace(/[\d.]+\)$/, '0)'));
  c.fillStyle = r; c.fillRect(0, 0, W, H);
}

/** A soft paw print or loop on a canvas (blurred by `blur` px for depth of field). */
function decorTexture(kind: 'paw' | 'loop' | 'dot', color: string, blur: number): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const c = cv.getContext('2d')!;
  c.filter = blur > 0 ? `blur(${blur}px)` : 'none';
  c.fillStyle = color; c.strokeStyle = color;
  c.translate(128, 128);
  if (kind === 'paw') {
    c.beginPath(); c.ellipse(0, 22, 40, 33, 0, 0, Math.PI * 2); c.fill();
    for (const [x, y, r] of [[-44, -16, 15], [-16, -44, 17], [16, -44, 17], [44, -16, 15]] as const) { c.beginPath(); c.ellipse(x, y, r, r * 1.2, 0, 0, Math.PI * 2); c.fill(); }
  } else if (kind === 'loop') {
    c.lineWidth = 14;
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 20, 0, 34, 58, s * 0.5, 0, Math.PI * 2); c.stroke(); }
  } else {
    c.beginPath(); c.arc(0, 0, 60, 0, Math.PI * 2); c.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

interface Decor { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; base: THREE.Vector3; spin: number; drift: number; phase: number }

export class World {
  group = new THREE.Group();
  decor: Decor[] = [];
  key: THREE.DirectionalLight;
  floor: THREE.Mesh | null = null;

  /**
   * `act` picks the colours. `count` decor pieces are scattered in a box round the subject (`center`),
   * mostly behind it, a few near the camera (big and very blurred). `floorY` adds a shadow-catching floor.
   */
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, public act: Act, o: { count?: number; center?: [number, number, number]; floorY?: number | null; seed?: number } = {}) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const p = PALETTE[act], rnd = mulberry32(o.seed ?? 7), [cx, cy, cz] = o.center ?? [0, 0, 0];
    // product lighting: a soft key that casts shadows, plus the stage's existing fill and rim lights
    this.key = new THREE.DirectionalLight(0xffffff, 1.6);
    this.key.position.set(cx - 2, cy + 4, cz + 3);
    this.key.target.position.set(cx, cy, cz);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.radius = 8;
    const sc = this.key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; sc.near = 0.5; sc.far = 14;
    this.group.add(this.key, this.key.target);
    if (o.floorY != null) {
      this.floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: p.dark ? 0.45 : 0.14 }));
      this.floor.rotation.x = -Math.PI / 2;
      this.floor.position.set(cx, o.floorY, cz);
      this.floor.receiveShadow = true;
      this.group.add(this.floor);
    }
    const textures = new Map<string, THREE.CanvasTexture>();
    const tex = (kind: 'paw' | 'loop' | 'dot', color: string, blur: number) => {
      const k = `${kind}${color}${blur}`;
      if (!textures.has(k)) textures.set(k, decorTexture(kind, color, blur));
      return textures.get(k)!;
    };
    for (let i = 0; i < (o.count ?? 22); i++) {
      const near = rnd() < 0.18; // a few big blurry ones close to the camera
      const z = near ? cz + 1.2 + rnd() * 0.8 : cz - 0.8 - rnd() * 3.2;
      const blur = near ? 22 : Math.round(2 + (Math.abs(z - cz) - 0.8) * 4);
      const kind = rnd() < 0.55 ? 'paw' : rnd() < 0.6 ? 'loop' : 'dot';
      const color = p.decor[Math.floor(rnd() * p.decor.length)]!;
      const size = (near ? 0.5 : 0.18) + rnd() * (near ? 0.4 : 0.3);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex(kind, color, blur), transparent: true, opacity: near ? 0.18 : 0.1 + rnd() * 0.16, depthWrite: false, toneMapped: false }));
      const base = new THREE.Vector3(cx + (rnd() - 0.5) * (near ? 5 : 9), cy + (rnd() - 0.5) * (near ? 3 : 5), z);
      mesh.position.copy(base);
      mesh.rotation.z = rnd() * Math.PI * 2;
      this.group.add(mesh);
      this.decor.push({ mesh, base, spin: (rnd() - 0.5) * 0.4, drift: 0.04 + rnd() * 0.08, phase: rnd() * 10 });
    }
    scene.add(this.group);
  }

  /** Per frame: the decor drifts upward and turns slowly (deterministic in t), always facing the camera. */
  update(t: number, cam: THREE.Camera) {
    for (const d of this.decor) {
      d.mesh.position.set(d.base.x + Math.sin(t * 0.4 + d.phase) * 0.06, d.base.y + d.drift * t + Math.sin(t * 0.7 + d.phase) * 0.05, d.base.z);
      d.mesh.quaternion.copy(cam.quaternion);
      d.mesh.rotateZ(d.phase + d.spin * t);
    }
  }
}

/** Makes every mesh under `obj` cast shadows (and receive them if `receive`). */
export function castShadows(obj: THREE.Object3D, receive = false) {
  obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; if (receive) o.receiveShadow = true; } });
}
