# Join Cards Always Open + Sharing Key Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The two "Join from your device" cards render their instructions permanently (accordions removed, steps at text-lg), and the wireless card shows the live `sharing_key` from the ZoomZRC driver.

**Architecture:** Binding chain first (`useZoomRoom` → `ZoomContext.sharingKey`), then the card rewrite in `SessionControls.tsx` consumes it. Driver already publishes `sharing_key` (nulled on meeting end) — no driver work.

**Tech Stack:** React 19 + TypeScript, daisyUI classes removed in favor of plain Tailwind, existing `useBinder` listen pattern.

**Spec:** `docs/superpowers/specs/2026-09-03-join-cards-always-open-design.md`

## Global Constraints

- No test runner; verification = `npm run build` + `npm run lint` at the 14-error baseline.
- Session-controls section must not scroll (chunk-G invariant); overflow fallback is text-base steps, never restoring the accordion.
- Copy unchanged except as shown.
- Commits end with: `Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY`

---

### Task 1: `sharingKey` binding through the context

**Files:**
- Modify: `src/hooks/useZoomRoom.ts` (state block ~123–146; listens ~150–174; return memo 302–350)
- Modify: `src/hooks/ZoomContext.tsx` (interface ~29–33; value ~97–100)

**Interfaces:**
- Produces: `useZoomContext().sharingKey: string | null` (null when absent/blank/meeting over). Task 2 consumes exactly this.

- [ ] **Step 1: useZoomRoom state + listen + return**

After `const [health, setHealth] = useState<unknown>();` (line 133) add:

```ts
  const [sharingKey, setSharingKey] = useState<string | null>(null);
```

After `binder.listen(mod, "health", setHealth);` (line 173) add:

```ts
      binder.listen<string | null>(mod, "sharing_key", (val) =>
        setSharingKey(typeof val === "string" && val.trim() ? val : null),
      );
```

In the return memo, add `sharingKey,` after `health,` (line 309) and add `sharingKey,` to the dependency array after `health,` (line 333).

- [ ] **Step 2: ZoomContext interface + value**

In `ZoomContextValue`, after `participants?: ZrcParticipant[];` (line 32) add:

```ts
  /** Wireless sharing key while available, null when not sharing-capable */
  sharingKey: string | null;
```

In the value memo, after `participants: zoom.participants,` (line 99) add:

```ts
      sharingKey: zoom.sharingKey,
```

- [ ] **Step 3: Verify and commit**

Run: `npm run build && npm run lint` → build 0; lint at 14-error baseline.

```bash
git add src/hooks/useZoomRoom.ts src/hooks/ZoomContext.tsx
git commit -m "feat: bind ZoomZRC sharing_key through the zoom context

Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY"
```

---

### Task 2: Static join cards with sharing key

**Files:**
- Modify: `src/components/SessionControls.tsx` (join section, lines 201–277; component already destructures from `useZoomContext()` near the top — add `sharingKey`)

**Interfaces:**
- Consumes: `useZoomContext().sharingKey: string | null` from Task 1.

- [ ] **Step 1: Take `sharingKey` from context**

In the existing `useZoomContext()` destructure at the top of `SessionControls`, add `sharingKey`.

- [ ] **Step 2: Replace the join section (lines 202–277)**

```tsx
      <div id="zoom-join" className="grid grid-cols-2 gap-4">
        {/*Share Wirelessly*/}
        <div className="self-start rounded-2xl p-2 bg-white backdrop-blur-xl">
          <div className="p-4 font-semibold inline-flex">
            <img
              src={import.meta.env.BASE_URL + "zoom_logo.svg"}
              alt="zoom logo"
              className="h-16"
            />
            <div className="flex flex-col text-xl font-semibold text-[#3664DA] ml-4">
              Join wirelessly
              <div className="text-xl text-avit-grey-80 font-normal mt-2">
                Connect via Zoom to share your screen.
              </div>
            </div>
          </div>
          <div className="px-4 pb-3 text-lg font-normal leading-snug">
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Open the Zoom client application on the device you wish to
                present.
              </li>
              <li>
                Tap "Share Screen" and input the{" "}
                <span className="font-semibold">sharing key shown on the room display</span>.
              </li>
            </ol>
            {sharingKey && (
              <div className="mt-3 text-avit-grey-80">
                Sharing key:{" "}
                <span className="font-mono font-semibold text-2xl tracking-widest align-middle">
                  {sharingKey}
                </span>
              </div>
            )}
          </div>
        </div>

        {/*Share Local*/}
        <div className="self-start rounded-2xl p-2 bg-white backdrop-blur-xl">
          <div className="p-4 font-semibold inline-flex">
            <Icon
              className="text-[#3664DA]"
              icon="material-symbols:cable-rounded"
              width={64}
              height={64}
            ></Icon>
            <div className="flex flex-col text-xl font-semibold text-[#3664DA] ml-4">
              Connect with USB-C
              <div className="text-xl text-avit-grey-80 font-normal mt-2">
                Use a physical USB-C cable for direct connection.
              </div>
            </div>
          </div>
          <div className="px-4 pb-3 text-lg font-normal leading-snug">
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Connect one end of the USB-C or HDMI cable into your laptop.
              </li>
              <li>
                The system will detect your device and switch the display
                automatically
              </li>
            </ol>
          </div>
        </div>
      </div>
```

(Removed vs today: both `<input type="radio" name="zoom-join-accordion">`, `collapse collapse-arrow`, `collapse-title`/`collapse-content`, all `after:*` arrow utilities, the radio-pair comment blocks, `!pb-2`. Added: `rounded-2xl`, `p-4` header, `px-4 pb-3 text-lg` body, sharing-key row.)

- [ ] **Step 3: Verify and commit**

Run: `grep -n 'zoom-join-accordion\|collapse' src/components/SessionControls.tsx` → no matches.
Run: `npm run build && npm run lint` → build 0; lint at 14-error baseline.

```bash
git add src/components/SessionControls.tsx
git commit -m "feat: always-open join cards with live sharing key

Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY"
```

---

## Self-Review (done at planning time)

- Spec coverage: binding chain → Task 1; accordion removal, rounded-2xl/padding fidelity, text-lg steps, subtitle kept, key row with mono/2xl/tracking-widest → Task 2. Complete.
- Placeholder scan: none.
- Type consistency: `sharingKey: string | null` identical in hook, context, and consumption.
