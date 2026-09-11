# Session handoff / resume pointer — 2026-09-11 (rev 5)

Supersedes rev 4 (git history). Read THIS first. Memory: `zoom-zrc-migration-status`, `health-pane-philosophy`, `crestron-webview-quirks`, `review-before-landing` (+ driver-lane memories in the drivers repo scope).

## PROCESS (owner-mandated, non-negotiable)

- **Independent review before every push**: Kiro lane (`kiro-cli chat --trust-all-tools --model gpt-5.6-luna`, 0.10x credits) on the diff, verdict line APPROVE/CHANGES REQUESTED. Momentum never waives it (rev-4 session relearned this the hard way). Docs-only handoff commits follow rev-4 precedent (committed/pushed directly).
- **Herdr**: spawned agents get their OWN TAB, never a pane split. Kiro stalls if prompted right after start — esc, ~2s, then prompt. Claude-agent composers may hold the owner's queued text — never blind-submit; esc + orchestrated prompt.

## Landing (all reviewed unless noted)

- **UI** `feat/ui-polish` @ `a61952b` (pushed; CI → `build/feat_ui-polish` → nonprod `control-av-dev`). No code changes this rev — rev-5 session was recovery/archaeology only. Full shipped-feature list: see rev 4 (git history), headline items: help-setting support cards, toast unification (`src/notify.ts`), always-open join cards + live `sharing_key`, waiting-room stack (`DENY_ENABLED=true`), `.modal-frame` statically sized modals, Support Diagnostics tab (raw + 5 computed health rows + operational-since), dimmed-brand disabled buttons, `reminderTextRoot` fix, retro-review fixes.
- **Drivers** `ucla-dev` @ `9b55221215` (verified this rev): deny_from_waiting_room (`52c6606114`), `signal_graph_ok` status (`b479ebe0a5`), UCLA booking converter (`drivers/ucla/zoom/booking_converter.cr`).
- **Wrapper** (`place-labs/zoom-zrc-sdk-wrapper`) `main` @ `5bf2f36`; **pod `zoom-zrc-0` runs `feat-waiting-room-deny-6f3d37d`**. `main-5bf2f36` image awaits next natural roll. kubectl-tar backup only, NOT backup.sh (archives an empty volume in k8s).

## Recovered this rev (was lost with the rev-4 conversation)

- **Camera registration + VC tabs override for lab system**: reconstructed from rev-4 notes and schema-checked against `origin/ucla-dev` driver sources → `docs/commissioning/2026-09-04-sys-KkoQt5HDso-camera-registration.md` (committed this rev). Two VERIFY flags inside: Presenter/Audience name-to-camera order; tab icon/name values to copy from zone settings.
- **FSPH support phone numbers**: recovered from git history (`017b6c5` `src/components/SupportModal.tsx`, pre-cleanup): AV Technical Support **(310) 206-6597** / `tel:+13102066597` (7am–11pm); Facilities Support **(310) 825-9236** / `tel:+13108259236` (9am–5pm weekdays); Emergency **1 (800) 900-UCLA** / `tel:+18009008525`. String "FSPH" never appears in repo history — these are the numbers the UI originally shipped with; owner to confirm they're correct for the FSPH building before they go into `help.support` YAML.
- **History audit, clean**: no API keys or `.env` ever committed (`KEY` was always `import.meta.env.VITE_APP_KEY`); deleted `NewFile1.json` was Charles Darwin University sample data (Australian numbers — ignore); hardcoded `ucla-dev.placeos.run` host in App.tsx is expected dev config.

## Open items

1. **Backstage** (blocks most verification): repoint `Bookings` module → `drivers/ucla/zoom/booking_converter.cr` (defaults suffice; optional explicit `booking_source: {module: ZoomZRC_1, status: meetings}`); ensure ZoomZRC/meet modules build from `ucla-dev` head.
2. **Lab system sys-KkoQt5HDso commissioning**: `signal_graph_ok` false — remedy + camera YAML + `tabs:` override all in `docs/commissioning/2026-09-04-sys-KkoQt5HDso-camera-registration.md` (stop System module → `DEL status/mod-Kl27FJpxnA` on redis-master-0 → start; then apply settings). AWS SSO expired — `aws sso login` before kubectl work.
3. **`help.support` phones YAML**: numbers recovered (see above); author YAML in Backstage (schema: `docs/superpowers/specs/2026-09-02-support-phone-from-driver-setting-design.md` — page keyed `support` needs `title`+`content` or the whole help parse fails; `phone` tel-format + `phone_display`) + on-glass check. Owner to confirm numbers are right for FSPH.
4. **Consolidated on-glass session** (lab-test powered on): guest flow (toast→badge→tab→Admit/Deny/Admit-all + park-and-admit conflation check), sharing key x3, health rows green + operational-since, bookings on splash, join cards fit, disabled contrast, reminder text.
5. **BACKBURNER**: router parser fix `fix/router-mod-ref-parse` @ `e1e8b0cf47` (Kiro-approved, pushed, UNMERGED — until merged, graph node keys must not end `_<digits>` unless they remain stable aliases; lab camera YAML keys `Camera_1/2` are safe = module names). Pair with `load_io` skip-and-warn hardening and the unrouted-camera meet enhancement (kills the synthetic edges).
6. **Deferred**: converter cron-interleave/sorted-assumption/join-url items (readme documents); wrapper meeting-end event logging gap (driver poll backstops); `meeting_will_stop` banner; ring buffer after health rows burn in green; module-death staleness heartbeat; upstream PRs (router regex, place converter); NVX 05:45Z blip — likely scanner; ask netsec, recheck for nightly recurrence.
7. **Merge**: PR `feat/ui-polish` → `development` after on-glass passes (bundle CI workflow commits `ffa11a4`/`29ca490`).

## Where things live

| Thing | Location |
| --- | --- |
| UI branch | `origin/feat/ui-polish` (rev-5 handoff commit on top of `a61952b`) |
| Driver deploy branch | `origin/ucla-dev` @ `9b55221215` |
| Wrapper mainline / pod | `main` @ `5bf2f36` / pod on `feat-waiting-room-deny-6f3d37d` |
| Parked parser fix | `origin/fix/router-mod-ref-parse` @ `e1e8b0cf47` |
| Lab commissioning doc (camera YAML, tabs override, redis remedy) | `docs/commissioning/2026-09-04-sys-KkoQt5HDso-camera-registration.md` |
| Recovered phone numbers | this file (Recovered section) + old `SupportModal.tsx` @ `017b6c5` |
| Health rows | `src/hooks/useSystemHealth.ts` + SupportModal Diagnostics |
| Waiting room UI | `src/components/tabbed/ParticipantsTab.tsx` (+ SessionControls toast/badge) |
| Toast helper | `src/notify.ts` (eslint-guarded) |
| Specs/plans | `docs/superpowers/{specs,plans}/2026-09-0{2,3,4}-*` |
| Booking converter | `drivers/ucla/zoom/booking_converter.cr` (+ readme, spec) |
| K8s | ns `placeos`: `zoom-zrc-0`, `redis-master-0`, `core-0`; System module `mod-Kl27FJpxnA`, Switcher `mod-Kl1hiPUN6V` |
