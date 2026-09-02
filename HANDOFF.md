# Session handoff / resume pointer — 2026-09-01 (rev 2)

Supersedes the 2026-09-01 rev-1 handoff (migration-only; previous content of this file, see git history of HANDOFF.md). Start a fresh session by reading THIS file first. Role and conventions live in memory/project instructions — not restated. Plan-of-record: https://claude.ai/code/artifact/abc596ff-85e1-43e7-be3a-83b4c95b206e (updated same pass).

## Landing (all verified unless marked pending)

Two stacked branches, both pushed; every chunk implemented by a Claude agent and independently reviewed (Codex/GPT for the migration; Kiro `gpt-5.6-terra` for the polish push after Codex hit its spend cap). Verdicts archived in `review-verdicts/` (gitignored).

**`feat/zoom-zrc-migration`** (off `development` @ `fc4f96e`) — ZR-CSAPI → ZoomZRC+Bookings migration, subscription layer, prompt UI, cleanup: `bcfd826`, `a8d2d7b`, `1545514`, `8928c2e`, `6cd5642`, `33bcd9f`, handoff `fc1750e`, CI fixes `ffa11a4`+`29ca490`, live-smoke participants fix `5b7e393`. All review-PASSed. CI publishes `build/feat_zoom-zrc-migration`. Verified.

**`feat/ui-polish`** (off the migration branch) — polish push, approved look preserved:
- `907439a` + `c737260` — chunk A: render churn (MicControl/ParticipantRow hoisted+memo, 13 context actions stable, hook returns memoized, slider drag-guards; fix round closed a stuck-guard blocker). PASS r2. Verified.
- `851722a` + `4328475` + `841497a` — chunk B: interaction correctness (cards disabled outside meetings, honest DisplayTab toggle with abandonment + seq-guarded reconciliation after two review-caught races, ref-based accordion scroll, scoped dropdown blur). PASS r3. Verified.
- `1fdd99e` — chunk C: motion/touch/hydration (tabular-nums, unified shell + single Header + screen crossfade, active: states, 150-200ms modal/tab entrances w/ prefers-reduced-motion, loading-vs-empty gates, modal overflow caps). PASS r1. Verified.
- `a21e072` — chunk D: shared `src/components/Button.tsx` (primary/outline/ghost, visually identical, proof tables in review-verdicts/polish-d-impl.md), 2 sanctioned radius normalizations, `!important` cleanup (Header ones dropped with built-CSS proof; daisyui-forced ones kept+commented), dead CSS removed, OfflineModal stacking verified. PASS r1. Verified.
- CI publishes `build/feat_ui-polish` on push. Latest build at `a21e072`: PENDING (push just made; check Actions).
- On-glass verification at kiosk resolution (fader drag with mic rows visible, splash↔main crossfade, modal entrances, pressed states): PENDING — needs the nonprod panel.

**ZoomZRC driver fixes** (repo `~/Documents/drivers`, branch `ucla-dev`) — participant-refresh coalescing + event-owned mic/camera state, spec-verified (81 examples). **UNCOMMITTED in the working tree, awaiting owner review/commit/redeploy.** PENDING.

## Owner decisions / open items (each with what it unblocks)

1. **Point nonprod `control-av-dev` at `build/feat_ui-polish`** (host/backoffice config) — unblocks on-glass verification of both pushes at once (polish branch contains the migration).
2. **Review/commit/redeploy the driver working-tree changes** in `~/Documents/drivers` — unblocks single participants-fetch-per-change and honest mute loading states on the panel.
3. **Backend: repoint booking_converter** from `ZoomCSAPI_1:BookingsListResult` to `ZoomZRC_1:meetings` — unblocks bookings end-to-end (documented in README).
4. **Real AV support phone** for `src/config.ts` — unblocks visible support links.
5. **Merge strategy** — `feat/ui-polish` ⊃ `feat/zoom-zrc-migration`; PR the polish branch to `development` (one PR) or stage the two separately — unblocks deployment. Remember `development` needs the CI workflow commits (`ffa11a4`, `29ca490`).
6. Deferred from the polish plan: context splitting/external store (only if profiling still shows churn after chunk A — none expected).

## Where things live

| Thing | Location |
| --- | --- |
| Migration branch | `origin/feat/zoom-zrc-migration` |
| Polish branch (current work, contains migration) | `origin/feat/ui-polish` |
| Build branches (CI-published) | `origin/build/feat_zoom-zrc-migration`, `origin/build/feat_ui-polish`, `build/dev` (restored to development's build) |
| Plan-of-record | https://claude.ai/code/artifact/abc596ff-85e1-43e7-be3a-83b4c95b206e |
| Review verdicts + impl reports (all chunks, both pushes) | `review-verdicts/` (gitignored) |
| Shared UI primitives | `src/components/Button.tsx`, `src/components/VolumeSlider.tsx`, `src/components/icons.ts`, `src/components/ErrorBoundary.tsx` |
| Subscription layer | `src/hooks/placeos.ts`, `useZoomRoom.ts`, `useAvControls.ts`, `ZoomContext.tsx` |
| Prompt UI | `src/components/prompts/` |
| Motion utilities | `src/index.css` (`ui-fade-in`, `ui-modal-in`, `.screen-fade`, `.tab-fade`, `.modal-fade`, `.modal-pop` + reduced-motion block) |
| Driver fixes (uncommitted) | `~/Documents/drivers` `drivers/zoom/zoom_zrc.cr` + spec, on `ucla-dev` |
| Backend contract doc | `README.md` → "Backend requirements (ZoomZRC migration)" |
