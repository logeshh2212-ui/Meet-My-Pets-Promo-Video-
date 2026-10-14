# 6. Running, rendering, debugging

## 6.1 One-time setup (already done on your PC)

- **Bun**, **ffmpeg**, **Google Chrome** installed (Windows: winget).
- `cd app` then `bun install`: installs three.js, Vite, Playwright and so on (the `node_modules` folder).
- Fonts in `app/public/fonts/` (Bricolage Grotesque, Nunito Sans, Love Ya Like A Sister).

## 6.2 Everyday commands (run inside `app/`)

| Goal | Command |
|---|---|
| Live preview in the browser | `bunx vite --port 5173`, then open `http://localhost:5173/?t=10` |
| Prepare music + beat grid | `bun scripts/prep-launch.ts` |
| Check the code for type errors | `bunx tsc --noEmit -p tsconfig.json` |
| Still frames of one shot | `bun scripts/render.ts stills --url http://localhost:5999 --only S04 --t 10.5,11.2 --out ../out/wip/s04` |
| Speed test | `bun scripts/render.ts perf --url http://localhost:5999 --only S04 --from 11 --to 11.25` |
| Render one shot as video | `bun scripts/render.ts video --url http://localhost:5999 --only S04 --from 9.933 --to 13.244 --samples auto --max-samples 36 --shutter 0.3 --noaudio --out ../out/parts4/s04.mp4` |
| Make the sound effects + final mix | `bun scripts/sfx.ts --mux ../out/parts4/video_only.mp4 ../out/MeetMyPets_30s_v3.mp4` |

**Why `--url http://localhost:5999`?** Nothing runs on port 5999, so the render script starts its **own private server without live reload**. A live-reloading server can refresh the page in the middle of a render and kill it.

**Preview keys:** space = play/pause, ←/→ = ±1 s, `,` / `.` = ±1 frame, `[` / `]` = previous/next shot. Add `?labels=1` to the address to show the review labels.

## 6.3 The full render, step by step

1. `bun scripts/prep-launch.ts`
2. Render each shot S01…S09 (times from `storyboard.launch.json`), one command per shot. **One at a time**, because all nine together exhaust the integrated GPU's memory. About 2–5 minutes per shot.
3. Join them:
   ```bash
   ffmpeg -f concat -safe 0 -i ../out/parts4/list.txt -c copy ../out/parts4/video_only.mp4
   ```
   `list.txt` contains lines like `file 's01.mp4'`.
4. Mix the music and effects: `bun scripts/sfx.ts --mux ...`
5. **Verify** (never skip this):
   ```bash
   ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames:format=duration -of default=nw=1 ../out/MeetMyPets_30s_v3.mp4
   ```
   You should see 1920 × 1080, 60/1, **1835 frames**, 30.585 s. Then check for black frames with `blackdetect` and for clipping with `volumedetect`: max_volume should be below 0 dB.

## 6.4 War stories: every problem we hit and how we solved it

These are worth more than the code. Each one is a debugging story you can tell in an interview.

**1. "The render takes 1 second per frame."**
- *Symptom:* even a simple 2D shot took 600–1000 ms per frame.
- *Investigation:* a small test script printed which GPU Chrome was using. With the script's flag `--use-angle=metal` it said **SwiftShader** (software rendering on the CPU). Without the flag it said **Intel UHD Graphics**.
- *Cause:* `metal` is a **macOS-only** graphics backend. On Windows Chrome quietly fell back to the CPU.
- *Fix:* choose by OS in [`render.ts`](../../app/scripts/render.ts): `metal` on Mac, `d3d11` on Windows. The result was **130–220 ms per frame**.
- *Lesson:* **measure, then explain the measurement**. A silent fallback is the worst kind of bug.

**2. "Execution context was destroyed."**
- *Cause:* a live-reload dev server reloaded the page during the render.
- *Fix:* always let the render script run its own non-reloading server.

**3. "Target crashed" and "readFinish: fence wait failed."**
- *Cause:* GPU memory. Nine detailed scenes were loaded at once in each of two browser pages: big 4× UI textures, shadow maps, a multisampled target per shot. An integrated GPU shares system RAM and gave up.
- *Fix:* one shared multisampled target, smaller shadow maps, and **render shot by shot** (`--only S0N`). An occasional "fence wait failed" at start-up goes away on a simple retry.
- *Lesson:* design for the **hardware you have**; split big jobs into independent pieces.

**4. "The video won't play."**
- *Cause:* the render was killed when the session ended, which left an MP4 with no index (the "moov atom"). `ffprobe` says *moov atom not found*.
- *Fix:* render in shorter, independent pieces that each finish, and always `ffprobe` the result.

**5. Doubled text in fast moves.**
- *Cause:* `--samples 2` gives 2 exposures of fast objects.
- *Fix:* adaptive motion blur (`--samples auto --max-samples 36`).

**6. 31 leftover servers.**
- *Cause:* on Windows, `bunx vite` starts `node` as a child; killing `bunx` leaves `node` running.
- *Fix:* `taskkill /T /F /PID` kills the whole process tree.

**7. Small but sneaky:**
- **Bun on Windows** didn't truncate a file it overwrote, so the old file's tail remained and the JSON broke. Fix: delete the file before writing.
- **PowerShell:** a one-item array of pairs got *flattened*, so a patch silently did nothing. Lesson: after automated edits, **check the change actually happened** (search for the new text).
- **.NET file APIs** ignore PowerShell's current folder, so relative paths pointed at the wrong place. Use absolute paths.
- **Audio clipping:** the limiter's auto-level raised the peak back to 0 dB (`level=0` fixed it).

## 6.5 A debugging checklist

1. **Reproduce small:** one shot (`--only`), one still (`--t`).
2. **Look at it:** render stills and **view the PNG**; make a contact sheet.
3. **Measure:** the `perf` mode for speed, `ffprobe` for files, `volumedetect` for audio.
4. **Change one thing**, re-run, compare.
5. **Write down the fix** (like this chapter).

**Next:** [7. Turning this into a video generator →](07_video_generator_roadmap.md)
