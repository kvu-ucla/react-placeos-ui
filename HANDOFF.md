# Session handoff / resume pointer — 2026-09-01

Supersedes: none (first handoff in this repo). Start a fresh session by reading THIS file first. Role and conventions live in memory/project instructions — not restated. Plan-of-record: https://claude.ai/code/artifact/abc596ff-85e1-43e7-be3a-83b4c95b206e (approved plan, updated with landed status).

## Landing (all verified unless marked pending)

All commits on `feat/zoom-zrc-migration` (off `development` @ `fc4f96e`). Every chunk was implemented by a Claude agent and independently reviewed by a Codex (GPT) agent, read-only at the reviewed commit; verdicts archived in `review-verdicts/` (gitignored, plus copies in the session scratchpad).

- `bcfd826` — chunk 1: standard PlaceOS binding/execute hooks (`src/hooks/placeos.ts`: createBinder/useBinder/useBinding/useModuleExecute), useControlState refactor, raw executes routed. Build ✓, lint = 25 baseline. Review: PASS, no findings. Verified.
- `a8d2d7b` + `1545514` — chunk 2: dead code/placeholders removed (SessionDetails.tsx deleted, TBD/blank phone → `src/config.ts` SUPPORT_PHONE=null hides links), IconType/VolumeSlider de-dup, a11y basics (dialog roles/Esc/focus rings/keys), ErrorBoundary, SessionControls 10s spinner timeout. Build ✓, lint 25→20. Review: PASS, no findings. Verified.
- `8928c2e` — chunk 3: Zoom integration migrated ZoomCSAPI → **ZoomZRC** + **Bookings** modules. `useZoomModule.ts` deleted; new `useZoomRoom.ts` + `useAvControls.ts`; explicit `ZoomContextValue`; sharing/mute-all/per-participant controls removed; timeJoined derived client-side. Build ✓, lint 20→15, greps clean, headless render check = pre-migration baseline. Review: PASS against Crystal driver sources, no findings. Verified.
- `6cd5642` — chunk 4: prompt-handling UI (`src/components/prompts/`: ZoomPromptHost, promptConfig, MeetingPasswordModal) for all 15 driver prompt keys; `zoomMod` added to context. Build ✓, lint = 15. Review: PASS, one recorded NIT (privacy_alert missing-fields fallback raises driver-side; only reachable on payloads the driver never publishes as actionable). Verified.
- `33bcd9f` — chunk 5: README "Backend requirements (ZoomZRC migration)" section, console-log sweep, `.gitignore` review-verdicts/, final regression (build ✓, lint = 14, all greps clean, render check ✓). Review: PASS, no findings. Verified.
- Live smoke test against a real system carrying `ZoomZRC` + `Bookings` modules (join/mute/prompts/bookings end-to-end). **PENDING** — not possible this session; see owner decisions 1–2.
- Branch pushed to `origin/feat/zoom-zrc-migration`; CI publishes `build/feat_zoom-zrc-migration` on push. **PENDING**: no PR yet; nonprod `control-av-dev` app must be repointed at the build branch (it currently serves raw source — see owner decisions).

## Owner decisions / open items (each with what it unblocks)

1. **Backend: repoint booking_converter** from `ZoomCSAPI_1:BookingsListResult` to `ZoomZRC_1:meetings` (or keep CSAPI running for bookings only) — unblocks bookings/current/next meeting display end-to-end and the chunk-3 live smoke test. Documented in README.
2. **Provision a system with the ZoomZRC module and run the live smoke test** (join passworded meeting, waiting-for-host, ask-to-unmute, inbound mute reflection, participants payload field names for `ZrcParticipant`) — unblocks marking chunks 3–4 functionally verified and finalizing the tolerant participant type.
3. **Provide the real AV support phone number** for `src/config.ts` `SUPPORT_PHONE` — unblocks visible support phone links in SupportModal/SettingsModal (currently hidden).
4. **Repoint the nonprod `control-av-dev` static app at `build/feat_zoom-zrc-migration`** (host/backoffice config) — it currently serves the branch's raw source tree, which 404s on `/src/main.tsx`; then open a PR to `development` when smoke-tested.
5. Backend converter's `creator` field is always null — unblocks restoring the instructor name on ClassInfoCard (UI hides the line meanwhile).

## Where things live

| Thing | Location |
| --- | --- |
| Feature branch (7 commits) | `feat/zoom-zrc-migration` (pushed to origin) |
| Approved plan / plan-of-record | https://claude.ai/code/artifact/abc596ff-85e1-43e7-be3a-83b4c95b206e |
| Plan file (local) | `~/.claude/plans/we-will-need-review-jazzy-treehouse.md` |
| Review verdicts + impl reports (chunks 1–5) | `review-verdicts/` (gitignored) |
| Subscription layer | `src/hooks/placeos.ts`, `src/hooks/useZoomRoom.ts`, `src/hooks/useAvControls.ts`, `src/hooks/ZoomContext.tsx` |
| Prompt UI | `src/components/prompts/` |
| Backend contract doc | `README.md` → "Backend requirements (ZoomZRC migration)" |
| New Zoom driver (reference) | `~/Documents/drivers/drivers/zoom/zoom_zrc.cr` (+ `zoom_zrc_models.cr`, `booking_converter.cr`) |
