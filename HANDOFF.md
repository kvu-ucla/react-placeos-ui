# Session handoff / resume pointer — 2026-09-02 (rev 3)

Supersedes the 2026-09-01 rev-2 handoff (see git history of this file). Start a fresh session by reading THIS file first. Plan-of-record: https://claude.ai/code/artifact/abc596ff-85e1-43e7-be3a-83b4c95b206e (updated same pass). Hardware/webview institutional knowledge lives in memory (`crestron-webview-quirks`) — the short version is in "Panel webview facts" below because it is load-bearing for ALL UI work on these panels.

## Landing (all verified unless marked pending)

`feat/ui-polish` @ `c3391d8` (pushed; **41 commits over `development`**, contains `feat/zoom-zrc-migration`). Everything below chunk-D was covered in rev 2; new since then, all implemented via the Herdr review lane (Claude implementer + independent reviewer — Codex until its spend cap, then Kiro `gpt-5.6-terra`) with verdicts archived in `review-verdicts/` (gitignored):

- **Chunks E/F — loading states** (`67fc7f4`..`cbede85`): modal backdrop-color entrance (no see-through flash); connection tri-state (connecting/online/offline, 10s grace) with OfflineModal gated on real offline only; unified `RoomStatusModal` ("Connecting to room systems…"/"Starting up the room…"/"Shutting down the room…") with blurred scrim, animated enter/exit, hydration-gated dismissal (name+features+bookings, 8s bookings waiver, 15s cap); power transitions gated on display-power readiness + 4s dwell + 60s abandonment (seq-token guarded — three reviewer-caught races fixed). Verified on-glass.
- **Chunk G — Settings/interaction** (`d2fb1fe`..`f67b81c`): Status/Camera tabs restyled to sibling card idiom; camera controls fit via scale(0.5) box (joystick dead zone converted to DEADZONE_RATIO after a reviewer-caught doubling); session-controls section never scrolls (exclusive radio accordions, scroll machinery deleted). Verified on-glass.
- **Prompt payload fidelity** (`aa072b7`, `7e6f382`, `15e295a`): reminders render Zoom's real title/message/button labels (live-confirmed payload), shape-based routing with strict discriminators + specialized-key exclusions, redundant disclaimer toast suppressed. Live recording-disclaimer verified on-glass.
- **Hardware (Crestron) defect hunt** (`d3701e7`..`c3391d8`): on-glass diagnostics in SupportModal (build SHA, computed styles, feature probes, inline-style tests, CSSOM dump) drove three proven root causes — see facts below. All three defects confirmed FIXED on the panel by the user.

## Panel webview facts (Crestron TSW, Android 12, Chromium 118 `wv`) — PROVEN on-glass

1. **Skins native `<button>` widgets below the author cascade**: computed background stays ButtonFace `rgb(239,239,239)` against plain un-layered `!important` transparent; forced-colors media reports false. FIX: render as `div[role=button]` (Button ghost variant + modal X buttons do this now).
2. **Drops `box-shadow` at engine level** (computed `none` for a matching plain rule). FIX: runtime-detected gradient underlay on the header (desktop keeps true shadow, pixel-identical).
3. No relative-color syntax (`oklch(from …)`, expected at 118), no unprefixed `mask-image` (expected, 120+). `@property`/`@layer`/`:has`/`color-mix` all present.
4. The SupportModal diagnostics block is the debugging channel for this hardware — keep it.

## Owner decisions / open items (each with what it unblocks)

1. **Sharing key**: paste `ZoomZRC_1 → room_status` from the debug console — unblocks restoring the wireless sharing key in the join accordion (UI bind if present in room_status; else a ZRC driver/microservice addition).
2. **Driver fixes still UNCOMMITTED** in `~/Documents/drivers` (`ucla-dev`): participant-refresh coalescing + event-owned mic/camera state (spec-verified) — unblocks single-fetch rosters and honest mute loading on the panel.
3. **Backend booking_converter repoint** (`ZoomCSAPI_1:BookingsListResult` → `ZoomZRC_1:meetings`) — unblocks bookings end-to-end (README documents it).
4. **Real AV support phone** — now a backstage setting, not code (`src/config.ts` deleted). Add to the system settings YAML (`title`/`content` are required or the whole `help` parse fails, wiping all help pages):
   ```yaml
   help:
     support:
       title: "AV Support"
       content: ""
       phone: "+1310XXXXXXX"
       phone_display: "(310) XXX-XXXX"
   ```
   UI binds `System.help` → `help.support.phone`/`.phone_display` (spec + plan in `docs/superpowers/`). Extraction unit-verified; live verification pending the real number.
5. **Merge**: PR `feat/ui-polish` → `development` (contains the migration; `development` also needs the CI workflow commits `ffa11a4`/`29ca490`).

## Where things live

| Thing | Location |
| --- | --- |
| Current branch (contains everything) | `origin/feat/ui-polish` @ `c3391d8` |
| CI build for the panel | `origin/build/feat_ui-polish` (nonprod `control-av-dev` serves it) |
| Review verdicts + impl reports (both pushes, all rounds) | `review-verdicts/` (gitignored) |
| On-glass diagnostics | SupportModal bottom block (build SHA, probes) |
| Loading-state machinery | `src/components/RoomStatusModal.tsx`, `src/hooks/useControlState.ts` (pendingPower), `MainView.tsx` (readiness/pacing) |
| Prompt UI + payload routing | `src/components/prompts/` |
| Non-native button pattern | `src/components/Button.tsx` (ghost = div[role=button]) |
| Shadow fallback | `Header.tsx` runtime detection + gradient strip |
| Driver fixes (uncommitted) | `~/Documents/drivers` `drivers/zoom/zoom_zrc.cr` + spec |
| Plan-of-record | https://claude.ai/code/artifact/abc596ff-85e1-43e7-be3a-83b4c95b206e |
