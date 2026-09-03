# Uniform Toast Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every toast goes through a `notify` helper enforcing severity-by-intent and a dedup `toastId`; an ESLint rule prevents future direct react-toastify use.

**Architecture:** New `src/notify.ts` wraps react-toastify's `success`/`info`/`error`/`dismiss` with `toastId: id ?? message`. Five call sites across four files migrate to it. `no-restricted-imports` in `eslint.config.js` bans `react-toastify` everywhere except `src/notify.ts` and `src/App.tsx` (the container).

**Tech Stack:** React 19 + TypeScript + Vite, react-toastify, ESLint flat config (`tseslint.config`).

**Spec:** `docs/superpowers/specs/2026-09-02-uniform-toasts-design.md`

## Global Constraints

- Repo has NO test runner; verification per task = `npm run build` and `npm run lint` with **no errors beyond the 14 pre-existing baseline** (lint does not exit 0 on this repo).
- `ToastContainer` in `src/App.tsx` is untouched.
- `notify` accepts only `(message, id?)` — no options passthrough.
- Commits end with the trailer: `Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY`
- Paths relative to repo root `/Users/khvu91/Documents/GitHub/react-placeos-ui`.

---

### Task 1: `notify` helper + migrate all call sites

One task: the helper alone is dead code, and the migration is five mechanical
edits verified by the same build — a reviewer would accept or reject them
together.

**Files:**
- Create: `src/notify.ts`
- Modify: `src/components/tabbed/CameraPresetButton.tsx` (import line 2; calls at 41, 47)
- Modify: `src/components/prompts/ZoomPromptHost.tsx` (import line 7; calls at 59, 66)
- Modify: `src/components/SessionControls.tsx` (import line 4; call at 51–53)
- Modify: `src/hooks/useControlState.ts` (import line 3; call at ~279)
- Modify: `src/hooks/placeos.ts` (import line 5; call at 91; doc comment at 79)

**Interfaces:**
- Produces: `notify.success(message: string, id?: string)`, `notify.info(...)`, `notify.error(...)` — all return the react-toastify id; `notify.dismiss(id: string)`. Task 2 relies on the module path `src/notify.ts` being the only importer of react-toastify outside `src/App.tsx`.

- [ ] **Step 1: Create `src/notify.ts`**

```ts
// src/notify.ts
import { toast } from "react-toastify";

// All app toasts go through here: severity by intent, dedup id always
// (defaults to the message so repeat triggers update in place, not stack).
// Look/behavior comes only from the ToastContainer in App.tsx.
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

- [ ] **Step 2: CameraPresetButton — success semantics**

Replace line 2 `import { toast } from "react-toastify";` with `import { notify } from "../../notify";`, then:

```ts
// line 41
notify.success(`${camera.camera_name} ${preset} saved!`);
// line 47
notify.success(`${camera.camera_name} ${preset} recalled!`);
```

- [ ] **Step 3: ZoomPromptHost**

Replace line 7 `import { toast } from "react-toastify";` with `import { notify } from "../../notify";`, then:

```ts
// line 59
notify.info(message, promptKey);
// line 66
if (reminderActive) notify.dismiss("recording_disclaimer_needed");
```

- [ ] **Step 4: SessionControls**

Replace line 4 `import { toast } from "react-toastify";` with `import { notify } from "../notify";`, then lines 51–53:

```ts
      notify.error("No response from room controls", "control-timeout");
```

- [ ] **Step 5: useControlState**

Replace line 3 `import { toast } from "react-toastify";` with `import { notify } from "../notify";`, then (~line 279):

```ts
      notify.error(
        "The room is taking longer than expected — showing current status.",
      );
```

- [ ] **Step 6: placeos.ts**

Replace line 5 `import { toast } from "react-toastify";` with `import { notify } from "../notify";`; update the doc comment on line 79 to say `notify.error`; then line 91:

```ts
        notify.error(`Command failed: ${method}`);
```

- [ ] **Step 7: Verify**

Run: `grep -rn 'from "react-toastify"' src/` → expected: ONLY `src/App.tsx` and `src/notify.ts`.
Run: `npm run build && npm run lint` → build exits 0; lint shows exactly the 14 baseline errors.

- [ ] **Step 8: Commit**

```bash
git add src/notify.ts src/components/tabbed/CameraPresetButton.tsx src/components/prompts/ZoomPromptHost.tsx src/components/SessionControls.tsx src/hooks/useControlState.ts src/hooks/placeos.ts
git commit -m "refactor: route all toasts through notify helper (severity + dedup id)

Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY"
```

---

### Task 2: ESLint guard against direct react-toastify imports

**Files:**
- Modify: `eslint.config.js`

**Interfaces:**
- Consumes: `src/notify.ts` and `src/App.tsx` as the only allowed importers (Task 1's end state).

- [ ] **Step 1: Add the restriction + exemption blocks**

In `eslint.config.js`, inside the existing `files: ['**/*.{ts,tsx}']` object, add a `rules` key after `languageOptions`, and append a second config object after it:

```js
        rules: {
            'no-restricted-imports': ['error', {
                paths: [{
                    name: 'react-toastify',
                    message: 'Import { notify } from src/notify.ts instead — it enforces uniform toast semantics.',
                }],
            }],
        },
    },
    {
        files: ['src/notify.ts', 'src/App.tsx'],
        rules: {
            'no-restricted-imports': 'off',
        },
```

(The final file keeps the existing `globalIgnores` and closing `])`.)

- [ ] **Step 2: Prove the guard fires**

Temporarily add `import { toast } from "react-toastify";` to `src/components/SessionControls.tsx`, run `npm run lint` → expect a NEW error `no-restricted-imports` on that line. Remove the temporary import; run `npm run lint` again → back to exactly the 14 baseline errors.

- [ ] **Step 3: Verify clean state and commit**

Run: `npm run build` → exits 0.

```bash
git add eslint.config.js
git commit -m "chore: lint guard — react-toastify only importable via notify helper

Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY"
```

---

## Self-Review (done at planning time)

- Spec coverage: helper → Task 1 Step 1; all six call-site rows of the spec table → Task 1 Steps 2–6; ESLint guard incl. prove-it-fires check → Task 2; container untouched → no task touches App.tsx. No gaps.
- Placeholder scan: none.
- Type consistency: `notify.success/info/error(message, id?)` and `notify.dismiss(id)` used identically across both tasks.
