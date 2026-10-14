# 4. Music and timing

A film feels "professional" largely because things happen **on the music**. This chapter explains how we found *where* the beats are, and how the code uses that.

## 4.1 Music words, simply

| Word | Meaning | In our track |
|---|---|---|
| **Beat** | the pulse you tap your foot to | every **0.828 s** |
| **BPM** | beats per minute | 60 / 0.828 ≈ **72.5** (a "half-time" feel; double it and it's ~145) |
| **Bar** | a group of beats (here 4) | **3.311 s** |
| **Downbeat** | the first beat of a bar: the strongest | where our cuts happen |
| **Drop** | the moment the full band slams back in after a quiet part | **1.656 s** into our 30 s cut |
| **Breakdown** | a quiet section before the drop | the first 1.6 s of the cut |

## 4.2 Sound as numbers

A digital audio file is a long list of numbers (**samples**), 48,000 per second (48 kHz). Each number is how far the speaker cone is pushed at that instant.

```
amplitude
  1 ┤        ╭╮      ╭╮
  0 ┼──╮╭╮╭──╯╰──╮╭──╯╰───    ← 48,000 of these points every second
 -1 ┤  ╰╯╰╯      ╰╯
```

Useful measurements:
- **RMS loudness**: take a short window (10 ms), square the samples, average, square-root. That's the "energy" of the window.
- **Decibels (dB)**: a log scale for loudness. Every −6 dB is half the amplitude. 0 dB is the maximum; −40 dB is quiet.
- **Frequency bands**: low (bass, kick drum < 150 Hz), mid (voices, synths), high (hi-hats > 6 kHz). We split them with **filters** (ffmpeg's `lowpass` / `highpass`).

## 4.3 How we measured the beat grid (no AI needed)

Script: [`docs/launch-film/tools/measure_audio.py`](../launch-film/tools/measure_audio.py) (pure Python + ffmpeg, no libraries).

1. **Decode** the MP3 to raw samples with ffmpeg (mono, 12 kHz is plenty).
2. **Envelopes:** RMS loudness every 10 ms, for the full mix and for the low/mid/high bands.
3. **Onsets** (when something *starts*): where the loudness jumps up. That's the positive difference between neighbouring windows ("spectral flux", simplified).
4. **Tempo:** an **autocorrelation** of the onset curve. Slide the curve against itself; it matches best when shifted by one beat. That first guess said ~97 BPM.
5. **The surprise:** 97 was **wrong**. It matched a dotted rhythm (3 sixteenth-notes). The real clue was the **bass**: just before every bar, the bass stops for ~0.33 s and then hits on the downbeat. Listing those bass gaps gave a perfectly regular grid:

```
bass returns at: 2.51  5.82  9.13  12.46  15.76  19.07 …  72.04
differences:        3.31  3.31  3.33   3.30   3.31 …          → bar = 3.311 s
```

6. **Sections** came from loudness per bar: the breakdown (bass at −79 dB) and the drop at 47.21 s, where the full band returns on beat 3 of a bar.

**Lesson for an AI engineer:** the first algorithm's answer (97 BPM) looked confident and was wrong. We found it by **checking against a second, independent signal** (the bass gaps). Always cross-check model or algorithm outputs.

## 4.4 How P(doom) did it: the AI audio pipeline

P(doom) had to sync **words**, not just beats. So it used real AI models (files in [`analysis/`](../../analysis/)):

```
song.mp3
   │
   ├─► Demucs (neural source separation) ─► vocals / drums / bass / other stems
   │
   ├─► librosa (signal processing)       ─► beats, downbeats, sections, envelopes   (analyze.py)
   │
   └─► vocal stem
         ├─► CTC forced alignment  (ctc_emissions.py, ctcalign.py, pron.py)
         │     an acoustic model gives, every 20 ms, the probability of each letter;
         │     we KNOW the lyrics, so we find the best path of the known words through those probabilities
         │
         ├─► Whisper (mlx-whisper)  (whisper_run.py)
         │     speech recognition with word timestamps, used as an independent cross-check
         │
         └─► align.py: combine both, refine with vocal features (pitch, onsets) → data/lyrics.json
```

The new words:
- **Source separation (Demucs):** a neural network that splits a mixed song into instruments. Like un-baking a cake into flour, eggs and sugar. Word timing is much easier on the vocals alone.
- **Whisper:** OpenAI's speech-recognition model. It can output a time for each word.
- **CTC (Connectionist Temporal Classification) forced alignment:** "forced" because the text is already known. The model doesn't have to *guess the words*, only *when* each is sung. More accurate than free recognition for singing.
- **Two independent methods + arbitration:** the same cross-checking lesson again.

## 4.5 From measurements to the film

[`scripts/prep-launch.ts`](../../app/scripts/prep-launch.ts) does two things:
1. **Cuts the music**: `ffmpeg -ss 45.553 -t 30.585` plus a 30 ms fade-in (cutting mid-song can click).
2. **Writes the beat grid**: `data/audio.json` gets every beat and downbeat in **film time** (0 = the cut point).

The engine loads that grid, so every frame knows `f.beat` and `f.beatPhase`. Our code uses timing in three ways:

```ts
// 1. Constants: every shot is one bar; things happen on beats inside it
export const BEAT = 0.82775, BAR = 4 * BEAT;          // _shot.ts
const T = { like: 2.52 };                              // ≈ beat 3 of the bar (3 × 0.828 = 2.48)

// 2. The beat punch: a small zoom that decays after every beat
const zoom = 1 + 0.022 * Math.exp(-f.beatPhase * 9);   // _shot.ts → post.zoom

// 3. Sound effects at the same times as the picture
tap(S(5) + 2.52, 0.4);                                 // sfx.ts: the like tap in shot 5
```

The storyboard is generated by a script that computes every time from the grid (`D(n) = n × BAR`), so shots always start exactly on downbeats and the durations always add up to exactly **30.585 s = 1835 frames**.

## 4.6 Exercises

1. Open `data/audio.json`. How many beats are in it? Do the downbeats step by 3.311?
2. In [`film-s05.ts`](../../app/src/scenes/film-s05.ts), change `T.like` from 2.52 to 1.66 (beat 2). What else must change so the sound still matches? (Hint: `sfx.ts`.)
3. Why did we cut the music at 45.553 s and not at 45.0 s?

<details><summary>Answers</summary>

1. 37 beats; yes (0, 3.311, 6.622 …).
2. The like sound cue in `sfx.ts` (`tap(S(5) + 2.52 …)`, the thud at 2.56) and anything timed after the like (the stamp, the rush) in the scene.
3. 45.553 is a measured **downbeat**: starting there keeps the whole grid aligned to t = 0, and the drop lands musically at 1.656 s.
</details>

**Next:** [5. The shots, one by one →](05_shots_walkthrough.md)
