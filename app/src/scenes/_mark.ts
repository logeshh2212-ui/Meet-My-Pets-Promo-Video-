// The MeetMyPets double-loop, drawn in code as its two separate loops (official paths from the app's
// nav_discover.svg), so the film can animate them on their own: Bubbly's loop and Lily's loop meeting.
// Path coordinates are the SVG's (the mark is centred on (17.75, 18) in a 36-unit box).
const LEFT = 'M21.8434 14.0068C25.1791 20.9084 24.5 28.4559 20.3268 30.8646C16.1535 33.2733 10.0663 29.631 6.73063 22.7294C3.39499 15.8278 4.07403 8.28028 8.24732 5.8716C12.4206 3.46291 18.5078 7.10515 21.8434 14.0068ZM7.65702 22.1947C10.5837 28.2502 15.9246 31.446 19.5863 29.3326C23.248 27.2192 23.8438 20.597 20.9171 14.5415C17.9903 8.48594 12.6494 5.29023 8.98776 7.40362C5.32611 9.51701 4.73031 16.1392 7.65702 22.1947Z';
const RIGHT = 'M13.6522 14.0068C10.3165 20.9084 10.9956 28.4559 15.1689 30.8646C19.3421 33.2733 25.4293 29.631 28.765 22.7294C32.1006 15.8278 31.4216 8.28028 27.2483 5.8716C23.075 3.46291 16.9878 7.10515 13.6522 14.0068ZM27.8386 22.1947C24.9119 28.2502 19.571 31.446 15.9093 29.3326C12.2476 27.2192 11.6518 20.597 14.5786 14.5415C17.5053 8.48594 22.8462 5.29023 26.5078 7.40362C30.1695 9.51701 30.7653 16.1392 27.8386 22.1947Z';
const CX = 17.75, CY = 18, BOX = 36;

let paths: { L: Path2D; R: Path2D } | null = null;
const P = () => (paths ??= { L: new Path2D(LEFT), R: new Path2D(RIGHT) });

/**
 * One loop ('L' or 'R') centred so that, drawn at the same (x, y) with the same `size`, the two loops
 * make the mark. `dx`, `rot` move it away from its place (for flying in); `fill` = colour or gradient.
 */
export function drawLoop(c: CanvasRenderingContext2D, which: 'L' | 'R', x: number, y: number, size: number, fill: string | CanvasGradient, dx = 0, dy = 0, rot = 0) {
  const s = size / BOX;
  c.save();
  c.translate(x + dx, y + dy);
  c.rotate(rot);
  c.scale(s, s);
  c.translate(-CX, -CY);
  c.fillStyle = fill;
  c.fill(P()[which], 'evenodd');
  c.restore();
}

/** The brand gradient across the mark's box (red at the bottom, orange, amber at the top), for drawLoop. */
export function markGradient(c: CanvasRenderingContext2D, x: number, y: number, size: number): CanvasGradient {
  const g = c.createLinearGradient(x, y + size * 0.42, x, y - size * 0.42);
  g.addColorStop(0, '#FF1744'); g.addColorStop(0.5, '#FF7A00'); g.addColorStop(1, '#FFC107');
  return g;
}
