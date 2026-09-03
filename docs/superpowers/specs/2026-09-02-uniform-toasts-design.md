# Uniform toast notifications

**Date:** 2026-09-02
**Status:** Approved

## Goal

All toasts share consistent semantics: a severity method chosen by intent and
a dedup `toastId` on every toast. Today one site fires bare styleless
`toast()` for success confirmations, and two error sites stack duplicates
because they have no id.

## Design

**`src/notify.ts`** — the only module (besides the `App.tsx` container) that
touches react-toastify:

```ts
import { toast } from "react-toastify";

// All app toasts go through here: severity by intent, dedup id always
// (defaults to the message so repeat triggers update in place, not stack).
export const notify = {
  success: (message: string, id?: string) =>
    toast.success(message, { toastId: id ?? message }),
  info: (message: string, id?: string) =>
    toast.info(message, { toastId: id ?? message }),
  error: (message: string, id?: string) =>
    toast.error(message, { toastId: id ?? message }),
  dismiss: (id: string) => toast.dismiss(id),
};
```

No other options are accepted — look and behavior come only from the
`ToastContainer` in `App.tsx`, which stays untouched (top-right, 3s, light).

**Call-site mapping** (all five sites migrate to `notify`):

| site | today | becomes |
| --- | --- | --- |
| `CameraPresetButton.tsx:41,47` preset saved/recalled | bare `toast()` (styleless) | `notify.success(msg)` |
| `ZoomPromptHost.tsx:59` prompt toasts | `toast.info(msg, {toastId: promptKey})` | `notify.info(msg, promptKey)` |
| `ZoomPromptHost.tsx:66` dismiss | `toast.dismiss("recording_disclaimer_needed")` | `notify.dismiss("recording_disclaimer_needed")` |
| `SessionControls.tsx:51` control timeout | `toast.error(msg, {toastId: "control-timeout"})` | `notify.error(msg, "control-timeout")` |
| `useControlState.ts:279` power timeout | `toast.error(msg)` — no id | `notify.error(msg)` (id = message) |
| `placeos.ts:91` command failed | `toast.error(msg)` — no id | `notify.error(msg)` (id = message) |

**ESLint guard** in `eslint.config.js`: add `no-restricted-imports` for
`react-toastify` in the shared `**/*.{ts,tsx}` block, plus an override block
for `src/notify.ts` and `src/App.tsx` disabling the rule — future drift
becomes a lint error.

## Behavior changes (intended)

- Preset saved/recalled toasts turn green success (were gray default).
- Rapid repeats of the same message update the existing toast instead of
  stacking (react-toastify ignores a toast whose id is already active).

## Verification

`npm run build` and `npm run lint` (no errors beyond the 14 pre-existing
baseline); confirm the guard fires by momentarily importing react-toastify in
a component. On-glass: save a camera preset → green success toast.

## Out of scope

Visual restyling of the toast cards; container option changes.
