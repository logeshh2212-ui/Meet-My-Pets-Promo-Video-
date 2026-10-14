# 1. Creative concept

**One line:** *A pet's whole social life, lived inside one phone.* We follow one dog, **Shiro**, from the doorstep into MeetMyPets. Shiro gets a profile and discovers **Tom**. Shiro follows Tom's posts, likes Tom, and the like comes back. The two owners chat, and the dogs end up playing in the park.

The viewer never watches a slideshow of screens. Each feature hands the story to the next through an object that moves between them:

- the profile photo becomes the avatar in Discover
- Tom's card becomes his profile
- his gallery photo becomes his Feed post
- the double-loop tab becomes the match symbol
- the Chat Now button becomes the conversation
- a chat bubble becomes a window onto the park

**Signature visual language (v2): built only from MeetMyPets itself**

| Device | What it is | Why it's ours |
|---|---|---|
| **The Two Loops** | Shiro's coral line and Tom's amber line draw through the whole film. They do the transitions, cross at the Follow, touch at the like, interlock on the drop and lock into the logo at the end | The logo *is* two loops, so the film tells the logo's story: two pets' paths becoming one |
| **Paw-tap** | Every tap is a soft paw-pad that squashes and ripples | From the app's own Paw icon; no cursor hands |
| **Tag type** | The key word of each headline hangs in a pill like a collar tag, swings and settles | Pet-world object, shaped like the app's own info chips |
| **Swipe cuts** | Act changes are the frame being swiped like a Discover card (right + heart stamp) or scrolled like the Feed (up) | The app's real gestures become the film's editing |
| **Ring → loop** | The profile completion ring closes at 100% and stretches into Shiro's loop | Real UI turns into the brand motif |

**Emotional progression**

| Act | Time | Feeling | What the viewer learns |
|---|---|---|---|
| 1 Brand intro | 0.00–12.44 | Warmth, curiosity | Every pet has a world bigger than home; this is MeetMyPets |
| 2 Create | 12.44–22.38 | Pride | You give your pet a profile: photo, name, species, gender, birthday |
| 3 Discover | 22.38–32.31 | Playful exploration | Swipe to like or pass, open a pet's profile |
| 4 Feed | 32.31–42.24 | Delight | Pets post moments; you like and follow |
| 5 Match | 42.24–52.18 | Held breath, then release | When the like goes both ways, it's a match |
| 6 Chat | 52.18–62.11 | Connection | A match opens a conversation |
| 7 Payoff | 62.11–76.14 | Joy, belonging | It ends in a real friendship, and the brand is remembered |

**Why it works as a launch ad**
- **The product is on screen about 75% of the time.** Real UI appears from 9.1 s to 72 s, except the bridge and payoff moments.
- **The film is one user journey,** in the order a real user moves through the app. Viewers learn the whole flow without being told it.
- **The biggest musical moment carries the most important feature.** The match lands exactly on the drop at 47.21 s. The quiet breakdown before it carries the "like", so tension and release come from the track itself.
- **Warmth bookends the tech.** It opens on a real pet and closes on real pets, with a polished product world in between.

---

# 2. Audio analysis and timing map

## 2a. Measured (read from `audio/testing.mp3`)

| Item | Value |
|---|---|
| Duration | **76.138 s** (ffprobe 76.13825) → **4568 frames at 60 fps** |
| Format | MP3, 48 kHz, stereo, 128 kb/s |
| Silent head | 0.00–0.67 s |
| First full downbeat | **2.510 s** |
| Bar length / beat | **3.311 s / 0.828 s** → 72.5 BPM half-time feel (≈145 BPM double-time) |
| Bar pattern | Beats 1–3 loud; **beat 4 has a ~0.33 s bass gap**; next downbeat hits |
| Breakdown | 42.24–47.21: no bass, about 15 dB quieter, soft melodic hits at 42.66 / 43.49 / 44.32 / 45.14 / 45.97 |
| **Drop** | **47.21 s** (beat 3 of the bar, full band returns) |
| Final hit | **72.04 s** |
| Music fades | under −45 dB at 74.26, under −60 dB at 74.84, silence to 76.14 |

> ⚠️ The older `data/audio.json` (97 BPM, 76.082 s) does **not** match this file. 97 BPM is the dotted rhythm, not the beat. Use `audio_map.json` instead.

**Downbeats (cut points):** 2.510 · 5.821 · 9.132 · 12.443 · 15.754 · 19.065 · 22.376 · 25.687 · 28.998 · 32.309 · 35.620 · 38.931 · 42.242 · 45.553 · 48.864 · 52.175 · 55.486 · 58.797 · 62.108 · 65.419 · 68.730 · 72.041

**Energy map** (average loudness per bar in dB, measured; higher = louder):

| Bar starts | 0.67* | 2.51 | 5.82 | 9.13 | 12.44 | 15.75 | 19.07 | 22.38 | 25.69 | 29.00 | 32.31 | 35.62 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Full mix | −41.0 | −26.5 | −25.1 | −25.6 | −24.6 | −25.6 | −24.5 | −25.9 | −24.3 | −25.5 | −24.9 | −25.8 |
| Hi-hats (>6 kHz) | −76.5 | −67.0 | −61.9 | −62.3 | **−58.2** | −62.0 | **−57.7** | −61.7 | **−57.5** | −59.7 | **−56.7** | −60.0 |

| Bar starts | 38.93 | 42.24 | 45.55 | 48.86 | 52.18 | 55.49 | 58.80 | 62.11 | 65.42 | 68.73 | 72.04 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Full mix | −28.4 | **−41.1** | −33.0 | −25.8 | −24.6 | −25.4 | −24.2 | −25.7 | −24.8 | −26.0 | −35.8 |
| Bass (<150 Hz) | −41.1 | **−79.4** | −48.5 | −33.2 | −31.9 | −33.0 | −32.0 | −33.1 | −31.7 | −33.1 | −38.5 |
| Hi-hats (>6 kHz) | −57.0 | −60.6 | −56.9 | −59.8 | **−55.8** | −57.4 | **−54.7** | −56.6 | −61.5 | −66.7 | −82.2 |

\* partial pickup bar. Bold = the notable values: brighter hats on alternate bars in section B, the empty breakdown, and the peak brightness after the drop.

## 2b. Recommended placement (creative choices built on the measurements)

| Moment | Time | Why there |
|---|---|---|
| Hero pet appears | 0.67 | First sound |
| Brand reveal | 5.821 | Second downbeat; the ribbon wipe uses the 5.49 bass gap |
| Enter the app | 12.443 | Section B starts (brighter hats = "new world") |
| Discover | 22.376 | Phrase boundary (3 bars after the app entry) |
| Feed | 32.309 | Phrase boundary |
| Return to Discover / slow-down | ~40.6 | Bass drops out (measured) |
| **The like** | 46.381 | Beat 2 of the build bar, as the riser starts |
| **Mutual match** | **47.208** | The drop |
| Chat Now tap | 52.175 | Brightest downbeat after the drop |
| Real-life payoff | 62.108 | Downbeat, still in peak energy |
| Product composition | 65.419 | Outro starts thinning: a calmer, wide shot |
| **End card** | **72.041** | Final hit; hold the brand through the decay to 76.138 |

**Rules used everywhere:**
- Hard cuts land **on downbeats**.
- Transitions (whips, morphs, portals) live in the **0.33 s bass gap** before a downbeat.
- Small UI actions (taps, chips, text lines) land on **beats 2, 3 and 4**, so something moves on every beat even between big accents.
