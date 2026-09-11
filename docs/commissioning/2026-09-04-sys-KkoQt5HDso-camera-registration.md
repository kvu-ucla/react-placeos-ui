# Lab system sys-KkoQt5HDso — camera registration + VC tab override

> RECONSTRUCTED 2026-09-04 from HANDOFF.md rev 4 after the original conversation
> draft was lost. Schema-checked against `origin/ucla-dev` drivers
> (`drivers/ucla/place/router/settings.cr`, `meet.cr`, `meet/tab.cr`) and the UI
> input type (`src/hooks/useControlState.ts`). Verify on-system before applying.

## Prerequisite: clear stale persisted io lists

`signal_graph_ok` is currently **false** because of stale persisted io lists.
AWS SSO must be live (`aws sso login`) before kubectl work.

1. Stop the System module (`mod-Kl27FJpxnA`) in Backstage.
2. `kubectl exec -n placeos redis-master-0 -- redis-cli DEL status/mod-Kl27FJpxnA`
3. Start the System module again.

## Camera registration (System module settings)

Cameras are registered via synthetic inert edges into `Switcher_1` plus
`inputs:` metadata. The meet driver derives `available_cameras` from `inputs:`
entries with `type: cam` **only when `local_cameras` is unset/empty and there
are no join modes** (`meet.cr` ~line 553) — so do NOT also set `local_cameras`.
Do NOT set `vc_camera_in` / `vc_camera_input`.

Input keys MUST stay `Camera_1` / `Camera_2` — they are the module names, which
is what camera control resolves against, and (until
`fix/router-mod-ref-parse` merges) `_<digits>`-suffixed graph keys are only safe
when they are exactly stable module-name aliases like these.

```yaml
connections:
  # Synthetic inert edges: register the cameras as signal-graph nodes.
  # They are never routed; presentable: false keeps them out of source pickers.
  Switcher_1:
    Camera_1: Camera_1
    Camera_2: Camera_2

inputs:
  Camera_1:
    name: Presenter # VERIFY: confirm which physical camera is Presenter vs Audience
    type: cam
    presentable: false
  Camera_2:
    name: Audience # VERIFY: name-to-camera order not yet confirmed on-glass
    type: cam
    presentable: false
```

Note: `connections:` above will be merged with the system's existing map —
apply as an addition to the existing `Switcher_1` sink entry if one exists, not
a replacement.

## `tabs:` override (still needed)

The zone's VC tab references `VidConf_1`, which does not exist in this system —
power-on fails. Override at system level, pointing the tab at the real VC
module. Copy icon/name/controls from the zone's tab definition; only `inputs`
changes:

```yaml
tabs:
  - icon: <copy from zone> # TODO: pull actual values from zone settings
    name: <copy from zone>
    inputs: ["ZoomZRC_1"] # VERIFY module name; zone default was VidConf_1
    controls: vidconf-controls
```

## Verification after applying

- `signal_graph_ok` becomes true on the meet module.
- `available_cameras` status lists `Camera_1` / `Camera_2` with the friendly
  names; Presenter/Audience order matches physical cameras.
- Cameras do not appear as presentable sources in the UI.
- VC tab powers on without error.
