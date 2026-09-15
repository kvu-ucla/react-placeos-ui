# UI polish batch 2 — tour, toasts, modals, camera, participants, splash bookings

**Date:** 2026-09-14
**Status:** Approved
**Lanes:** UI (`react-placeos-ui`), driver (`kvu-ucla/drivers` @ `ucla-dev`), wrapper (`place-labs/zoom-zrc-sdk-wrapper`)

Seven field-feedback items. Items 1–5 and 7A/7C are UI-only. Item 6 spans all
three lanes; item 7B rides the same driver push as item 6.

## 1. Tour controls (`src/components/TourHost.tsx`)

Reactour's stock controls are mouse-sized native `<button>`s (tiny arrows,
8px dots, ~14px close X) — bad touch targets and exposed to the TSW webview's
native-button skinning.

- `TourProvider` gets `components={{ Navigation, Close }}` overrides plus
  `disableDotsNavigation`. Step content, mask, and positioning are untouched.
- **Navigation**: a footer under the step content — enlarged passive dots
  (progress only, not tappable), then a row with **Back** (`Button`
  variant="outline", hidden on the first step) left and **Next**
  (variant="primary") right; ≥56px tall, generous horizontal padding,
  `text-xl`. On the last step Next becomes **Done** and closes the tour
  (`setIsOpen(false)`).
- **Close**: a `div[role=button]` ✕ in the popover top-right, 48×48px minimum
  hit area (non-native div — transparent background is the case the panel
  webview skins).
- State comes from reactour's `useTour()` context (`currentStep`,
  `setCurrentStep`, `steps`, `setIsOpen`).

## 2. Toast width (`src/App.tsx` / `src/index.css`)

The recording-disclaimer toast (61 chars, longest in the app) wraps into 3–4
cramped lines because every toast uses react-toastify's stock 320px width.

- Set `--toastify-toast-width` to ~440px and explicit toast body typography
  (panel-scale text, comfortable line-height) so long messages wrap in ≤2
  lines. One global change — no per-toast special cases, preserving the
  "all toasts through one helper, one look" doctrine.

## 3. Modal frame scroll (`SettingsModal.tsx`, `SupportModal.tsx`)

Both modals put `overflow-y-auto` on the card itself, so long content
(Support → Diagnostics, Settings → Displays) scrolls the whole card including
header and tabs — contradicting the `.modal-frame` comment's stated intent.

- Card: `overflow-hidden flex flex-col` (drop `overflow-y-auto`).
- Header row: fixed, `shrink-0`.
- Body row (sidebar + content): `flex-1 min-h-0`.
- Content pane only: `overflow-y-auto`. Sidebar never scrolls.
- SettingsModal's pass-through wrapper div (line 46) joins the flex chain
  (or is removed).
- Single scroll surface per tab: remove DisplayTab's inner `max-h-96
  overflow-y-auto` container and ParticipantsTab's inner `max-h-[26rem]
  overflow-y-auto` — their comments/constraints predate this fix.

## 4. Display accordions (`src/components/tabbed/DisplayTab.tsx`)

The daisyUI collapse rows are driven by hidden `<input type="radio">` — a
radio can't be unchecked by clicking, so an open accordion can't be closed,
only displaced by opening a sibling.

- Remove the hidden inputs. Open state becomes React state
  (`openDisplay: string | null`); rows render `collapse-open`/`collapse-close`
  by comparison.
- Header becomes a `div[role=button]` (keyboard: Enter/Space). Tap opens the
  row and closes any other; tapping the open row closes it. Exclusive —
  at most one open.

## 5. Camera tab proportions (`src/components/tabbed/CameraTab.tsx`)

The PTZ controller is scaled to 0.5× so the tab fit the modal without
scrolling, while presets get `flex-1` (majority width) as a 3-across grid —
inverted emphasis. Both were workarounds for item 3 and can be unwound.

- Controls dominant: `CONTROLLER_SCALE` 0.5 → ~0.85–1.0 (final value tuned
  on-glass); the scale-transform-in-fixed-box technique stays (pointer math
  unaffected), only the constants change. Controls side takes the majority of
  the row width.
- Presets: single-column stack (`grid-cols-1`, full-width buttons) in a fixed
  ~280px right column. Long lists extend the tab and scroll with the content
  pane (item 3); the "can't grow the card" comment is removed with the
  constraint.

## 6. Per-participant controls (wrapper + driver + UI)

Stack today: kick is fully plumbed (`deny_from_waiting_room` → wrapper
`/participants/expel-multiple` → SDK `ExpelUsers`; expel acts on any
participant). Per-user **video** mute exists through the wrapper
(`POST /video/mute-user` → `MuteUserVideo`) but has no driver method.
Per-user **audio** mute stops at the SDK: `MuteUserAudio` is not bound in
`zrc_bindings.cpp`, has no route, no driver method. Read side is complete
everywhere (`audio_status.is_muted`, `video_status.sending`; wrapper streams
`OnMuteUserAudioNotification`/`OnMuteUserVideoNotification`, which trigger the
driver's coalesced roster refetch).

### 6a. Wrapper (`zoom-zrc-sdk-wrapper`)

- Bind `MuteUserAudio` in `bindings/zrc_bindings.cpp` beside
  `UpdateMyAudioStatus` (`.def("MuteUserAudio", &IMeetingAudioHelper::MuteUserAudio)`).
- Add `POST /audio/mute-user` (query: `user_id: int`, `mute: bool`) in
  `meetings.py`'s audio section, mirroring `meeting_video.py`'s `/mute-user`
  shape and error handling.
- Rebuild bindings, new image, pod roll on nonprod (`zoom-zrc-0`).

### 6b. Driver (`drivers/zoom/zoom_zrc.cr` on `ucla-dev`)

- `mute_participant_audio(user_id : Int32, mute : Bool = true)` →
  `POST /api/rooms/{room}/audio/mute-user`.
- `mute_participant_video(user_id : Int32, mute : Bool = true)` →
  `POST /api/rooms/{room}/video/mute-user`.
- `expel(user_ids : Array(Int32))` → the existing expel-multiple route;
  `deny_from_waiting_room` delegates to it (UI code stops calling a
  waiting-room-named method on in-meeting participants).
- Spec coverage in `zoom_zrc_spec.cr` for the three methods.

### 6c. UI (`src/components/tabbed/ParticipantsTab.tsx`)

- In-meeting rows get three touch-sized controls, right-aligned:
  - **Mic toggle** — icon reflects `audio_status.is_muted`; tap calls
    `mute_participant_audio(id, !muted)`.
  - **Camera toggle** — icon reflects `video_status.sending`; tap calls
    `mute_participant_video(id, sending)`.
  - **Remove** — destructive, two-tap inline confirm (first tap arms
    "Confirm?", second tap calls `expel([id])`; disarms on timeout ~4s or
    roster change).
- No controls on the room's own row (`is_myself`); no Remove on
  `is_host`/`is_cohost` rows.
- Same pending-until-roster-refresh discipline as admit/deny: one busy flag
  per row; command ack ≠ completion; failure clears pending (retryable),
  `useModuleExecute` toasts the error. Mute toggles may re-enable on the
  roster refresh reflecting the new `audio_status`/`video_status`.
- Waiting-room rows are unchanged (Admit/Deny stay as shipped).

## 7. Splash bookings

### 7A. NaN countdown (UI, `src/components/ClassInfoCard.tsx`)

The countdown initializes by parsing an empty string (NaN → "Starts in NaN
minutes") and only recomputes on a 15s interval, so the NaN can sit on screen
for up to 15s. Root cause: the card formats `event_start` into a locale
string, then re-parses that string back into numbers.

- Compute countdown directly from the raw unix `event_start` of the displayed
  meeting; delete the string re-parsing (`getCountdownToTime(timeString)`)
  entirely.
- Recompute immediately when the displayed meeting changes; keep the 15s
  interval for freshness only.
- While no meeting data: render nothing/placeholder, never a computed string
  from empty inputs.

### 7B. Instant meetings leak (driver lane, `booking_converter.cr`)

The converter only skips instant meetings via blank times, but a *started*
instant meeting appears in the ZRC meetings list with real times and becomes
`current_booking`. The wrapper already publishes `is_instant_meeting`.

- Add `is_instant_meeting : Bool?` to `ZRCMeeting` (underscore-normalization
  already maps the camelCase push spelling) and skip entries where true,
  regardless of times. Update readme skip policy + spec fixtures.
- Rides the same `ucla-dev` push as 6b.

### 7C. Upcoming meeting visibility (UI, `ClassInfoCard.tsx` + `SplashScreen.tsx`)

The card and "Start Scheduled Class" bind only to `current_booking`, so an
upcoming meeting is invisible until its start time. The converter contract is
correct (`next_booking` holds it the whole time) — the UI ignores it.

- Display meeting = `currentMeeting ?? nextMeeting`.
- Pre-start: "Starts in N minutes" (from 7A's countdown); in progress:
  "Started at H:MM". The "assume it's tomorrow" / "Class already started"
  string-parse logic is deleted with 7A.
- "Start Scheduled Class" enables for the displayed meeting (join by meeting
  number works pre-start for the host room).
- The secondary "Upcoming …" line shows the meeting after the displayed one
  when the displayed one is `nextMeeting` (i.e., don't repeat the same
  meeting twice on the card).

## Process & verification

- Chunked implementation; every chunk gets an independent Kiro-lane review
  verdict (APPROVE) before push — momentum never waives it.
- UI: `npm run build` + `npm run lint` (established baseline) per chunk.
- Driver: `crystal spec` for `zoom_zrc_spec.cr` + converter spec; build via
  repo harness.
- Wrapper: bindings rebuild + service tests; image builds in CI; nonprod pod
  roll, then `get_health` + a live per-user audio mute against a test meeting.
- On-glass (folds into the consolidated on-glass checklist): tour walk-through
  (targets, Done, close), disclaimer toast width, Diagnostics/Displays scroll
  behavior (chrome fixed, content scrolls), accordion toggle/exclusivity,
  camera controls vs presets proportions, participant mic/cam/remove with a
  second Zoom client, splash card pre-start countdown (no NaN), instant
  meeting absent from splash, upcoming meeting visible pre-start.

## Out of scope

- Merging tour content changes (duplicate mic/camera step text) — explicitly
  deferred by owner.
- Toast close-behavior or per-toast styling changes.
- `meeting_will_stop` banner, ring buffer, other handoff backburner items.
- Prod wrapper rollout (nonprod pod roll only; `main` image awaits its
  natural roll per handoff).
