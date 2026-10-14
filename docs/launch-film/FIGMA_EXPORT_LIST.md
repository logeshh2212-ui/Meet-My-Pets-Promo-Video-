# Figma export list for the launch film

Put every export in **`app/public/assets/figma/`** using the file names below. Tick each box as you go.

## Export settings
- **Screens and layers:** PNG at **4x**. Turn "Include background" **off** for layers (transparent background).
- **Icons and logos:** **SVG**.
- To export a single layer: select it in Figma → right panel → **Export** → `+` → choose 4x PNG (or SVG) → **Export**.
- Use the **current app design**, the one that matches the real app, not the old PlayStore mock-ups.

## Step 0: change the content first (so the story is consistent)
Do this in a **copy** of the pages, so the real designs stay untouched.
- [ ] Shiro's avatar → use the Shiro photo (P07 from `03_image_prompts.md`; any Shiba photo is fine for now, we'll swap it later)
- [ ] Discover card 3 and the match screen → **Tom**, Golden Retriever, with Tom's photo (P08)
- [ ] Feed post → **Tom's** post, with Tom's photo (P09)
- [ ] Fix the typo "Shibha Inu"

## A. Full screens: flat 4x PNG (most important)
| ✔ | File name | What it shows | Used in |
|---|---|---|---|
| ☐ | `01_splash.png` | Splash / launch screen (if there is one) | S04 |
| ☐ | `02_create_empty.png` | Create pet profile, empty | S05 |
| ☐ | `03_create_filled.png` | Same screen filled: Shiro's photo, "Shiro", Dog, Male, a birthday | S06 |
| ☐ | `04_create_saved.png` | What appears after tapping Save (success screen, toast or 100% state) | S07 |
| ☐ | `05_discover.png` | Discover with the card stack, **no swipe in progress** | S08 |
| ☐ | `06_discover_like.png` | A card being swiped right (with the like stamp) | S09 |
| ☐ | `07_pet_profile_tom.png` | Tom's pet profile page, as **one tall frame** covering the full scroll | S10 |
| ☐ | `08_feed.png` | Feed with Tom's post at the top | S11 |
| ☐ | `09_feed_liked_following.png` | Same post after Like + Follow ("Following") | S12 |
| ☐ | `10_match.png` | "It's a Match!" overlay with Tom | S15 |
| ☐ | `11_chat_new.png` | Chat with Tom right after matching ("You matched — say hello!") | S16 |
| ☐ | `12_chat_messages.png` | Same chat with 2–3 messages + typing dots (**write the messages you want shown**) | S17–S18 |
| ☐ | `13_chats_list.png` | Chats list (optional) | S20 |

## B. Separate layers: 4x PNG, transparent
These let parts of the screen float in 3D. If one is too fiddly, skip it and tell me which.

**Create profile**
- [ ] `create_header.png`: the orange top block
- [ ] `create_photo_empty.png`, `create_photo_filled.png`: the Add Photo circle
- [ ] `create_field_name_empty / _focus / _filled.png` (the same 3 states for Species and Date of Birth, if easy)
- [ ] `create_gender_male_on.png`, `create_gender_female_on.png`
- [ ] `create_progress.png`: the completion ring/capsule (every state you have)
- [ ] `create_save_btn.png`, `create_save_btn_pressed.png`

**Discover**
- [ ] `discover_base.png`: the screen with the card area **empty**
- [ ] `card_1.png`, `card_2.png`, `card_3_tom.png`: each card on its own, with its name/breed chips
- [ ] `card_like_stamp.png`, plus the pass stamp if one exists
- [ ] `btn_info.png`, `btn_pass.png`, `btn_like.png`, `btn_undo.png` (and pressed versions if they exist)
- [ ] `pet_switcher.png`: the avatar row (Shiro, Buddy, Add pet)

**Feed**
- [ ] `post_photo_tom.png`: the photo only
- [ ] `post_overlay.png`: only the controls on top of the photo (Liked pill, Follow, like/comment/share rail, author row, caption)
- [ ] `btn_follow.png`, `btn_following.png`, `icon_like_filled.svg`

**Match**
- [ ] `match_text.png` ("It's a Match!" + "Tom liked you back."), `match_btn_chat.png`, `match_btn_continue.png`

**Chat**
- [ ] `chat_header.png`, `chat_input.png`, `bubble_sent_1.png`, `bubble_received_1.png` (one file per bubble), `typing_dots.png`

**Shared**
- [ ] `navbar_discover_active.png`, `navbar_feed_active.png`, `navbar_chat_active.png`

## C. Brand and icons: SVG
- [ ] `logo_wordmark.svg`: the "MeetMyPets" wordmark, if it exists in Figma (or tell me which font and weight it uses)
- [ ] `logo_lockup.svg`: logo + wordmark together, if there is a lockup
- [ ] `app_icon.svg`
- [ ] Nav icons, plus heart / comment / share / info icons (only if they differ from the app's `assets/icons`)

## D. Quick answers (just type them in chat)
- [ ] The phone frame size in Figma (e.g. 393 × 852)
- [ ] Fonts used (the app code says Bricolage Grotesque + Nunito Sans; is that right?)
- [ ] Keep "Coming soon on iOS / Android" on the end card?
- [ ] Shiro's coat: cream or red?
