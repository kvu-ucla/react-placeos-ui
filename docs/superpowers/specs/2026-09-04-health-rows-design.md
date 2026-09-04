# Support Diagnostics: computed health rows

**Date:** 2026-09-04
**Status:** Approved (rows negotiated in conversation; Audio/Bookings omitted
for now; Room controller/Control commands/Recent-faults rows rejected)

## Goal

The Diagnostics tab leads with a health checklist that makes system solidity
legible: five tri-state rows and an "All systems operational — since
<timestamp>" header. The statement is made by the rows being green because
the underlying facts are true. Unknown state fails toward "checking…", never
default-green.

## Rows (tri-state: ok / degraded / checking)

| Row | ok | degraded | checking |
|---|---|---|---|
| Websocket | `connection === "online"` | `"offline"` | `"connecting"` |
| Signal routing | `signal_graph_ok !== false` AND `inputs` list non-empty | `signal_graph_ok === false` or empty inputs | either binding undefined |
| Video endpoints † | every `routes_detail` entry has non-null `rx_host` | any null `rx_host` | binding undefined |
| Zoom Room | `zoomOnline && paired && zrcConnectionState` contains "Connected" | any of the three false/absent | any undefined |
| Meeting state | `callStatus.status` is a known value (idle is healthy) | `"UNKNOWN"` | callStatus absent |

† environment row: rendered with an "(environment)" tag; its degradation does
NOT reset the operational-since clock (NVX outages/scanner nights are not an
owned fault).

## Operational since

Header shows "All systems operational — since <time>" when every row is ok
(environment row included in display but not in the clock). The timestamp
persists in localStorage (`health-operational-since`); it resets whenever any
OWNED row leaves ok, and re-arms when all owned rows return. While any owned
row is degraded/checking the header shows the degraded state instead.

## Driver change (drivers repo, ucla-dev)

`meet.cr#init_signal_routing` currently only logs on graph-load failure
(invisible to bindings — proven tonight). Publish the fact:
- success path: `self[:signal_graph_ok] = true`
- rescue path: `self[:signal_graph_ok] = false`

## UI wiring

New hook `useSystemHealth(systemId)` (own `useBinder`):
- System module: listen `signal_graph_ok`, `inputs` (string array).
- Switcher module (`Switcher_1` alias "Switcher"): listen `routes_detail`
  (map of output → {rx_host, ...}); tolerate absent module (row stays
  checking).
- Consumes `connection`, `zoomOnline`, `paired`, `zrcConnectionState`,
  `callStatus` from ZoomContext (already exposed).
- Returns `{ rows: HealthRow[], operationalSince: number | null }` where
  `HealthRow = { label, state: "ok" | "degraded" | "checking", note?, environment? }`.

SupportModal Diagnostics tab: health section on top (status dot + label per
row, header line above), existing raw read-out rows remain below as
"Details". Ring buffer explicitly deferred.

## Verification

Build + lint baseline; driver spec suite via harness; live: all five rows
green on the healthy room; unplugging/renaming scenarios produce the mapped
ambers (signal-graph failure now visibly trips Signal routing).

## Out of scope

Audio and Bookings rows (deliberately omitted for now); recent-faults ring
buffer; live log tail; module-death staleness heartbeat (filed).
