# 7. Turning this into a video generator

## 7.1 The vision

> **Upload your app screens + a music track + one paragraph about your product → get a polished, on-beat, interactive launch film in 16:9, 9:16 and 1:1.**

Today the film is **hand-coded**: each shot file knows exact rectangles, texts and times. A generator needs those to come from **data** that a program (or an AI) can produce.

## 7.2 What we already have (more than you think)

| Need | Already built | Where |
|---|---|---|
| Render any time `t`, deterministic | ✅ | `engine.ts` |
| A storyboard file driving the edit | ✅ | `storyboard.launch.json` + `timeline.ts` |
| Beat-locked timing | ✅ (measured by hand, applied automatically) | `prep-launch.ts`, `_shot.ts` |
| Cut UI pieces from screenshots into 3D | ✅ | `_ui.ts` `Widget` |
| Reusable visual devices | ✅ | `_kit.ts`, `_world.ts`, `_mark.ts` |
| Sound effects from a cue list | ✅ | `sfx.ts` |
| Headless rendering to MP4 | ✅ | `render.ts` |

## 7.3 What's missing

1. **Templates instead of one-off shots.** "Keyboard world", "polaroid desk", "scroll wall", "carousel", "face to face", "chat in the air", "montage" and "end card" should each become a **template** that takes parameters (which widget rects, which texts, which photos, which beats).
2. **Automatic understanding of the inputs:** where the buttons and fields are, the brand colours, the beats.
3. **Automatic planning:** which templates, in which order, with which copy.
4. **A UI** to preview and tweak, and **cloud rendering**.

## 7.4 Target architecture

```
                ┌───────────── INPUTS ─────────────┐
                │ screens (Figma API / screenshots)│
                │ brand kit (logo, colours, fonts) │
                │ music (upload or library)         │
                │ brief ("pet social app, playful")│
                └───────────────┬──────────────────┘
                                ▼
 ┌──────────────────────── 1. UNDERSTAND ────────────────────────┐
 │ UI parser: Figma node tree → exact rects + texts + types;      │
 │   for plain screenshots: OCR + a vision model to find fields,  │
 │   buttons, cards, avatars                                      │
 │ Music analyser: beat tracking, downbeats, drops, sections      │
 │ Brand extractor: palette, fonts, logo paths                    │
 └──────────────────────────────┬─────────────────────────────────┘
                                ▼
 ┌──────────────────────── 2. PLAN (LLM) ─────────────────────────┐
 │ Input: the brief + the parsed screens + the beat grid +        │
 │        the TEMPLATE CATALOGUE (what each template can show)    │
 │ Output: storyboard JSON (validated against a schema):          │
 │   shots → template, widgets to use, copy, beat positions       │
 └──────────────────────────────┬─────────────────────────────────┘
                                ▼
 ┌──────────────────────── 3. RENDER ─────────────────────────────┐
 │ Template engine (this engine) → per-shot jobs → a GPU worker   │
 │ pool (headless Chrome) → concat → music + SFX mix → MP4s        │
 └──────────────────────────────┬─────────────────────────────────┘
                                ▼
 ┌──────────────────────── 4. REVIEW ─────────────────────────────┐
 │ Fast low-quality preview → the user edits copy/timing/order    │
 │ Automatic QA: a vision model checks contact sheets for text    │
 │ overlap, cut-off elements, unreadable copy, black frames       │
 └─────────────────────────────────────────────────────────────────┘
```

## 7.5 The AI parts in detail

**A. UI understanding.** Best source: the **Figma REST API**. It returns every layer with its exact position, size, text and style, so there's no guessing. For plain screenshots: OCR for the texts, plus a **vision-language model** asked to return JSON like `{type: "text_field", rect: [31, 344, 332, 44], label: "Email"}`. Validate with simple rules (rects inside the frame, no overlaps).

**B. Music understanding.** Use our measurement method as a baseline, plus a dedicated beat-tracking model (open-source beat/downbeat trackers exist) for robustness. Detect **drops** as big jumps in low-band energy after a quiet stretch. Put the drop on the product's "magic moment" (our match).

**C. Planning with an LLM.** The key design: the LLM does **not** write code. It writes **data** that is checked against a **schema**:

```json
{
  "shots": [
    { "template": "keyboard_world", "bars": 1,
      "widgets": { "email": "login.email_field", "password": "login.password_field", "cta": "login.button" },
      "copy": { "kicker": "Sign in", "title": "Settle in.", "accent": "in." } },
    { "template": "face_to_face", "bars": 1, "on_drop": true,
      "pets": ["user_pet", "match_pet"], "copy": { "title": "The vibe is mutual." } }
  ]
}
```

- Give the model a **catalogue** of templates with what each needs and shows.
- Use **structured output** (JSON-schema mode), then **validate** with a schema library (e.g. zod in TypeScript). On failure, send the errors back and retry.
- Rules in the prompt: *only features present in the screens; ≤ 4 words per title; one feature per bar; the match on the drop.*
- **Evaluate**: build a set of ~20 test briefs and check that the JSON is valid, the features are real (no hallucinations), the copy length is right, and humans rate the results.

**D. Copy and voice.** An LLM writes headlines in the brand's tone. Optional text-to-speech voiceover and subtitles for other languages.

**E. Where generative video fits.** AI video models are good for **atmosphere** (b-roll, backgrounds, pet footage) but bad at **exact UI** (they distort text and invent buttons). Keep the product deterministic, and use generative video only for the supporting footage.

## 7.6 Phased roadmap

| Phase | Goal | Main work | Duration (solo) |
|---|---|---|---|
| **0. Refactor** | shots become templates | move rects/texts/times from `film-sNN.ts` into JSON params; one generic file per template | 2–3 weeks |
| **1. CLI generator** | `generate --screens ./figma --music song.mp3 --spec plan.json` | automatic beat grid (generalise `measure_audio.py`), per-shot render + concat + SFX in one command | 2–3 weeks |
| **2. AI planner** | brief → plan.json | LLM + schema + validation + a template catalogue; a test set of briefs | 3–4 weeks |
| **3. UI parsing** | screens → widget library | Figma API import; screenshot fallback with OCR + vision | 3–4 weeks |
| **4. Web app** | upload, preview, edit, download | React UI, low-res live preview (the engine already previews in the browser), job queue | 6–8 weeks |
| **5. Cloud** | many users | GPU workers (headless Chrome with a real GPU), a queue (e.g. Redis-based), storage, billing | ongoing |

## 7.7 Build vs reuse

- **Remotion** (React-based programmatic video, with cloud rendering) is the closest existing tool. Our engine has stronger 3D, motion blur and post effects; Remotion has a big ecosystem and serverless rendering. A generator could keep our engine or port the templates to Remotion. Compare the two before you build infrastructure.
- **Theatre.js** (a keyframe editor for three.js) could give designers a timeline UI over our scenes.

## 7.8 Risks to plan for

- **Licensing:** music, fonts and app-store badges must be licensed for commercial use.
- **Accuracy:** never show features the app doesn't have (we checked against the real code). In a generator, enforce this with the parsed UI.
- **Render cost and time:** about 40 minutes on an integrated GPU for 30 s at top quality; a cloud GPU is much faster. Offer "draft" (`--samples 1`) and "final" quality.
- **GPU memory:** render shot by shot (lesson from chapter 6).

## 7.9 Your first three tasks, if you start tomorrow

1. Move **S05 (carousel)** into a generic `template-carousel.ts` that reads its cards, texts and beats from JSON. Prove it by making a version with different pets.
2. Turn `measure_audio.py` into a function that outputs `timing_basis` for **any** track.
3. Write a script that renders all shots of a storyboard, joins them and mixes the audio in **one command** (what we did by hand in chapter 6).

**Next:** [8. Your career guide →](08_career_guide.md)
