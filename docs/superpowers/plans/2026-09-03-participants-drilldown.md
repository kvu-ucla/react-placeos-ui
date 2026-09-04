# Participants Drill-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Status tab = meeting overview (details, sharing key, Participants button + badge); Participants = drill-down view with one unified waiting-first list and inline Admit/Deny (Deny behind `DENY_ENABLED=false` until driver deploy).

**Architecture:** View state inside `StatusTab`; deep-link plumbed as a new `view` option through `ModalContext` → `SettingsModal` → `StatusTab`. Actions reuse the shipped admit semantics; deny mirrors them against `deny_from_waiting_room` (driver branch feat/waiting-room-deny @ 90faf5ed).

**Tech Stack:** React 19 + TS; existing Button/notify/ControlCard patterns; panel rule: back control is `div[role=button]`, never a styled native button.

**Spec:** `docs/superpowers/specs/2026-09-03-participants-drilldown-design.md`

## Global Constraints

- No test runner; verification = `npm run build` + `npm run lint` at the 14-error baseline.
- `initialView` must CLEAR on every `showModal` call without `view` (stale deep-links must not survive).
- Commits end with: `Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY`

### Task 1: `view` option through the modal plumbing

**Files:** Modify `src/hooks/ModalContext.tsx`, `src/components/SettingsModal.tsx` (prop passthrough), `src/components/Header.tsx` (prop passthrough).

- [ ] ModalContext: `showModal(type, options?: { tab?: TabSection; view?: "participants" })`; state `initialView`; `setInitialView(options?.view)` unconditionally in showModal; expose on context.
- [ ] Header: pass `initialView={initialView}` to `SettingsModal`.
- [ ] SettingsModal: accept `initialView?: "participants"`, pass to `<StatusTab initialView={initialView} />`.

### Task 2: StatusTab drill-down rewrite

**Files:** Modify `src/components/tabbed/StatusTab.tsx`.

- [ ] `StatusTab({ initialView })`: view state defaulting to `initialView ?? "status"`.
- [ ] Status view: existing meeting-info card + sharing key row (`useZoomContext().sharingKey`, mono/tracking-widest as join card) + primary "Participants" button with amber count badge (ControlCard badge styling) opening the participants view.
- [ ] Participants view: header (back `div[role=button]` chevron → status view; title `Participants (total)`; Admit all right-aligned when 2+ waiting) + unified list: waiting rows first (gray avatar, name, "Waiting" chip, Admit + Deny inline) then `ParticipantRow`s; skeleton/empty states preserved.
- [ ] Actions: shared pending set (`pendingActions`) covering admit AND deny per row; `deny(userId)` = `execute(zoomMod, "deny_from_waiting_room", [[id]])`, ack-only, failure clears pending; `const DENY_ENABLED = false` gates the Deny button (flip after driver+wrapper deploy).
- [ ] Deep-links: SessionControls waiting toast onClick and Meeting Controls `buttonAction` → `showModal("settings", { tab: "Status", view: "participants" })`.
- [ ] Verify `npm run build && npm run lint` (baseline); commit; push.

## Self-Review

Spec coverage complete (views, nav/deep-link incl. stale-clear, actions incl. DENY_ENABLED gate); no placeholders; names consistent (`initialView`, `pendingActions`, `DENY_ENABLED`, `deny_from_waiting_room`).
