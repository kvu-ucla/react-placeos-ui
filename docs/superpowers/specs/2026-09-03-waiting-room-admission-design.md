# Waiting-room admission UI

**Date:** 2026-09-03
**Status:** Approved

## Goal

Hosts can admit waiting-room guests from the Status tab: an Admit button per
waiting row and an Admit all button when 2+ are waiting.

## Driver contract (already deployed on `ucla-dev`)

- `admit_from_waiting_room(user_ids : Array(Int32))` — POST admit; the
  wrapper's ack means "command accepted", NOT completion.
- `admit_all_from_waiting_room` — POST admit-all.
- The roster events fired by the actual move trigger the driver's coalesced
  `get_participants` refetch → `participants` status updates → UI re-renders.
  No optimistic state in the UI.
- `waiting_room_on_entry` / `admit_guest_enabled` are settings-toggle
  notifications, deliberately NOT consumed.

## UI changes (all in `src/components/tabbed/StatusTab.tsx`)

- Pull `zoomMod` and `execute` from `useZoomContext()`.
- `admit(userId)`: coerce `user_id` (`number | string`) to an integer; call
  `execute(zoomMod, "admit_from_waiting_room", [[id]])`. Rows whose id can't
  coerce to an integer render a disabled Admit button.
- `admitAll()`: `execute(zoomMod, "admit_all_from_waiting_room", [])`.
- Pending state: `Set<string>` of in-flight ids (keyed `String(user_id)`) +
  an admit-all boolean. A tapped button shows disabled "Admitting…" and stays
  pending until the roster refresh removes the row (ack precedes the move;
  re-enabling on ack invites double-taps). On command failure the pending
  flag clears (retryable); `useModuleExecute` already shows the error toast.
  Admit-all pending disables every waiting-row button too.
- Prune: when the waiting list changes, drop pending ids no longer waiting;
  clear admit-all pending when the waiting list empties.
- Layout: Admit is a right-aligned compact primary `Button` on each waiting
  row; Admit all sits right of the "Waiting Room (n)" heading, only when
  n ≥ 2.

## Error handling

Command rejection → error toast via the existing execute path, pending
cleared, row unchanged. Roster never lies: rows only move on the driver's
refetched truth.

## Verification

`npm run build` + `npm run lint` (14-error baseline). Live: guest in waiting
room → tap Admit → "Admitting…" → row moves to Participants; Admit all with
2+ waiting; kill the wrapper and confirm a failed admit re-enables the
button.

## Out of scope

Waiting toast/badge; send-to-waiting-room (put on hold); driver changes.
