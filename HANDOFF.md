# Session handoff / resume pointer — 2026-09-04 (rev 4)

Supersedes rev 3 (git history). Read THIS first. Memory: `zoom-zrc-migration-status`, `health-pane-philosophy`, `crestron-webview-quirks`, `review-before-landing` (+ driver-lane memories in the drivers repo scope).

## PROCESS (owner-mandated, non-negotiable)

- **Independent review before every push**: Kiro lane (`kiro-cli chat --trust-all-tools --model gpt-5.6-luna`, 0.10x credits) on the diff, verdict line APPROVE/CHANGES REQUESTED. Momentum never waives it (rev-4 session relearned this the hard way).
- **Herdr**: spawned agents get their OWN TAB, never a pane split. Kiro stalls if prompted right after start — esc, ~2s, then prompt. Claude-agent composers may hold the owner's queued text — never blind-submit; esc + orchestrated prompt.

## Landing (all reviewed unless noted)

- **UI** `feat/ui-polish` @ `d89d440` (pushed; CI → `build/feat_ui-polish` → nonprod `control-av-dev`). Shipped this rev: help-setting support cards (Support modal renders `help` map; Settings banner phone from `help.support`; `src/config.ts` deleted); toast unification (`src/notify.ts` + eslint guard, optional onClick); always-open join cards + live `sharing_key` (also on splash ClassInfoCard — both branches — and Status tab; plain font-semibold everywhere); waiting-room stack (toast+badge deep-links, Participants sidebar tab, unified waiting-first list, Admit/Admit-all/Deny — `DENY_ENABLED=true`); statically sized modals (`.modal-frame`); Support Diagnostics tab (raw rows + 5 computed health rows + operational-since; doctrine in memory); dimmed-brand disabled buttons; recording-disclaimer nested-payload fix (`reminderTextRoot`); retro-review fixes (evidence-gated health, tabNonce deep-links, admit-all snapshot).
- **Drivers** `ucla-dev` @ `9b55221215`: deny_from_waiting_room (`52c6606114`), `signal_graph_ok` status (`b479ebe0a5`), UCLA booking converter (`drivers/ucla/zoom/booking_converter.cr` — `booking_source` setting default `ZoomZRC_1/meetings`, dual-casing normalization, generation-guarded switching; 4 review rounds).
- **Wrapper** (`place-labs/zoom-zrc-sdk-wrapper`) `main` @ `5bf2f36`; **pod `zoom-zrc-0` runs `feat-waiting-room-deny-6f3d37d`** (rolled with backup/MAC/pairing verification — kubectl-tar backup, NOT backup.sh which archives an empty volume in k8s). Waiting-room admit routes + deny(expel) + `is_in_waiting_room` serializer fix live. `main-5bf2f36` image (serializer `is_on_hold` cleanup) awaits next natural roll. Verdict: SDK has no dedicated deny — hold ≡ waiting room (documented as intended).

## Open items

1. **Backstage** (blocks most verification): repoint `Bookings` module → `drivers/ucla/zoom/booking_converter.cr` (defaults suffice; optional explicit `booking_source: {module: ZoomZRC_1, status: meetings}`); ensure ZoomZRC/meet modules build from `ucla-dev` head.
2. **Lab system sys-KkoQt5HDso commissioning** (in progress): `signal_graph_ok` currently **false** — stale persisted io lists; remedy = stop System module → `DEL status/mod-Kl27FJpxnA` (redis-master-0, ns placeos) → start. Camera registration YAML drafted in conversation (synthetic inert `Switcher_1: {Camera_1: Camera_1, Camera_2: Camera_2}` edges + `inputs:` metadata, `presentable: false`, NO `vc_camera_input`; keys must stay `Camera_1/2` = module names; verify Presenter/Audience name-to-camera order). `tabs:` override still needed (zone's VC tab references nonexistent `VidConf_1` → power fails). AWS SSO expired — `aws sso login` before kubectl work.
3. **`help.support` phones YAML** (drafted in conversation, real numbers in) + on-glass check.
4. **Consolidated on-glass session** (lab-test powered on): guest flow (toast→badge→tab→Admit/Deny/Admit-all + park-and-admit conflation check), sharing key x3, health rows green + operational-since, bookings on splash, join cards fit, disabled contrast, reminder text.
5. **BACKBURNER**: router parser fix `fix/router-mod-ref-parse` @ `e1e8b0cf47` (Kiro-approved, pushed, UNMERGED — until merged, graph node keys must not end `_<digits>` unless they remain stable aliases). Pair with `load_io` skip-and-warn hardening (stale-restore broke this room 3x) and the unrouted-camera meet enhancement (kills the synthetic edges).
6. **Deferred**: converter cron-interleave/sorted-assumption/join-url items (readme documents); wrapper meeting-end event logging gap (driver poll backstops); `meeting_will_stop` banner; ring buffer after health rows burn in green; module-death staleness heartbeat; upstream PRs (router regex, place converter); NVX 05:45Z blip — likely scanner; ask netsec, recheck for nightly recurrence.
7. **Merge**: PR `feat/ui-polish` → `development` after on-glass passes (bundle CI workflow commits `ffa11a4`/`29ca490`).

## Where things live

| Thing | Location |
| --- | --- |
| UI branch | `origin/feat/ui-polish` @ `d89d440` |
| Driver deploy branch | `origin/ucla-dev` @ `9b55221215` |
| Wrapper mainline / pod | `main` @ `5bf2f36` / pod on `feat-waiting-room-deny-6f3d37d` |
| Parked parser fix | `origin/fix/router-mod-ref-parse` @ `e1e8b0cf47` |
| Health rows | `src/hooks/useSystemHealth.ts` + SupportModal Diagnostics |
| Waiting room UI | `src/components/tabbed/ParticipantsTab.tsx` (+ SessionControls toast/badge) |
| Toast helper | `src/notify.ts` (eslint-guarded) |
| Specs/plans (this rev) | `docs/superpowers/{specs,plans}/2026-09-0{2,3,4}-*` |
| Booking converter | `drivers/ucla/zoom/booking_converter.cr` (+ readme, spec) |
| K8s | ns `placeos`: `zoom-zrc-0`, `redis-master-0`, `core-0`; System module `mod-Kl27FJpxnA`, Switcher `mod-Kl1hiPUN6V` |
