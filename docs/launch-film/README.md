# MeetMyPets — App Launch Film · production package

16:9 · 1920×1080 (YouTube) · 60 fps · 76.138 s (4568 frames) · soundtrack `audio/testing.mp3`

| # | Deliverable | File |
|---|---|---|
| 1 | Creative concept | [01_concept_and_audio.md](01_concept_and_audio.md) |
| 2 | Audio analysis + timing map | [01_concept_and_audio.md](01_concept_and_audio.md) · [audio_map.json](audio_map.json) · [tools/measure_audio.py](tools/measure_audio.py) |
| 3 | Timecoded storyboard (21 shots) | [02_storyboard.md](02_storyboard.md) |
| 4 | Machine-readable storyboard | [storyboard.launch.json](storyboard.launch.json) (validated; shots add up to 76.138 s / 4568 frames) |
| 5 | Image-generation prompts (11 images) | [03_image_prompts.md](03_image_prompts.md) |
| — | Figma screen analysis | [SCREEN_ANALYSIS.md](SCREEN_ANALYSIS.md) |
| 6–7 | Workflow + final checklist | [04_workflow_and_checklist.md](04_workflow_and_checklist.md) |

## What was inspected

- **Audio:** `audio/testing.mp3`, measured directly (see deliverable 2).
- **App source of truth:** the MeetMyPets Flutter app in `Downloads/MMP/MeetMyPets/frontend/mobile`, covering screens, strings, icons, `app_colors.dart` and `app_typography.dart`.
- **Designs:** the four mock-up screens in `app/public/assets/screen_*.png`, the PlayStore posts 01/02/03/05, and the app icon `meet_my_pets.png`.
- **Earlier boards:** `app/public/plates/board1|2`, used as **mood only**. Their UI is AI-drawn: for example, "The vibe is mutual." with two avatar circles is *not* the real match screen.
- **Not available:**
  - no Figma link was provided
  - no reference launch videos were found in the project

## Feature audit

| Feature | Status | Evidence |
|---|---|---|
| Discover: swipe deck, like / pass, info, pet switcher, distance, filters, notifications | ✅ Confirmed | Design + `features/discover/*` |
| Super like, undo | ✅ In code, not featured | `super_like_button.dart`, `swipe_deck_notifier.dart` |
| Create pet profile: photo, name, species, gender, date of birth, completion | ✅ Confirmed | Design + `create_pet_profile_screen.dart` |
| ↳ breed, size, blood group, personality, "Tell their story" | ✅ Confirmed in code only | **The current app copy differs from the mock-up** (Q4) |
| Pet profile page: gallery, Follow, verification / vaccination / health badges | ✅ In code, **no screenshot** | `pet_social_profile_screen.dart` |
| Feed: photo + video posts, like, comment, share, follow, mute | ✅ Confirmed | Design + `features/feed/*` |
| Create post: photos / video, caption, location | ✅ In code, not featured | `create_post_screen.dart` |
| Match overlay: "It's a Match!", "{pet} liked you back.", Chat Now, Continue Discovering | ✅ Confirmed | Design + `match_celebration_overlay.dart` |
| Chat: list, conversation, bubbles, typing indicator, online / last seen, edit / unsend | ✅ In code, **no screenshot** | `features/chat/*` |
| Certificates, verification, share profile, block / report | ✅ In code, not featured | Too much for 76 s |
| Health tracking, reminders, booking, maps | ❌ Not in the designs → **not shown** | — |

## Open questions — answer these before production (defaults in **bold**)

1. **Q1 Brand mark: ANSWERED.** The **double-loop** is the logo. The enhanced files are in `app/public/assets/brand/`:
   - `mmp_mark.svg`: official geometry and gradient
   - `mmp_mark_film.svg`: woven over/under version for the film
   - `mmp_mark_white.svg` and `mmp_mark_ink.svg`: single-colour versions
   - 4096 px PNGs of each
2. **Q2 Screens: ANSWERED.** Figma exports are in `app/public/assets/figma/` and analysed in [SCREEN_ANALYSIS.md](SCREEN_ANALYSIS.md). Still wanted: the real "It's a Match!" page, and the splash wordmark font (or an SVG).
3. **Q3 Story consistency: RESOLVED WITHOUT FIGMA WORK.** The screens are rebuilt as live layers with consistent sample data (Shiro + Tom).
4. **Q4 Which Create screen: ANSWERED.** The current version ("Build Your Pet's Spotlight!"), which matches the app code.
5. **Q5 End card: ANSWERED.** One "Coming soon" pill.
6. **Q6 Shiro's coat: ANSWERED.** Cream Shiba with a red collar.
7. **Q7 References: ANSWERED.** LangEase ad, used for principles only; see [REFERENCE_NOTES.md](REFERENCE_NOTES.md).

## Asset status

- Existing plates in `app/public/assets/shot*.jpg` are 572–2864 px and many are square or landscape. They are fine as **temporary stand-ins**. Regenerate them at 2160×3840 with `03_image_prompts.md`.
- The four `screen_*.png` files are 660×1433 crops from the PlayStore mock-ups. They have artefacts: a ribbon over the Feed nav bar, a cut-off Save button, a misaligned header, and a swipe state baked into Discover. Replace them with clean, layered 4x exports.
