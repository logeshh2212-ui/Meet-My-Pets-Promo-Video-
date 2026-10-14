# 5. The shots, one by one, and the building blocks

## 5.1 Three coordinate systems (read this first)

Almost every bug in this kind of code is a coordinate mix-up. There are three spaces:

| Space | Units | Origin | Used for |
|---|---|---|---|
| **Design units** | Figma points: the phone frame is **393 × 852** | top-left of the Figma frame | cutting widgets (`[x, y, w, h]`), painting on them |
| **World units** | three.js metres-ish; the phone is 1.5 tall | centre of the 3D scene; **y up**, **z towards the camera** | placing widgets, cameras, lights |
| **Frame pixels** | **1920 × 1080** | top-left of the video | 2D overlay: headlines, paw taps, flashes |

The bridges between them:
- `UNIT = SCREEN_W / 393`: world units per design unit ([`_ui.ts`](../../app/src/scenes/_ui.ts)).
- `widget.toFrame(cam, u, v)`: a point **on a widget** (design units) → **frame pixels**, through the camera. This is how a 2D paw lands exactly on a 3D button.
- `Export px = design units × 4` for our @4x Figma exports.

## 5.2 The building blocks ("kits")

### `_shot.ts`: the base of every shot
- `makeWorld(act)`: colour, decor and floor for this part of the story.
- `camera(lt, keys)`: the camera glides between **keyframes** `{ t, pos, at, e }` (`e` = the easing into that key: `outExpo` for snappy, `inOutCubic` for smooth, `inOutExpo` for a whip).
- `headline(c, lt, {...})`: the **tag-type** title: words spring in, accent words hang in a swinging collar-tag pill.
- `punch`: how hard the beat punch zooms.
- Renders the 3D stage through a shared **4× MSAA** target.

### `_ui.ts`: widgets
```ts
const w = new Widget(img, [x, y, w, h], { radius, key, scale, at });
```
- `img`: a Figma export **or** a canvas we drew in code (`src()` in `_kit.ts`).
- `key`: a background colour to **key out** (make transparent): text and logos become floating "stickers".
- `w.draw(paint)` / `w.drawKeyed(key, paint)`: repaint the widget. `drawKeyed` only repaints when `key` changes. **Important for speed**: every repaint re-uploads a big texture to the GPU.
- `w.blurOut(c, rect)`: erase text from a photo by redrawing that patch blurred (how "Ruby · Maine Coon" became "Lily · Aussie").
- `w.slab(depth, colour)`: give it thickness: a rounded 3D slab behind it that casts a real shadow, plus a gloss sheen.
- `w.setWorld(pos, rot, scale)`: place it freely in 3D. `w.place(lift, k, heroPose)`: place it **on a phone** and fly it to the camera (`heroPose`).
- `drawPawTap(c, x, y, age)`: the paw that presses at `age = 0`, with a ripple.
- `typed(text, lt, t0, per)`: how much of a text has "been typed" by now.

### `_kit.ts`: drawn-in-code pieces
- `sticker(img, faceRect, d, ring)`: a pet's round photo as a thick disc (Bubbly coral, Lily amber).
- `Keyboard`: a keyboard whose keys light up as you type (`kb.draw(char)`, `kb.keyCenter(char)` for the paw).
- `banner(text)`: the "MeetMyPets · now" notification.
- `pawTrail(...)`: paw prints that walk across the frame.
- `FACES`: where Bubbly's and Lily's faces are in the Figma exports.

### `_world.ts`: the world per act
A soft gradient backdrop, 14–22 blurred paw/loop shapes floating in depth (they always face the camera, so camera moves show **parallax**), a **shadow-catching floor**, and a key light with soft shadows.

### `_mark.ts`: the logo's two loops
`drawLoop(c, 'L' | 'R', x, y, size, fill, dx, dy, rot)` draws one loop of the official logo, so the two loops can fly in separately and lock together. That's the film's signature move.

## 5.3 The nine shots

Each shot is one bar (3.311 s). Inside, things happen on beats (0, 0.83, 1.66, 2.48 s).

| Shot | File | Idea | Key techniques |
|---|---|---|---|
| **S01 Hello** | [`film-s01.ts`](../../app/src/scenes/film-s01.ts) | the line types itself; on the **drop** the letters squeeze, two loops fly in and lock into the logo; the coral burst; the wordmark writes; we zoom through the loop | pure Canvas 2D, a global zoom transform around the loop's hole |
| **S02 Sign in** | [`film-s02.ts`](../../app/src/scenes/film-s02.ts) | a **giant keyboard**; the email and password type with keys lighting; the Login press → spinner → red burst | `Keyboard`, widgets cut from *Login Page*, `currentKey(lt)` keeps keys, text and paws in sync |
| **S03 Your pet** | [`film-s03.ts`](../../app/src/scenes/film-s03.ts) | the red shrinks into the location button; a pin drops; a **polaroid desk**: polaroid, collar tag stamped "Bubbly", Female, trait blocks raining, a medal filling | objects lying on the floor plane (`rotation.x = -π/2`), a `bounce()` easing, `drawKeyed` per state |
| **S04 Feed** | [`film-s04.ts`](../../app/src/scenes/film-s04.ts) | an **endless scroll wall** decelerates onto Lily's post; it pops out; a **3D heart** (extruded `THREE.Shape`) bursts; 111 → 112; Follow → Following | cheap thumbnail textures for the wall, a modulo wrap for "endless", rail buttons as child widgets |
| **S05 Discover** | [`film-s05.ts`](../../app/src/scenes/film-s05.ts) | a **carousel ring** of cards; Max is flicked away with ✕, Lily gets the ♥ | cards on a circle (`sin`/`cos`), the ring angle as a function of time |
| **S06 Match** | [`film-s06.ts`](../../app/src/scenes/film-s06.ts) | **face to face**: the stickers shoot their loops, which lock; flash, hearts, the match screen, a notification; Chat Now swells red | 2D loops placed at the projected sticker positions, `globalCompositeOperation = 'lighter'` for the glow |
| **S07 Chat** | [`film-s07.ts`](../../app/src/scenes/film-s07.ts) | **conversation in the air**: typing on a keyboard, the bubble arcs to Lily, typing dots, her reply arcs back | arcs = `lerp` + `sin(πk)` for the height |
| **S08 Everything** | [`film-s08.ts`](../../app/src/scenes/film-s08.ts) | one word and one feature per beat on coral; everything swirls into a point | stronger `punch`, per-beat `setWorld` |
| **S09 End** | [`film-s09.ts`](../../app/src/scenes/film-s09.ts) | the loops slam into the woven logo on the final hit; wordmark, tagline, Coming soon; hold | 2D only; the logo SVG as an image |

**Transitions are designed, not default.** Each shot's ending hands over to the next: S02's red burst → S03's red shrinking into a button; S06's red swell → S07's red wipe; S08's white flash → S09.

## 5.4 Tutorial: change something yourself

**A. Change a headline** (2 minutes)
1. Open [`film-s04.ts`](../../app/src/scenes/film-s04.ts) and find `title: 'Like what\nyou love.'`.
2. Change it to `'Stop scrolling.\nLook at Lily.'`.
3. Render a still to check:
   ```bash
   bun scripts/render.ts stills --url http://localhost:5999 --only S04 --t 11.2 --out ../out/wip/try
   ```
4. Open `out/wip/try/f_0011.20.png`.

**B. Add a second like on Lily's card** (15 minutes)
1. In [`film-s05.ts`](../../app/src/scenes/film-s05.ts), add `like2: 2.9` to `T`.
2. In `overlay`, copy the `drawPawTap(... lt - T.like ...)` line and use `T.like2`.
3. Add a matching sound in [`sfx.ts`](../../app/scripts/sfx.ts): `tap(S(5) + 2.9, 0.4);`.
4. Render stills at 16.1 and 16.2 s and check the paw.

**C. Add a whole new shot** (an hour)
1. Copy `film-s09.ts` to `film-s10.ts`. Rename the class, keep `extends Shot`.
2. Add an entry to [`storyboard.launch.json`](../launch-film/storyboard.launch.json) with `id: "S10"`, `start`, `end` and `template`. The music must be long enough, and the times must not overlap another shot (or shorten one).
3. [`timeline.ts`](../../app/src/timeline.ts) automatically picks `scenes/film-s10.ts` for `S10`.
4. Render stills with `--only S10`.

**Debugging tips:**
- **Nothing shows?** Check `w.group.visible`, the camera's `at` point, and whether the widget is behind the camera.
- **Text in the wrong place?** You probably mixed design units and frame pixels.
- **Slow render?** Look for `draw()` called every frame; use `drawKeyed`.

**Next:** [6. Running, rendering, debugging →](06_running_and_debugging.md)
