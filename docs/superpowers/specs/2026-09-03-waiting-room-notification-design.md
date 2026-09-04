# Waiting-room notification + badge

**Date:** 2026-09-03
**Status:** Approved

## Goal

Hosts notice waiting guests without opening the Status tab: a tappable toast
when someone starts waiting, and a persistent count badge on the Meeting
Controls card. Tapping the toast opens the Settings modal on the Status tab
(where Admit / Admit all live).

## Design

**`src/notify.ts`** — each severity method gains an optional third param:
`(message: string, id?: string, onClick?: () => void)`, mapped to
react-toastify's `onClick` option. This deliberately amends the uniform-toast
spec's "no other options" rule by exactly one uniform, typed affordance;
arbitrary options remain banned.

**`src/components/ControlCard.tsx`** — new optional `badge?: number` prop.
When `badge > 0`, an amber pill (`bg-amber-400 text-black`, `min-w-8 h-8`,
rounded-full, `text-lg font-bold`) renders absolutely at the card's top-right
(inside the existing relative container). Amber, not red — attention, not
error/recording.

**`src/components/SessionControls.tsx`** —
- Consume `participants` from `useZoomContext()`; derive
  `waitingCount = participants?.filter(p => p.is_in_waiting_room).length ?? 0`
  (memoized).
- Pass `badge={waitingCount}` to the Meeting Controls `ControlCard`.
- Transition effect with a previous-count ref: on `0 → n` while the session
  is joined, fire
  `notify.info("Someone is waiting to join", "waiting-room", () => showModal("settings", { tab: "Status" }))`;
  on `n → 0`, `notify.dismiss("waiting-room")`. The stable id dedups repeat
  arrivals while the toast is showing.

## Error handling

No commands are issued here — display only. If participants never hydrate,
count is 0 and nothing renders/fires.

## Verification

`npm run build` + `npm run lint` (14-error baseline). Live: guest enters
waiting room → toast appears and Meeting Controls shows an amber "1";
tapping the toast opens Settings → Status; admitting (or the guest leaving)
clears both.

## Out of scope

Sound/vibration; per-guest toasts; send-to-waiting-room.
