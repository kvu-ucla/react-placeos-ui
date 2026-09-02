# Support phone sourced from the `help` driver setting

**Date:** 2026-09-02
**Status:** Approved

## Goal

The AV support phone number shown in `SupportModal` and `SettingsModal` must come
from a PlaceOS system setting (owned by the meet.cr logic driver), not from a
hardcoded constant in `src/config.ts`. Room operators change the number in
backstage YAML; the panel picks it up live via the existing status binding — no
UI rebuild or redeploy.

## Decision: reuse the existing `help` setting (no driver change)

The UCLA meet.cr fork (`drivers/ucla/place/meet.cr`) already parses the `help:`
setting into `Help = Hash(String, HelpPage)` and exposes it as `self[:help]`
(merged across joined rooms) and `self[:local_help]`. `HelpPage` includes
`JSON::Serializable::Unmapped`, so extra YAML keys on a page survive the
parse → merge → re-serialize path and arrive in `room_status` intact.

Convention: a page keyed `support` carries the phone in unmapped keys.

```yaml
# system settings YAML (backstage)
help:
  support:
    title: "AV Support"
    content: ""
    phone: "+13105551234"          # tel: format
    phone_display: "(310) 555-1234"
```

Caution for the YAML author: `HelpPage.title` and `.content` are required
(non-nilable) — omitting either makes the whole `help` setting fail to parse,
wiping all help pages. `title` and at least `content: ""` must be present.

A dedicated `support_contact` setting/status was considered (cleaner typing) but
rejected because reusing `help` requires zero driver changes and no redeploy of
the driver.

## UI changes (react-placeos-ui)

1. **`useControlState.ts`** — add `bind("help", …)` alongside the existing
   System-module bindings. Run the value through a pure extraction function:

   ```ts
   extractSupportContact(help: unknown): { phone: string | null; display: string | null }
   ```

   - `help["support"].phone` must be a non-empty string, else `phone: null`.
   - `display` falls back to the raw `phone` string when `phone_display` is
     absent or not a string.
   - Any malformed shape (help not an object, no `support` key, etc.) → both
     null. Never throws.

   Expose `supportPhone` and `supportPhoneDisplay` on `ControlState`.

2. **`SupportModal.tsx`** — replace the `SUPPORT_PHONE` /
   `SUPPORT_PHONE_DISPLAY` imports with `supportPhone` / `supportPhoneDisplay`
   from `useControlContext()` (already used by this component). Rendering rule
   unchanged: phone row and `tel:` link only when a phone exists.

3. **`SettingsModal.tsx`** — same replacement via `useControlContext()`.

4. **`src/config.ts`** — delete `SUPPORT_PHONE` and `SUPPORT_PHONE_DISPLAY`.
   The driver setting is the single source of truth.

## Error handling

Binding never delivers (driver down, key absent) → fields stay null → phone UI
hidden, exactly today's behavior with the null constants. No loading state.

## Testing / verification

The repo has no test runner. Verification is:
- `npm run build` (`tsc -b` + vite) and `npm run lint` clean.
- Live: set the `help.support` keys on the nonprod system, confirm
  `room_status` carries them, confirm the phone renders in both modals and the
  `tel:` link is correct; remove the keys and confirm the row hides.

## Out of scope

- Rendering `help` page titles/content anywhere new.
- Email or other contact channels (the shape leaves room; not built now).
- Upstream `drivers/place/meet.cr` — untouched.
