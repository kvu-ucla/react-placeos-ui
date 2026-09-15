# UI Polish Batch 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix seven field-feedback items: tour touch targets, toast width, modal-frame scrolling, accordion toggling, camera-tab proportions, per-participant controls (audio/video/kick), and splash booking display.

**Architecture:** Three independent lanes, each executed in its own git worktree. Lane A (UI, `react-placeos-ui` @ `feat/ui-polish`) is pure React/Tailwind changes. Lane B (drivers, `kvu-ucla/drivers` @ `ucla-dev`) adds three ZRC driver methods and a converter skip rule. Lane C (wrapper, `zoom-zrc-sdk-wrapper` @ `main`) binds `MuteUserAudio` and adds one route. Lanes B and C are independent of each other and of A; UI task A7 uses driver method names fixed by the spec, so it does not wait for B's deploy (mic toggle 404s harmlessly via the existing error-toast path until the wrapper pod rolls).

**Tech Stack:** React 18 + Tailwind/daisyUI + @reactour/tour 3.8 + react-toastify 11 (Lane A); Crystal PlaceOS driver + DriverSpecs (Lane B); FastAPI + pybind11 (Lane C).

**Spec:** `docs/superpowers/specs/2026-09-14-ui-polish-batch-2-design.md`

## Global Constraints

- **Review gate:** every lane's push requires an independent Kiro-lane review verdict (APPROVE) on the diff first (`kiro-cli chat --trust-all-tools --model gpt-5.6-luna`). Momentum never waives it.
- **Worktrees:** Lane A in a worktree off `feat/ui-polish` (repo `/Users/khvu91/Documents/GitHub/react-placeos-ui`); Lane B off `origin/ucla-dev` (repo `/Users/khvu91/Documents/GitHub/drivers`); Lane C off `main` (repo `/Users/khvu91/Documents/zoom-zrc-sdk-wrapper`).
- **UI verification baseline:** `npm run build` must succeed; `npm run lint` must not add errors beyond the established baseline.
- **Crestron webview rules:** interactive elements that need transparent backgrounds are `div[role=button]`, never native `<button>` (see `src/components/Button.tsx` ghost comment). Box-shadows may drop on-panel; never rely on shadow alone.
- **Commit trailer (UI repo):** end commit messages with `Claude-Session: https://claude.ai/code/session_01J3wv4pBWptRndzH4qxWnaM`.
- **Ack ≠ completion (driver/UI):** wrapper command results are SDK acks; UI state changes only on the driver's roster/status refetch. No optimistic roster state.

---

# Lane A — UI (`react-placeos-ui`, worktree off `feat/ui-polish`)

### Task A1: Modal frame scroll (fixed chrome, content-pane-only scroll)

**Files:**
- Modify: `src/components/SettingsModal.tsx:44-46,71,96`
- Modify: `src/components/SupportModal.tsx:82,109,130`
- Modify: `src/components/tabbed/DisplayTab.tsx:102`
- Modify: `src/components/tabbed/ParticipantsTab.tsx:157-159`

**Interfaces:**
- Consumes: `.modal-frame` fixed sizing from `src/index.css` (unchanged).
- Produces: content panes that scroll internally; Tasks A4/A5/A7 rely on tab content being allowed to grow tall.

- [ ] **Step 1: SettingsModal — card and flex chain**

At line 44, replace the card className:

```tsx
        className="modal-box modal-pop modal-frame bg-white p-8 overflow-hidden flex flex-col rounded-lg"
```

At line 46, the empty pass-through wrapper joins the flex chain:

```tsx
        <div className="flex flex-col flex-1 min-h-0">
```

At line 71, the body row fills the frame:

```tsx
          <div className="flex mt-4 space-x-6 flex-1 min-h-0">
```

At line 96, only the content pane scrolls:

```tsx
            <div className="w-full space-y-6 flex-col justify-end items-center overflow-y-auto min-h-0">
```

- [ ] **Step 2: SupportModal — same treatment**

Line 82 card className:

```tsx
        className="modal-box modal-pop modal-frame bg-white p-8 overflow-hidden flex flex-col rounded-lg"
```

Line 109 body row:

```tsx
        <div className="flex mt-4 flex-1 min-h-0">
```

Line 130 content pane:

```tsx
          <div className="w-3/4 px-6 overflow-y-auto min-h-0">
```

- [ ] **Step 3: Remove now-redundant inner scroll regions**

`DisplayTab.tsx:102` — the accordion container loses its own scroll (single scroll surface per tab):

```tsx
      <div className="space-y-3">
```

`ParticipantsTab.tsx:157-159` — drop `max-h-[26rem] overflow-y-auto` and update the comment:

```tsx
            {/* Scrolling happens in the modal's content pane; this card just
                grows with the list */}
            <div className="border border-[#999] rounded-lg p-4">
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build succeeds; lint error count at baseline.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsModal.tsx src/components/SupportModal.tsx src/components/tabbed/DisplayTab.tsx src/components/tabbed/ParticipantsTab.tsx
git commit -m "fix: modal cards never scroll — content pane owns overflow"
```

### Task A2: Tour controls (labeled touch-sized navigation)

**Files:**
- Modify: `src/components/TourHost.tsx`

**Interfaces:**
- Consumes: `Button` from `src/components/Button.tsx` (variants `primary`/`outline`); `useTour` from `@reactour/tour`; `Icon` from `@iconify/react`.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add custom Navigation and Close components**

In `TourHost.tsx`, extend imports and add the two components above `TourHost`:

```tsx
import { TourProvider, useTour, type StepType } from "@reactour/tour";
import { Icon } from "@iconify/react";
import { Button } from "./Button";
import App from "../App";

// Reactour's stock controls are mouse-sized native <button>s (tiny arrows,
// 8px tappable dots, ~14px close X) — bad touch targets, and native buttons
// get skinned by the panel webview. These replace them wholesale; reactour
// keeps doing mask/positioning/step logic.
function TourNavigation() {
  const { currentStep, setCurrentStep, steps, setIsOpen } = useTour();
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  return (
    <div className="flex flex-col gap-5 mt-6">
      {/* Progress dots: indicators only, deliberately not tappable */}
      <div className="flex justify-center gap-2" aria-hidden="true">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${
              i === currentStep ? "bg-avit-blue" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          className={`min-h-14 min-w-32 px-8 text-xl ${isFirst ? "invisible" : ""}`}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            isLast
              ? setIsOpen(false)
              : setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
          }
          className="min-h-14 min-w-32 px-8 text-xl"
        >
          {isLast ? "Done" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function TourClose() {
  const { setIsOpen } = useTour();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Close tour"
      onClick={() => setIsOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(false);
        }
      }}
      className="absolute top-3 right-3 flex h-12 w-12 cursor-pointer select-none items-center justify-center text-gray-500"
    >
      <Icon
        icon="material-symbols:close-small-outline-rounded"
        width={40}
        height={40}
      />
    </div>
  );
}
```

- [ ] **Step 2: Wire the overrides into TourProvider**

Replace the `TourProvider` props (keep existing `steps`, `scrollSmooth`, `styles`):

```tsx
    <TourProvider
      steps={steps}
      scrollSmooth={false}
      components={{ Navigation: TourNavigation, Close: TourClose }}
      styles={{
        maskWrapper: (base) => ({
          ...base,
          position: "absolute", // relative to our fixed layer
          inset: 0,
          zIndex: 10000,
        }),
        popover: (base) => ({
          ...base,
          zIndex: 10001,
          maxWidth: 660,
          padding: 32,
          borderRadius: 16,
        }),
      }}
    >
```

- [ ] **Step 3: Verify in dev server**

Run: `npm run dev`, open the app, tap Tour in the header.
Expected: Back hidden on step 1; Next advances; Done on the last step closes; ✕ closes from any step; dots are not tappable.

- [ ] **Step 4: Build + lint, then commit**

Run: `npm run build && npm run lint` — baseline clean.

```bash
git add src/components/TourHost.tsx
git commit -m "feat: touch-sized labeled tour navigation (Back/Next/Done, big close)"
```

### Task A3: Toast width and typography

**Files:**
- Modify: `src/index.css` (append near the un-layered `nav-btn` fallback rules, NOT inside `@layer` — layered utilities can silently drop in the panel webview)

**Interfaces:**
- Consumes: react-toastify 11 CSS custom property `--toastify-toast-width` and `.Toastify__toast-body` class.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the override block**

```css
/* react-toastify sizing: the stock 320px container smushes long messages
   (e.g. the recording-disclaimer info toast) into 3-4 cramped lines.
   Panel-scale width + type so the longest current message wraps in ≤2
   comfortable lines. Un-layered on purpose — see nav-btn note above. */
:root {
  --toastify-toast-width: 440px;
}
.Toastify__toast-body {
  font-size: 1.125rem;
  line-height: 1.45;
}
```

- [ ] **Step 2: Verify**

Run: `npm run dev`; trigger any toast (e.g. temporary `notify.info("Recording needs a disclaimer acknowledgement on the Zoom Room.")` from console or a dev button — do not commit the trigger).
Expected: toast is 440px wide, message wraps in ≤2 lines, icon/close not crowded.

- [ ] **Step 3: Build + lint, then commit**

```bash
git add src/index.css
git commit -m "fix: widen toasts to panel scale so long messages breathe"
```

### Task A4: Display accordions — tap to toggle, one open

**Files:**
- Modify: `src/components/tabbed/DisplayTab.tsx`

**Interfaces:**
- Consumes: A1's single-scroll-surface change (accordion list may grow tall).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Replace radio-input collapse with controlled state**

Add state at the top of `DisplayTab` (beside the existing `pending` state):

```tsx
  // daisyUI collapse driven by React state instead of hidden radio inputs:
  // radios can't be unchecked by clicking, which made an open accordion
  // impossible to close. Exclusive: at most one display open.
  const [openDisplay, setOpenDisplay] = useState<string | null>(null);
```

In the accordion map, remove the line:

```tsx
              <input type="radio" name="display-accordion" className="collapse-toggle" />
```

Change the row wrapper to a controlled collapse:

```tsx
            <div
              key={dispId}
              className={`collapse collapse-arrow border border-[#999] ${
                openDisplay === dispId ? "collapse-open" : "collapse-close"
              }`}
            >
```

Make the header the toggle (replaces the existing `collapse-title` div's opening tag; children unchanged):

```tsx
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setOpenDisplay(openDisplay === dispId ? null : dispId)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenDisplay(openDisplay === dispId ? null : dispId);
                  }
                }}
                className="collapse-title text-xl font-medium flex items-center gap-2 cursor-pointer select-none"
              >
```

Leave the mute button and source buttons inside `collapse-content` untouched (their clicks never reach the header).

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`, Settings → Displays.
Expected: tap opens a display (closing any other); tapping the open one closes it; mute/source buttons inside do not toggle the accordion.

- [ ] **Step 3: Build + lint, then commit**

```bash
git add src/components/tabbed/DisplayTab.tsx
git commit -m "fix: display accordions toggle on tap, exclusive open via controlled state"
```

### Task A5: Camera tab proportions

**Files:**
- Modify: `src/components/tabbed/CameraTab.tsx:13-15,72-115`

**Interfaces:**
- Consumes: A1 (long preset lists scroll with the content pane).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Scale the controller up and update its comment**

Replace lines 8–15:

```tsx
// CameraController's natural rendered size (zoom column + joystick + its own
// padding/gaps). A transform scale inside a fixed-size box keeps the pointer
// math exact — getBoundingClientRect reflects transforms — so joystick/zoom
// behavior is untouched. 0.85 makes the controls the dominant element of the
// row (field feedback: they were half-size and dwarfed by the preset grid);
// tune on-glass if the tab feels cramped.
const CONTROLLER_NATURAL_W = 528;
const CONTROLLER_NATURAL_H = 448;
const CONTROLLER_SCALE = 0.85;
```

- [ ] **Step 2: Controls dominant, presets a single column**

Replace the side-by-side row (lines 72–115) content wrappers — controls side gets `flex-1`, presets a fixed narrow column:

```tsx
            {/* Pan/tilt/zoom + presets side by side: controls dominate,
                presets are a single column (field feedback) */}
            <div className="border border-[#999] rounded-lg p-4 flex items-start gap-6">
                <div className="flex-1">
                    <h4 className="font-semibold mb-2">Pan, tilt &amp; zoom</h4>
                    <div
                        style={{
                            width: CONTROLLER_NATURAL_W * CONTROLLER_SCALE,
                            height: CONTROLLER_NATURAL_H * CONTROLLER_SCALE,
                        }}
                    >
                        <div
                            className="origin-top-left"
                            style={{
                                transform: `scale(${CONTROLLER_SCALE})`,
                                width: CONTROLLER_NATURAL_W,
                                height: CONTROLLER_NATURAL_H,
                            }}
                        >
                            <CameraController
                                id={system_id!}
                                activeCamera={{mod: selectedCamera!}}
                            ></CameraController>
                        </div>
                    </div>
                </div>

                {/* Camera Presets — one per row; a long list grows the tab and
                    scrolls with the modal content pane */}
                <div className="w-[280px] shrink-0">
                    <h4 className="font-semibold mb-2">Camera presets</h4>
                    {selectedCam?.presets ? (
                        <div className="flex flex-col gap-2">
                            {selectedCam.presets.map((preset) => (
                                <CameraPresetButton
                                    key={preset}
                                    preset={preset}
                                    system_id={system_id!}
                                    selectedCamera={selectedCamera!}
                                    cams={cams}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
```

(`CameraPresetButton` is already `w-full`; no change needed there.)

- [ ] **Step 3: Verify in dev server**

Run: `npm run dev`, Settings → Camera.
Expected: joystick/zoom visibly larger than before and larger than the preset column; presets stack one per row at 280px; tab scrolls in the content pane if it overflows; joystick pointer behavior unchanged (drag all directions).

- [ ] **Step 4: Build + lint, then commit**

```bash
git add src/components/tabbed/CameraTab.tsx
git commit -m "fix: camera controls dominate the tab; presets become a single column"
```

### Task A6: Splash booking display (NaN countdown + upcoming visibility)

**Files:**
- Modify: `src/components/ClassInfoCard.tsx` (substantial rewrite of the logic; card markup shape preserved)
- Modify: `src/components/SplashScreen.tsx:8-16,43-50`
- Modify: `src/hooks/ZoomContext.tsx` (expose `bookings`)

**Interfaces:**
- Consumes: `Booking` (`{ title, event_start, event_end, id, creator }`, unix seconds) from `useZoomRoom.ts`; `currentMeeting`/`nextMeeting`/`bookings` via `useZoomContext()`.
- Produces: `bookings?: Booking[]` added to the Zoom context value (already tracked in `useZoomRoom` state, currently unexposed).

- [ ] **Step 1: Expose `bookings` through ZoomContext**

In `src/hooks/ZoomContext.tsx`: add `bookings?: Booking[];` to the context type beside `currentMeeting`/`nextMeeting` (lines 42–43) and `bookings: zoom.bookings,` to the provider value beside lines 114–115. In `src/hooks/useZoomRoom.ts`, add `bookings,` to the returned object beside `currentMeeting, nextMeeting` (lines 323–324 and 349–350) if not already returned.

- [ ] **Step 2: Rewrite ClassInfoCard's time logic**

Replace the component logic (markup skeleton stays — same card, same rows):

```tsx
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useZoomContext } from "../hooks/ZoomContext";
import type { Booking } from "../hooks/useZoomRoom";

// All times derive from the Booking's raw unix seconds. The previous version
// formatted event_start into a locale string and re-parsed it, which rendered
// "Starts in NaN minutes" while the card hydrated and misread times near
// midnight.
function localeTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function statusLine(meeting: Booking, inProgress: boolean, nowMs: number): string {
  if (inProgress) return `Started at ${localeTime(meeting.event_start)}`;
  const diffMins = Math.round((meeting.event_start * 1000 - nowMs) / 60000);
  if (diffMins <= 0) return "Starting now";
  if (diffMins === 1) return "Starts in 1 minute";
  if (diffMins < 60) return `Starts in ${diffMins} minutes`;
  const start = new Date(meeting.event_start * 1000);
  const sameDay = start.toDateString() === new Date(nowMs).toDateString();
  return sameDay
    ? `Starts at ${localeTime(meeting.event_start)}`
    : `Starts ${start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}`;
}

export function ClassInfoCard() {
  const { nextMeeting, currentMeeting, bookings, sharingKey } = useZoomContext();

  // The card shows the meeting in progress, else the next upcoming one —
  // an upcoming class is visible (and startable) before its start time.
  const displayed = currentMeeting ?? nextMeeting;
  const inProgress = currentMeeting != null;

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    // minute-resolution text; 15s keeps it fresh without per-second renders
    const interval = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // The meeting after the displayed one (never repeat the displayed meeting
  // in the "Upcoming" slot). bookings is sorted by event_start.
  const upcomingAfter = displayed
    ? bookings?.find((b) => b.event_start > displayed.event_start)
    : undefined;
```

Card body (replaces the old `meetingDetails`/`countdown`/`upcoming` rendering; `noMeeting` becomes `displayed == null`):

```tsx
  return (
    <div className="flex flex-col justify-between items-center card bg-white p-4 rounded shadow w-full max-w-[620px] text-center h-[300px]">
      {displayed ? (
        <>
          <div className="text-2xl flex items-center justify-center gap-2 tabular-nums">
            <Icon
              icon="material-symbols:schedule-outline-rounded"
              width={48}
              height={48}
            ></Icon>
            <span>{inProgress ? "Current Class:" : "Next Class:"}</span>
            <strong>{localeTime(displayed.event_start)}</strong>
            <span className="text-xs mx-2">●</span>
            <div className="text-blue-600">
              {statusLine(displayed, inProgress, nowMs)}
            </div>
          </div>
          <div>
            <h1 className="mt-4 text-3xl font-bold">{displayed.title}</h1>
            {displayed.creator ? (
              <p className="text-xl">{displayed.creator}</p>
            ) : null}
          </div>
          <div className="mt-8 mb-8 text-xl flex items-center justify-center gap-2 tabular-nums">
            <span>Ends at</span>
            <span>{localeTime(displayed.event_end)}</span>
            {upcomingAfter && (
              <>
                <span className="text-xs mx-2">●</span>
                <div>Upcoming {localeTime(upcomingAfter.event_start)}</div>
              </>
            )}
          </div>

          {sharingKey && (
            <div className="flex items-center justify-center gap-2">
              <div className="font-semibold">Sharing Key: {sharingKey}</div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 h-[300px] p-6">
          <span className="text-2xl">
            No classes are currently scheduled. You can still start a session.
          </span>
          {sharingKey && (
            <div className="font-semibold">Sharing Key: {sharingKey}</div>
          )}
        </div>
      )}
    </div>
  );
}
```

Delete `getCountdownToTime`, `getLocaleTime`, the `meetingDetails` state, and all three old `useEffect`s.

- [ ] **Step 3: SplashScreen starts the displayed meeting**

```tsx
  const { startInstantMeeting, joinMeeting, currentMeeting, nextMeeting } =
    useZoomContext();
  // Match ClassInfoCard: an upcoming class is startable before its start time
  // (join-by-number works pre-start for the host room)
  const meetingToStart = currentMeeting ?? nextMeeting;
  const noMeeting = meetingToStart == null;

  function startScheduled() {
    togglePower();
    if (meetingToStart) {
      joinMeeting(meetingToStart.id);
    }
  }
```

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev` against the dev system.
Expected: with an upcoming booking, the card shows it pre-start with a real countdown (never NaN, from first paint); "Start Scheduled Class" is enabled; with a booking in progress the card shows "Current Class / Started at"; with none, the no-classes card.

- [ ] **Step 5: Build + lint, then commit**

```bash
git add src/components/ClassInfoCard.tsx src/components/SplashScreen.tsx src/hooks/ZoomContext.tsx src/hooks/useZoomRoom.ts
git commit -m "fix: splash shows upcoming class pre-start; countdown from raw timestamps (kills NaN)"
```

### Task A7: Per-participant controls in ParticipantsTab

**Files:**
- Modify: `src/components/tabbed/ParticipantsTab.tsx`

**Interfaces:**
- Consumes: driver methods `mute_participant_audio(user_id, mute)`, `mute_participant_video(user_id, mute)`, `expel([user_ids])` (Lane B Task B1 — names fixed by spec; safe to build against before deploy). Roster fields `audio_status.is_muted`, `video_status.sending`, `is_myself`, `is_host`, `is_cohost` from `ZrcParticipant`.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add active-row action state and handlers**

Inside `ParticipantsTab` (beside the existing waiting-room state):

```tsx
    type ActiveAction =
        | { kind: "audio"; targetMuted: boolean }
        | { kind: "video"; targetSending: boolean }
        | { kind: "kick" };

    // Same discipline as admit/deny: pending until the roster refetch shows
    // the new state (ack precedes the change); failure clears (retryable).
    const [activePending, setActivePending] = useState<Map<string, ActiveAction>>(
        new Map(),
    );
    // Two-tap remove: first tap arms, second tap fires; disarms after 4s
    const [armedKick, setArmedKick] = useState<string | null>(null);
    useEffect(() => {
        if (armedKick == null) return;
        const t = setTimeout(() => setArmedKick(null), 4000);
        return () => clearTimeout(t);
    }, [armedKick]);

    const actOnActive = async (
        participant: ZrcParticipant,
        action: ActiveAction,
    ) => {
        const id = admitId(participant.user_id);
        if (id == null) return;
        const key = String(participant.user_id);
        setActivePending((prev) => new Map(prev).set(key, action));
        try {
            if (action.kind === "audio") {
                await execute(zoomMod, "mute_participant_audio", [id, action.targetMuted]);
            } else if (action.kind === "video") {
                await execute(zoomMod, "mute_participant_video", [id, !action.targetSending]);
            } else {
                await execute(zoomMod, "expel", [[id]]);
            }
        } catch {
            // execute already toasts; make the row retryable
            setActivePending((prev) => {
                const next = new Map(prev);
                next.delete(key);
                return next;
            });
        }
    };
```

- [ ] **Step 2: Clear pending from roster truth**

Add alongside the existing waiting-room prune effect:

```tsx
    // Roster refresh is the source of truth for active-row actions too:
    // clear an action once the observed state matches (or the row is gone)
    useEffect(() => {
        setActivePending((prev) => {
            const next = new Map<string, ActiveAction>();
            for (const [key, action] of prev) {
                const row = activeParticipants.find(
                    (p) => String(p.user_id) === key,
                );
                if (!row) continue; // kicked or left — done
                if (
                    action.kind === "audio" &&
                    row.audio_status?.is_muted === action.targetMuted
                )
                    continue;
                if (
                    action.kind === "video" &&
                    row.video_status?.sending === action.targetSending
                )
                    continue;
                if (action.kind === "kick") {
                    next.set(key, action); // still present — keep pending
                    continue;
                }
                next.set(key, action);
            }
            return next.size === prev.size ? prev : next;
        });
        setArmedKick((current) =>
            current != null &&
            activeParticipants.some((p) => String(p.user_id) === current)
                ? current
                : null,
        );
    }, [activeParticipants]);
```

- [ ] **Step 3: Render controls on active rows**

`ParticipantRow` (module-scope memo) gains props and a controls cluster. Replace the memo component:

```tsx
const ParticipantRow = memo(function ParticipantRow({
    participant,
    pending,
    armed,
    onMuteAudio,
    onMuteVideo,
    onKick,
}: {
    participant: ZrcParticipant;
    pending?: "audio" | "video" | "kick";
    armed: boolean;
    onMuteAudio: () => void;
    onMuteVideo: () => void;
    onKick: () => void;
}) {
    const muted = participant.audio_status?.is_muted === true;
    const sending = participant.video_status?.sending === true;
    const isSelf = participant.is_myself === true;
    const protectedRow =
        participant.is_host === true || participant.is_cohost === true;
    const busy = pending != null;
    return (
        <div className="flex items-center justify-between py-4 px-0">
            {/* User info section */}
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {displayName(participant).charAt(0).toUpperCase()}
                    </div>
                    {participant.is_raising_hand && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-xs">✋</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-medium text-base">{displayName(participant)}</span>
                    {participant.is_host && (
                        <span className="text-xs text-gray-500">(Host)</span>
                    )}
                    {participant.is_cohost && (
                        <span className="text-xs text-gray-500">(Co-host)</span>
                    )}
                </div>
            </div>

            {/* Host controls: the room's own row manages itself elsewhere */}
            {!isSelf && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        disabled={busy}
                        onClick={onMuteAudio}
                        aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                        className="min-h-12 min-w-12 px-3"
                    >
                        <Icon
                            icon={
                                muted
                                    ? "material-symbols:mic-off-rounded"
                                    : "material-symbols:mic-rounded"
                            }
                            width={28}
                            height={28}
                        />
                    </Button>
                    <Button
                        variant="outline"
                        disabled={busy}
                        onClick={onMuteVideo}
                        aria-label={sending ? "Stop video" : "Start video"}
                        className="min-h-12 min-w-12 px-3"
                    >
                        <Icon
                            icon={
                                sending
                                    ? "material-symbols:videocam-rounded"
                                    : "material-symbols:videocam-off-rounded"
                            }
                            width={28}
                            height={28}
                        />
                    </Button>
                    {!protectedRow && (
                        <Button
                            variant={armed ? "primary" : "outline"}
                            disabled={busy}
                            onClick={onKick}
                            className="min-h-12 px-4 text-base"
                        >
                            {pending === "kick"
                                ? "Removing…"
                                : armed
                                  ? "Confirm?"
                                  : "Remove"}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
});
```

Add `import { Icon } from "@iconify/react";` to the file's imports.

- [ ] **Step 4: Wire the rows**

Replace the active-participants map:

```tsx
                {activeParticipants.map((participant, index) => {
                    const key = String(participant.user_id);
                    const action = activePending.get(key);
                    return (
                        <div key={key} className="relative">
                            <ParticipantRow
                                participant={participant}
                                pending={action?.kind}
                                armed={armedKick === key}
                                onMuteAudio={() =>
                                    actOnActive(participant, {
                                        kind: "audio",
                                        targetMuted:
                                            participant.audio_status?.is_muted !== true,
                                    })
                                }
                                onMuteVideo={() =>
                                    actOnActive(participant, {
                                        kind: "video",
                                        targetSending:
                                            participant.video_status?.sending !== true,
                                    })
                                }
                                onKick={() => {
                                    if (armedKick === key) {
                                        setArmedKick(null);
                                        actOnActive(participant, { kind: "kick" });
                                    } else {
                                        setArmedKick(key);
                                    }
                                }}
                            />
                            {index < activeParticipants.length - 1 && (
                                <div className="h-px bg-gray-200"></div>
                            )}
                        </div>
                    );
                })}
```

- [ ] **Step 5: Verify in dev server**

Run: `npm run dev`; join the dev room's meeting from a second Zoom client.
Expected: the second client's row shows mic/camera/Remove; toggles flip after the roster refresh (buttons disabled while pending); Remove arms to "Confirm?" then expels on second tap, disarms after 4s if untouched; the room's own row shows no controls; a host row shows no Remove. (Audio mute will surface an error toast until the Lane C wrapper pod rolls — expected, note it in the review.)

- [ ] **Step 6: Build + lint, then commit**

```bash
git add src/components/tabbed/ParticipantsTab.tsx
git commit -m "feat: per-participant mic/camera mute and two-tap remove in participants tab"
```

### Task A8: Lane A review + push

- [ ] **Step 1:** Run the Kiro lane on the full Lane A diff (`git diff origin/feat/ui-polish...HEAD`): `kiro-cli chat --trust-all-tools --model gpt-5.6-luna`. Require an explicit APPROVE verdict line; address CHANGES REQUESTED items first.
- [ ] **Step 2:** Push: `git push origin feat/ui-polish` (from the worktree branch, merge/rebase onto `feat/ui-polish` per worktree flow). CI builds `build/feat_ui-polish` → nonprod `control-av-dev`.

---

# Lane B — Drivers (`kvu-ucla/drivers`, worktree off `origin/ucla-dev`)

### Task B1: ZRC driver per-participant methods

**Files:**
- Modify: `drivers/zoom/zoom_zrc.cr` (after `send_to_waiting_room`, before the Utility section)
- Test: `drivers/zoom/zoom_zrc_spec.cr` (after the deny/admit tests, ~line 1200)

**Interfaces:**
- Consumes: wrapper routes `POST /audio/mute-user` (Lane C — deploys later; method 404s until then), `POST /video/mute-user`, `POST /participants/expel-multiple` (both live).
- Produces: `mute_participant_audio(user_id : Int32, mute : Bool = true)`, `mute_participant_video(user_id : Int32, mute : Bool = true)`, `expel(user_ids : Array(Int32))` — exact names Task A7 calls.

- [ ] **Step 1: Write failing specs**

Append to `zoom_zrc_spec.cr`, following the deny test pattern exactly (same mock-driver context):

```crystal
  it "mutes a participant's audio via the wrapper's mute-user route" do
    result = exec(:mute_participant_audio, 16782336, true)

    expect_http_request do |request, response|
      request.method.should eq("POST")
      request.path.should eq("/api/rooms/room-1/audio/mute-user")
      request.query_params["user_id"].should eq("16782336")
      request.query_params["mute"].should eq("true")
      response.status_code = 200
      response << %({"room_id":"room-1","user_id":16782336,"mute":true,"result":0,"success":true})
    end

    result.get.should eq(JSON.parse(%({"room_id":"room-1","user_id":16782336,"mute":true,"result":0,"success":true})))
  end

  it "unmutes a participant's video via the wrapper's mute-user route" do
    result = exec(:mute_participant_video, 16782336, false)

    expect_http_request do |request, response|
      request.method.should eq("POST")
      request.path.should eq("/api/rooms/room-1/video/mute-user")
      request.query_params["user_id"].should eq("16782336")
      request.query_params["mute"].should eq("false")
      response.status_code = 200
      response << %({"room_id":"room-1","user_id":16782336,"mute":false,"result":0,"success":true})
    end

    result.get.should eq(JSON.parse(%({"room_id":"room-1","user_id":16782336,"mute":false,"result":0,"success":true})))
  end

  it "expels in-meeting participants via expel-multiple, returning the ack without touching status" do
    roster_before = JSON.parse(%({"participants":[{"user_id":16782336,"user_name":"Kenneth","is_in_waiting_room":false}],"count":1}))
    status[:participants] = roster_before
    result = exec(:expel, [16782336])

    expect_http_request do |request, response|
      request.method.should eq("POST")
      request.path.should eq("/api/rooms/room-1/participants/expel-multiple")
      body = JSON.parse(request.body.not_nil!)
      body.should eq(JSON.parse(%({"user_ids":[16782336]})))
      response.status_code = 200
      response << %({"room_id":"room-1","user_ids":[16782336],"count":1,"result":0,"success":true})
    end

    result.get.should eq(JSON.parse(%({"room_id":"room-1","user_ids":[16782336],"count":1,"result":0,"success":true})))
    status[:participants].should eq(roster_before)
  end

  it "rejects a failed participant-audio-mute ack" do
    result = exec(:mute_participant_audio, 16782336, true)

    expect_http_request do |request, response|
      request.path.should eq("/api/rooms/room-1/audio/mute-user")
      response.status_code = 200
      response << %({"room_id":"room-1","result":11,"success":false})
    end

    expect_raises(PlaceOS::Driver::RemoteException, /mute participant audio failed/) do
      result.get
    end
  end
```

- [ ] **Step 2: Run specs to verify they fail**

Run (repo root): `./harness spec drivers/zoom/zoom_zrc_spec.cr` (or the repo's documented spec command — `crystal spec` via the harness container).
Expected: FAIL — `undefined method 'mute_participant_audio'` (and the other two).

- [ ] **Step 3: Implement the three methods**

Insert into `zoom_zrc.cr` after `send_to_waiting_room` (before the Utility banner):

```crystal
  # Per-participant audio mute (host privilege; SDK MuteUserAudio). Same
  # ack-only contract as the waiting-room verbs: the actual state change
  # surfaces via OnMuteUserAudioNotification -> coalesced roster refetch.
  def mute_participant_audio(user_id : Int32, mute : Bool = true) : JSON::Any
    response = post(
      "/api/rooms/#{@room_id}/audio/mute-user",
      params: {"user_id" => user_id.to_s, "mute" => mute.to_s},
      headers: JSON_HEADERS
    )
    parse_command_response(response, "#{mute ? "mute" : "unmute"} participant audio")
  end

  # Per-participant video mute (host privilege; SDK MuteUserVideo).
  def mute_participant_video(user_id : Int32, mute : Bool = true) : JSON::Any
    response = post(
      "/api/rooms/#{@room_id}/video/mute-user",
      params: {"user_id" => user_id.to_s, "mute" => mute.to_s},
      headers: JSON_HEADERS
    )
    parse_command_response(response, "#{mute ? "mute" : "unmute"} participant video")
  end

  # Remove participants from the meeting (SDK ExpelUsers — the same wrapper
  # route deny_from_waiting_room uses; expel acts on any participant, waiting
  # or in-meeting). Kept separate so in-meeting callers aren't invoking a
  # waiting-room-named method; deny_from_waiting_room is unchanged for
  # existing consumers.
  def expel(user_ids : Array(Int32)) : JSON::Any
    body = {user_ids: user_ids}.to_json
    response = post("/api/rooms/#{@room_id}/participants/expel-multiple", body: body, headers: JSON_HEADERS)
    parse_command_response(response, "expel participants")
  end
```

- [ ] **Step 4: Run specs to verify they pass**

Run: the same spec command.
Expected: PASS (all new tests; no existing test regressions).

- [ ] **Step 5: Commit**

```bash
git add drivers/zoom/zoom_zrc.cr drivers/zoom/zoom_zrc_spec.cr
git commit -m "feat(zoom/zrc): per-participant audio/video mute + expel"
```

### Task B2: Booking converter skips instant meetings

**Files:**
- Modify: `drivers/ucla/zoom/booking_converter.cr` (ZRCMeeting struct + skip in `expose_bookings`)
- Modify: `drivers/ucla/zoom/booking_converter_readme.md` (skip policy)
- Test: `drivers/ucla/zoom/booking_converter_spec.cr`

**Interfaces:**
- Consumes: wrapper meetings-list field `is_instant_meeting` (snake_case REST) / `isInstantMeeting` (camelCase push — already handled by the converter's underscore normalization).
- Produces: `current_booking`/`next_booking` never contain instant meetings (Task A6's splash relies on this).

- [ ] **Step 1: Extend the spec with a started-instant fixture**

In `booking_converter_spec.cr`, add to `rest_meetings` (the existing instant entry has blank times; this one has REAL times — the case that leaks today):

```crystal
    {
      "zoom_meeting_item_type": 1,
      "meeting_number": "444555666",
      "meeting_name": "Started Instant Meeting",
      "start_time": "#{current_start.to_rfc3339}",
      "end_time": "#{current_end.to_rfc3339}",
      "is_instant_meeting": true
    }
```

The existing assertions (`bookings.size.should eq 2`, current/next booking identity) now double as the regression check: without the fix this entry becomes a third booking and steals `current_booking`.

- [ ] **Step 2: Run the spec to verify it fails**

Run: `./harness spec drivers/ucla/zoom/booking_converter_spec.cr`
Expected: FAIL — bookings size 3, or `current_booking` is "Started Instant Meeting".

- [ ] **Step 3: Implement the skip**

In the `ZRCMeeting` struct, add beside `is_all_day_event`:

```crystal
    getter is_instant_meeting : Bool?

    def instant? : Bool
      is_instant_meeting || false
    end
```

In `expose_bookings`, before the `unless number && starts_at && ends_at` check:

```crystal
      # A *started* instant meeting appears in the list with real times, so
      # the blank-times skip below doesn't catch it; instant meetings are
      # never calendar bookings regardless of their times.
      if meeting.instant?
        logger.debug { "skipping instant meeting entry: #{meeting.name}" }
        next
      end
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: same command. Expected: PASS.

- [ ] **Step 5: Update the readme skip policy**

In `booking_converter_readme.md`, replace the blank-times sentence in "Skip policy" with:

```markdown
Entries flagged `is_instant_meeting` are skipped regardless of their times — a *started* instant meeting carries real start/end times but is never a calendar booking. Entries with blank/unparseable times are also skipped. Each skip logs.
```

- [ ] **Step 6: Commit**

```bash
git add drivers/ucla/zoom/booking_converter.cr drivers/ucla/zoom/booking_converter_spec.cr drivers/ucla/zoom/booking_converter_readme.md
git commit -m "fix(ucla/booking_converter): skip instant meetings even when they carry times"
```

### Task B3: Lane B review + push

- [ ] **Step 1:** Kiro-lane review on the Lane B diff (`git diff origin/ucla-dev...HEAD`); require APPROVE.
- [ ] **Step 2:** Push to `origin/ucla-dev`; recompile/redeploy the ZoomZRC and Bookings modules in Backstage from the new head (owner does the Backstage step if agent lacks access).

---

# Lane C — Wrapper (`zoom-zrc-sdk-wrapper`, worktree off `main`)

### Task C1: Bind MuteUserAudio + `/audio/mute-user` route

**Files:**
- Modify: `bindings/zrc_bindings.cpp` (IMeetingAudioHelper class, ~line 2264)
- Modify: `generator/templates/zrc_bindings.cpp` (same class block — keep template and generated file in sync; verify with `grep -n "UpdateMyAudioStatus" generator/templates/zrc_bindings.cpp`)
- Modify: `service/controllers/meetings.py` (after `/audio/unmute`, ~line 296)
- Test: the repo's route-registration test module (`test_unit_routes.py` pattern — add beside existing route tests)

**Interfaces:**
- Consumes: SDK `IMeetingAudioHelper::MuteUserAudio(int32_t userID, bool mute)` (verified present in `include/ServiceComponents/IMeetingAudioHelper.h:308`).
- Produces: `POST /api/rooms/{room_id}/audio/mute-user?user_id=<int>&mute=<bool>` — the route Lane B's `mute_participant_audio` calls.

- [ ] **Step 1: Add the binding (both files)**

In `bindings/zrc_bindings.cpp` AND `generator/templates/zrc_bindings.cpp`, in the `IMeetingAudioHelper` class_ block:

```cpp
        .def("UpdateMyAudioStatus", &IMeetingAudioHelper::UpdateMyAudioStatus)
        .def("MuteUserAudio", &IMeetingAudioHelper::MuteUserAudio)
```

- [ ] **Step 2: Add the route**

In `service/controllers/meetings.py`, after `unmute_audio` (mirrors `meeting_video.py`'s `/mute-user` shape; idempotent-success set matches `_set_audio_muted`'s driver-parity semantics):

```python
@router.post("/audio/mute-user")
async def mute_user_audio(
    room_id: str,
    user_id: int,
    mute: bool,
    room_manager = Depends(lambda: get_room_manager()),
):
    """Mute or unmute a specific participant's audio (host privilege)."""
    room_service = room_manager.get_room_service(room_id)
    if not room_service:
        raise HTTPException(status_code=404, detail="Room not found")

    try:
        meeting_service = room_service.GetMeetingService()
        audio_helper = meeting_service.GetMeetingAudioHelper()
        result = audio_helper.MuteUserAudio(user_id, mute)

        return {
            "room_id": room_id,
            "user_id": user_id,
            "mute": mute,
            "result": int(result),
            "success": int(result) in (
                int(zrc_sdk.ZRCSDKERR_SUCCESS),
                ZRCSDKERR_ALREADY_IN_THIS_STATE,
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

(`zrc_sdk` and `ZRCSDKERR_ALREADY_IN_THIS_STATE` are already imported/defined in `meetings.py` — used by `_set_audio_muted`.)

- [ ] **Step 3: Add a route-registration test**

Beside the existing route tests (follow `test_unit_routes.py`'s import pattern for `app`):

```python
def test_audio_mute_user_route_registered():
    paths = {(r.path, m) for r in app.routes for m in getattr(r, "methods", ()) }
    assert ("/api/rooms/{room_id}/audio/mute-user", "POST") in paths
```

- [ ] **Step 4: Run the test suite**

Run: `pytest` (repo root; the existing collision test also guards the new route against shadowing).
Expected: PASS, including the new registration test.

- [ ] **Step 5: Rebuild bindings and verify the symbol**

Follow the repo's bindings build (generator/README or Makefile — the same procedure that produced the current `.so`). Then:

Run: `python3 -c "import zrc_sdk; print(hasattr(zrc_sdk.IMeetingAudioHelper, 'MuteUserAudio'))"` (inside the build venv/container).
Expected: `True`.

- [ ] **Step 6: Commit**

```bash
git add bindings/zrc_bindings.cpp generator/templates/zrc_bindings.cpp service/controllers/meetings.py tests/test_unit_routes.py
git commit -m "feat(api): per-user audio mute — bind MuteUserAudio + /audio/mute-user route"
# (if the route tests live elsewhere, `git status` after editing shows the real path — stage that file)
```

### Task C2: Lane C review, image, pod roll

- [ ] **Step 1:** Kiro-lane review on the diff; require APPROVE.
- [ ] **Step 2:** Push the branch; build the image via the repo's CI (the `deploy/` manifests from commit `56e3647` document the nonprod rollout procedure — read `deploy/` before touching the cluster).
- [ ] **Step 3:** `aws sso login`, then roll the nonprod pod (`zoom-zrc-0`, ns `placeos`) to the new image per `deploy/` docs. NOTE: backup via kubectl-tar only, NOT `backup.sh` (archives an empty volume in k8s).
- [ ] **Step 4:** Verify: driver `get_health` OK; then a live `mute_participant_audio` against a test meeting with a second client → second client's mic mutes, roster `audio_status.is_muted` flips, UI toggle clears pending.

---

# On-glass verification (folds into the consolidated checklist)

- Tour: targets comfortably tappable; Back hidden on step 1; Done closes; ✕ closes; dots inert.
- Toast: trigger the recording-disclaimer flow; toast is wide with ≤2 comfortable lines.
- Support → Diagnostics and Settings → Displays: chrome/tabs never move; content scrolls inside the pane.
- Displays: accordion opens/closes on tap, exclusive.
- Camera: controls dominant; presets single column; joystick drag exact after rescale.
- Participants (second Zoom client): mic/camera toggles round-trip via roster; Remove two-tap expels; no controls on self; no Remove on hosts.
- Splash: upcoming class visible pre-start with sane countdown (no NaN at any point, including first paint); instant meeting never appears; "Start Scheduled Class" enabled pre-start and joins.

# Execution notes

- Lanes A, B, C can run as three parallel subagents in their respective worktrees. Within Lane A: A1 first (A4/A5/A7 layout assumptions), then A2–A7 in any order, A8 last. Lane B tasks independent of each other. Lane C single task chain.
- The wrapper pod roll (C2) is the only deploy gate: A7's mic toggle 404-toasts until it lands. Everything else is verifiable as soon as its lane deploys.
