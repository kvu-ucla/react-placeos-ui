# Support Phone From Driver Setting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The AV support phone in `SupportModal` and `SettingsModal` comes from the System module's `help` status binding (`help.support.phone` / `.phone_display`) instead of hardcoded constants in `src/config.ts`.

**Architecture:** `useControlState` (the hook behind `ControlStateProvider`) gains one more System-module status binding, `help`, whose value is run through a pure, throw-proof extraction function and exposed on `ControlState` as `supportPhone` / `supportPhoneDisplay`. Both modals read those via `useControlContext()`. `src/config.ts` is deleted. No driver changes — meet.cr already publishes `self[:help]`, and `HelpPage`'s `JSON::Serializable::Unmapped` passes the extra `phone`/`phone_display` YAML keys through.

**Tech Stack:** React 19 + TypeScript + Vite; PlaceOS `@placeos/ts-client` bindings via the project's `useBinder` helper.

**Spec:** `docs/superpowers/specs/2026-09-02-support-phone-from-driver-setting-design.md`

## Global Constraints

- Repo has NO test runner (no vitest/jest; `package.json` scripts are `dev`, `build`, `lint`, `preview`). Verification per task = `npm run build` (runs `tsc -b`) and `npm run lint`. Do not add a test framework.
- The extraction function must never throw, whatever shape arrives on the binding.
- Phone UI hidden whenever no phone is configured — identical to today's behavior with the null constants.
- `display` falls back to the raw `phone` string when `phone_display` is absent/blank, so `supportPhoneDisplay` is non-null exactly when `supportPhone` is.
- Commits end with the trailer: `Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY`
- All paths relative to repo root `/Users/khvu91/Documents/GitHub/react-placeos-ui`.

---

### Task 1: `help` binding + extraction in `useControlState`

**Files:**
- Modify: `src/hooks/useControlState.ts` (interfaces at lines 97–122, hook body at 124–195, return at 244–256)

**Interfaces:**
- Consumes: existing `useBinder(systemId, cb)` and `binder.listen(moduleAlias, name, cb)` from `src/hooks/placeos.ts`.
- Produces (Task 2 relies on these exact names):
  - `export interface SupportContact { phone: string | null; display: string | null }`
  - `export function extractSupportContact(help: unknown): SupportContact`
  - `ControlState.supportPhone: string | null`
  - `ControlState.supportPhoneDisplay: string | null`

- [ ] **Step 1: Add the `SupportContact` type and extraction function**

In `src/hooks/useControlState.ts`, directly above `export interface SystemState` (line 97), insert:

```ts
export interface SupportContact {
  phone: string | null;
  display: string | null;
}

// The `help` status is meet.cr's Hash(String, HelpPage); a page keyed
// "support" may carry unmapped `phone`/`phone_display` keys authored in the
// system settings YAML. Any malformed shape must resolve to nulls, never throw.
export function extractSupportContact(help: unknown): SupportContact {
  const none: SupportContact = { phone: null, display: null };
  if (typeof help !== "object" || help === null) return none;
  const support = (help as Record<string, unknown>).support;
  if (typeof support !== "object" || support === null) return none;
  const page = support as Record<string, unknown>;
  const phone =
    typeof page.phone === "string" && page.phone.trim() !== ""
      ? page.phone
      : null;
  if (!phone) return none;
  const display =
    typeof page.phone_display === "string" && page.phone_display.trim() !== ""
      ? page.phone_display
      : phone;
  return { phone, display };
}
```

- [ ] **Step 2: Add state, binding, and ControlState fields**

Three edits in the same file:

(a) In `export interface ControlState` (lines 108–122), after `volume?: number;` add:

```ts
  /** AV support contact from the System module's help["support"] page */
  supportPhone: string | null;
  supportPhoneDisplay: string | null;
```

(b) In the hook body, after `const [pendingPower, setPendingPower] = useState<PendingPower>(null);` (line 134) add:

```ts
  const [supportContact, setSupportContact] = useState<SupportContact>({
    phone: null,
    display: null,
  });
```

(c) In the `useBinder` callback, after `bind("selected_tab", () => {});` (line 192) add (uses `binder.listen` directly — `help` is not a `SystemState` key, so the `bind` helper doesn't fit):

```ts
      binder.listen(moduleAlias, "help", (val) => {
        setSupportContact(extractSupportContact(val));
      });
```

(d) In the return object (lines 244–256), after `connected,` add:

```ts
    supportPhone: supportContact.phone,
    supportPhoneDisplay: supportContact.display,
```

- [ ] **Step 3: Verify types and lint**

Run: `npm run build && npm run lint`
Expected: both exit 0. (`tsc -b` proves the new `ControlState` fields are supplied by the hook's return.)

- [ ] **Step 4: Sanity-check the extraction function's edge cases by eye**

Re-read `extractSupportContact` against this table (no runner exists to execute it, so this is a reviewed-by-inspection step; the shapes come from the spec):

| input | expected |
| --- | --- |
| `undefined` / `null` / `"x"` / `42` | `{phone: null, display: null}` |
| `{}` (no `support` key) | nulls |
| `{support: {title: "AV", content: ""}}` (no phone) | nulls |
| `{support: {phone: ""}}` or `{support: {phone: 5}}` | nulls |
| `{support: {phone: "+13105551234"}}` | `{phone: "+13105551234", display: "+13105551234"}` |
| `{support: {phone: "+13105551234", phone_display: "(310) 555-1234"}}` | `{phone: "+13105551234", display: "(310) 555-1234"}` |

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useControlState.ts
git commit -m "feat: expose support phone from System help binding

Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY"
```

---

### Task 2: Modals consume the binding; delete `src/config.ts`

Both modals must switch in the same task — deleting `src/config.ts` breaks their imports otherwise. Both render under `ControlStateProvider` (mounted in `MainView.tsx:34`; both modals mount from `Header.tsx:131-133`), so `useControlContext()` is safe.

**Files:**
- Modify: `src/components/SupportModal.tsx` (import at line 6, usage at 141, 153–154)
- Modify: `src/components/SettingsModal.tsx` (import at line 8, usage at 109–116)
- Delete: `src/config.ts` (its only two exports are the phone constants; verified no other importers)

**Interfaces:**
- Consumes from Task 1: `useControlContext()` now returns `supportPhone: string | null` and `supportPhoneDisplay: string | null`; `supportPhoneDisplay` is non-null exactly when `supportPhone` is.

- [ ] **Step 1: SupportModal**

Remove line 6:

```ts
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY } from "../config";
```

Change line 141 from:

```ts
  const { system } = useControlContext();
```

to:

```ts
  const { system, supportPhone, supportPhoneDisplay } = useControlContext();
```

Change the first `contacts` entry (lines 153–154) from:

```ts
      phone: SUPPORT_PHONE_DISPLAY,
      href: SUPPORT_PHONE ? `tel:${SUPPORT_PHONE}` : null,
```

to:

```ts
      phone: supportPhoneDisplay,
      href: supportPhone ? `tel:${supportPhone}` : null,
```

- [ ] **Step 2: SettingsModal**

Replace line 8:

```ts
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY } from "../config";
```

with:

```ts
import { useControlContext } from "../hooks/ControlStateContext.tsx";
```

Inside the component, after `useEscapeKey(onClose);` (line 19) add:

```ts
  const { supportPhone, supportPhoneDisplay } = useControlContext();
```

Change the conditional block (lines 109–116) from:

```tsx
                  {SUPPORT_PHONE && SUPPORT_PHONE_DISPLAY && (
                    <a
                      href={`tel:${SUPPORT_PHONE}`}
                      className="ml-2 font-bold hover:underline"
                    >
                      {SUPPORT_PHONE_DISPLAY}
                    </a>
                  )}
```

to:

```tsx
                  {supportPhone && (
                    <a
                      href={`tel:${supportPhone}`}
                      className="ml-2 font-bold hover:underline"
                    >
                      {supportPhoneDisplay}
                    </a>
                  )}
```

- [ ] **Step 3: Delete the config file**

```bash
git rm src/config.ts
```

- [ ] **Step 4: Verify no dangling references, types, lint**

Run: `grep -rn 'SUPPORT_PHONE\|from "../config"' src/ ; npm run build && npm run lint`
Expected: grep finds nothing (exit 1); build and lint exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A src/
git commit -m "feat: support phone read from help.support driver setting; drop config constants

Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY"
```

---

### Task 3: Live verification against the nonprod system

No code. Proves the end-to-end path from the spec's Testing section. Requires the `help.support` YAML on the nonprod system — the panel owner (Kenneth) adds it in backstage; coordinate before running.

**Files:** none.

**Interfaces:** consumes the deployed `feat/ui-polish` build on nonprod `control-av-dev` (branch `build/feat_ui-polish` builds on push).

- [ ] **Step 1: Author the setting in backstage** (owner action)

System settings YAML — merge into the existing `help:` block if one exists; `title` and `content` are REQUIRED keys (omitting either fails the whole `help` parse and wipes all help pages):

```yaml
help:
  support:
    title: "AV Support"
    content: ""
    phone: "+13105551234"          # real number, tel: format
    phone_display: "(310) 555-1234"
```

- [ ] **Step 2: Confirm the status carries the keys**

In the panel/browser debug console (same channel used for the `room_status` paste workflow), inspect the System module's `help` status and confirm `support.phone` and `support.phone_display` are present.

- [ ] **Step 3: Confirm on the UI**

Open Support modal: AV Technical Support row shows the display number, link href is `tel:+…`. Open Settings modal: the blue help banner shows the number as a link. Remove the `phone` key from the YAML → both hide the number again (banner text remains, no link).

---

## Self-Review (done at planning time)

- Spec coverage: extraction rules → Task 1; both modals + config deletion → Task 2; error handling (nulls hide UI) → Task 1 Step 1 + Task 2 conditionals; live verification incl. required-keys caution → Task 3. No gaps.
- Placeholder scan: none; every code step shows the code.
- Type consistency: `supportPhone`/`supportPhoneDisplay` names identical across Task 1 (d), Task 2 Steps 1–2; `SupportContact` only consumed inside the hook.
