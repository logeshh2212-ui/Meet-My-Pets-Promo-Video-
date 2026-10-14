// The other pets of the community (everyone except Bubbly, Lily and Max, who come from the Figma exports).
// Each is a portrait crop of a photo in public/assets, so the feed wall and the Discover ring never repeat a dog.
import { F, font } from '../engine/type';
import { drawHeart } from './film-s04';

export interface Pet { name: string; breed: string; age: string; file: string; crop: [number, number, number, number] }

/** Crops are in source pixels, roughly 345:499 (a Discover card's shape) and centred on the dog. */
export const PETS: Pet[] = [
  { name: 'Rocky', breed: 'Shiba Inu', age: '3 yrs', file: 'assets/shot02_curious_dog.jpg', crop: [97, 140, 567, 820] },
  { name: 'Coco', breed: 'Golden Retriever', age: '5 yrs', file: 'assets/shot04_dogs_meeting.jpg', crop: [402, 124, 622, 900] },
  { name: 'Milo', breed: 'Shiba Inu', age: '1 yr', file: 'assets/shot10_real_friendship.jpg', crop: [186, 0, 508, 736] },
  { name: 'Daisy', breed: 'Golden Retriever', age: '6 mo', file: 'assets/shot10_real_friendship.jpg', crop: [740, 0, 508, 736] },
  { name: 'Hachi', breed: 'Shiba Inu', age: '4 yrs', file: 'assets/shot04_dogs_meeting.jpg', crop: [10, 200, 553, 800] },
  { name: 'Kuro', breed: 'Shiba Inu', age: '2 yrs', file: 'assets/shot03_new_world.jpg', crop: [750, 0, 1061, 1536] },
];

/** Draws `crop` of `img` to fill (w × h) at (x, y), like CSS object-fit: cover. */
export function drawCover(c: CanvasRenderingContext2D, img: CanvasImageSource, crop: readonly number[], x: number, y: number, w: number, h: number) {
  const [sx, sy, sw, sh] = crop as [number, number, number, number];
  const s = Math.max(w / sw, h / sh), dw = sw * s, dh = sh * s;
  c.drawImage(img, sx, sy, sw, sh, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/**
 * A feed post in the app's style (photo, name row, like rail, Follow pill), w × h design units,
 * on a canvas `s` times bigger. Used for the scroll wall's tiles.
 */
export function feedPost(img: CanvasImageSource, pet: Pet, likes: number, w = 345, h = 516, s = 1.4): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * s); cv.height = Math.round(h * s);
  const c = cv.getContext('2d')!;
  c.scale(s, s);
  c.save(); c.beginPath(); c.roundRect(0, 0, w, h, 26); c.clip();
  drawCover(c, img, pet.crop, 0, 0, w, h);
  const g = c.createLinearGradient(0, h * 0.6, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
  c.fillStyle = g; c.fillRect(0, h * 0.6, w, h * 0.4);
  c.restore();
  // the avatar (a face crop of the same photo) and the name row
  c.save(); c.beginPath(); c.arc(36, h - 46, 17, 0, Math.PI * 2); c.clip();
  const [sx, sy, sw] = pet.crop;
  drawCover(c, img, [sx + sw * 0.25, sy + sw * 0.15, sw * 0.5, sw * 0.5], 19, h - 63, 34, 34);
  c.restore();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.arc(36, h - 46, 17, 0, Math.PI * 2); c.stroke();
  c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 6; c.fillStyle = '#FFFFFF';
  c.font = font(F.brandDisplay(600), 15); c.fillText(pet.name, 62, h - 50);
  c.font = font(F.brandBody(400), 11); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText(`${pet.breed}  •  Bengaluru`, 62, h - 34);
  // the like rail and the Follow pill
  drawHeart(c, w - 30, h * 0.62, 13, null);
  c.font = font(F.brandBody(600), 10); c.fillStyle = '#FFFFFF'; c.textAlign = 'center';
  c.fillText(`${likes} likes`, w - 30, h * 0.62 + 26);
  c.shadowBlur = 0;
  c.fillStyle = '#FF1744'; c.beginPath(); c.roundRect(w - 90, 16, 72, 24, 12); c.fill();
  c.font = font(F.brandBody(400), 12); c.fillStyle = '#FFFFFF'; c.textBaseline = 'middle';
  c.fillText('Follow', w - 54, 28.5);
  return cv;
}
