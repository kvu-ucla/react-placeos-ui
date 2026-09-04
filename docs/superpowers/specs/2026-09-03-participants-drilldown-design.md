# Status-tab drill-down + unified participants list

**Date:** 2026-09-03
**Status:** Approved (conversational design 2026-09-03; deny driver method landed as `deny_from_waiting_room` on drivers branch feat/waiting-room-deny)

## Goal

The Status tab stops cramming a roster into leftover space. It becomes a
meeting-overview view (details + sharing key + action buttons); the full
roster lives in a drill-down Participants view inside the same modal — no
stacked modals. Waiting guests appear in the SAME list as everyone else,
pinned first, with inline Admit/Deny.

## Views (all inside `StatusTab.tsx`'s slot in SettingsModal)

**Status view (default):**
- Meeting info card (title + meeting number — unchanged copy/hydration rules).
- Sharing key row when `sharingKey` is non-null (same mono treatment as the
  join card).
- Buttons row: one big "Participants" `Button` (primary, touch-sized) with
  the amber waiting-count badge overlaid when > 0. (Future meeting functions
  join this row; YAGNI now.)

**Participants view (drill-down):**
- Header row: back control (`div[role=button]` ghost-style chevron — panel
  webview rule: no styled native buttons), "Participants (total)" title, and
  "Admit all" (2+ waiting) on the right.
- ONE unified list: waiting guests pinned to the top, each with grayed
  avatar, name, a "Waiting" chip, and inline Admit + Deny buttons; then
  in-meeting participants as today's `ParticipantRow` (host/co-host tags,
  raised hand).
- Loading skeleton and confirmed-empty states as today.

## Navigation / deep link

- View state lives in `StatusTab` (`"status" | "participants"`), reset to
  `"status"` on mount.
- `ModalContext.showModal` options gain `view?: "participants"`; the
  provider stores it, `SettingsModal` passes it through, and `StatusTab`
  uses it as the initial view. The waiting toast and the Meeting Controls
  card deep-link with `showModal("settings", { tab: "Status", view: "participants" })`
  so "someone is waiting → tap → admit/deny" stays one tap.

## Actions

- Admit / Admit all: exactly the shipped semantics (pending until roster
  refresh removes the row; failure clears pending; execute's error toast).
- Deny: `execute(zoomMod, "deny_from_waiting_room", [[id]])` — ack-only,
  same pending treatment, SHARED pending set with admit (a row is busy while
  either command is in flight; both buttons disable).
- GATE: Deny renders only behind the driver deploy — controlled by a single
  `DENY_ENABLED` const in StatusTab, `false` until the driver branch
  (feat/waiting-room-deny, commit 90faf5ed) + wrapper verdict are deployed;
  flipping it is the whole enablement.

## Verification

Build + lint baseline. Live: Status view shows details/key/button with
badge; drill-in lists waiting-first; Admit works as before; toast tap lands
directly on the Participants view. Deny verified after driver/wrapper
deploy, then `DENY_ENABLED` flips true.

## Out of scope

Stacked modals; other meeting functions on the Status view; send-to-waiting-room.
