# Figma exports: analysis (app/public/assets/figma, 21 files)

All exports are 393 × 852 iPhone 14/15 Pro frames, at 1x, 2x or 4x. `Create Pet Profile Page 02 (1).png` is an exact duplicate of `Create Pet Profile Page 02.png`.

## What each file is, and where it's used
| File | What it actually shows | Film shot |
|---|---|---|
| `iPhone 14 & 15 Pro - 2@4x.png` | **Splash**: dog-and-cat icon + serif "MeetMyPets" on an orange→red gradient | S04 (the phone wakes on it) |
| `Create Pet Profile Page 01 (1).png` (4x) | **Create Pet Profile, current version**: "Build Your Pet's Spotlight!", "Show us that cute face!", "A little about them" (Name, species, Paw-Type, Date of Birth), 30% capsule, "Create Their Profile" | S05–S07 |
| `Create Pet Profile Page 02.png` (1x) | Its scroll: estimate-birthday toggle, "A little more about them" (colour swatches, weight, size, mixed breed, open to breeding) | S06 |
| `Create Pet Profile Page 03.png` (4x) | Its scroll: "Get to know them" (What are they like?, Tell their story) | S06 |
| `Create Pet Profile Page 01.png`, `… Page 11.png` | **Older version** ("Create Pet Profile", "Basic Information", "Save Pet Profile") | Not used (the app code matches the newer version) |
| `Manage Pet Profile (1).png` (1x) | **Traits picker**: 12 chips, "2 of 12 selected", Save Traits | S06 |
| `Discover page.png` (4x) | **Discover**: pet switcher, card stack, info / pass / like / undo, glass nav | S08–S09, S13–S14 |
| `Discover page (1).png` (2x) | Actually a **Feed** scroll: a post with the **"Matched" tag + orange "Following"** | S12, S20 |
| `Pet Info page.png` (2x) + `(1)` | **Another pet's profile**: Follow, distance, Likes / Followers / Following / Matches, About, Pet Details (incl. Blood Group, Breeding), Gallery, Report / Block | S10 |
| `Feed page.png` (4x) | **Feed**: active-pet switcher, Liked pill, Follow, like / comment / share rail, "Suggested" post | S11–S13 |
| `Manage Pet Profile.png` (1x) | **Your own pet's profile**: counters, View / Edit Profile, About, Pet Details, Traits, Activities | S20 |
| `Messaging page (1).png` (4x) + clean 1x | **Chat**: patterned background, white/orange bubbles with read ticks, Edit / Unsend menu, "Message…" + send | S16–S18 |
| `User Chat page.png` (2x) | **Chats list** | (spare) |
| `Login Page`, `SignUp Page`, `Create Your Profile Page 01/02` | Onboarding: login, sign-up, owner profile, location permission | Not in the film (keeps the 76 s on the core features) |

## Features the film shows (all confirmed by these designs + the app code)
1. **Create Pet Profile**, including looks and **Traits** (new from these designs: chips are great for motion)
2. **Discover** (swipe like / pass, info)
3. **Pet profile** (Follow, stats, details, gallery)
4. **Feed** (like, follow → "Following", the "Matched" tag)
5. **It's a Match!**: ⚠ not in these exports. Only the old mock-up exists, but every string is in the app code, so it will be rebuilt from those
6. **Chat** (bubbles, typing, read ticks)

Dropped: verification / vaccination badges (not in any design), intent filter (not in any design), groups / events / business (not in the app code or the designs).

## Problems found, all fixed in the film's rebuild (no Figma work needed)
The plan is to **rebuild these screens as live layers**, pixel-matched to the exports. That gives the 3D depth layers without you exporting every layer, and lets the sample data be consistent:
- The sample data doesn't match the photos: "Ruby · **Maine Coon**" on a dog photo, "Lily · **Husky**" on an Australian Shepherd, "Bubbly · **25 yrs**", and the same golden-retriever photo for Bubbly, Ruby and Ammu. → In the film: **Shiro** (cream Shiba, your pet) and **Tom** (golden retriever, the match), with consistent names, breeds, ages and photos everywhere.
- The chat has a design annotation **"Error message"** under the input, plus the repeated "What are you doing". → Removed; the messages are set per shot S17.
- The chat header "Last seen 3d ago" → "Online" right after the match (that string exists in the code).

## Resolved
- **Match screen: REBUILT.** `app/public/assets/figma_rebuilt/match@4x.png` (1572×3408), with the editable source `match.html`. It uses the real Discover export underneath (dimmed + blurred), the official double-loop, the app's exact strings and the app's pill-button style.
- **Wordmark font: DECIDED.** "MeetMyPets." in the film (S03, S21) is set in **Love Ya Like A Sister** (your choice). It is a different style from the serif on the splash, and that's intentional.
