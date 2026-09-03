# Waiting-Room Admission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admit / Admit-all buttons in the Status tab's Waiting Room section wired to the ZoomZRC driver.

**Architecture:** Single-file change to `StatusTab.tsx`: two thin action callbacks over the context's `execute(zoomMod, …)`, a pending-set keyed by stringified user id, and two `Button` placements. Roster truth comes from the driver's coalesced refetch — no optimistic updates.

**Tech Stack:** React 19 + TypeScript, shared `Button` primitive, `useZoomContext` (`zoomMod`, `execute`).

**Spec:** `docs/superpowers/specs/2026-09-03-waiting-room-admission-design.md`

## Global Constraints

- No test runner; verification = `npm run build` + `npm run lint` at the 14-error baseline.
- Driver takes `Array(Int32)` — coerce `user_id: number | string`, disable the row if non-integer.
- Pending persists until the roster removes the row; clears on command failure.
- Commits end with: `Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY`

---

### Task 1: Admission actions + buttons in StatusTab

**Files:**
- Modify: `src/components/tabbed/StatusTab.tsx` (imports at 1–3; context destructure at 41–46; waiting section at 123–147)

**Interfaces:**
- Consumes: `useZoomContext().zoomMod: string`, `.execute(moduleAlias, method, args)`; `Button` from `../Button`.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Imports and state/actions**

Add imports (`useEffect`, `useState` to the react import; `Button`):

```ts
import { memo, useEffect, useMemo, useState } from "react";
import { Button } from "../Button";
```

Destructure context (line 41–46) to also take `zoomMod` and `execute`. After the `waitingParticipants` memo, add:

```ts
    // Driver takes Array(Int32); a non-integer user_id disables that row
    const admitId = (v: number | string): number | null => {
        const n = typeof v === "number" ? v : Number(v);
        return Number.isInteger(n) ? n : null;
    };

    // Pending until the driver's roster refetch removes the row — the command
    // ack precedes the actual move, so re-enabling on ack invites double-taps.
    const [pendingAdmits, setPendingAdmits] = useState<Set<string>>(new Set());
    const [admitAllPending, setAdmitAllPending] = useState(false);

    const admit = async (userId: number | string) => {
        const id = admitId(userId);
        if (id == null) return;
        const key = String(userId);
        setPendingAdmits((prev) => new Set(prev).add(key));
        try {
            await execute(zoomMod, "admit_from_waiting_room", [[id]]);
        } catch {
            // execute already toasts; make the row retryable
            setPendingAdmits((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    const admitAll = async () => {
        setAdmitAllPending(true);
        try {
            await execute(zoomMod, "admit_all_from_waiting_room", []);
        } catch {
            setAdmitAllPending(false);
        }
    };

    // Roster refresh is the source of truth: prune pendings that left the
    // waiting room, and clear admit-all once nobody is waiting.
    useEffect(() => {
        const waitingKeys = new Set(
            waitingParticipants.map((p) => String(p.user_id)),
        );
        setPendingAdmits((prev) => {
            const next = new Set(
                [...prev].filter((key) => waitingKeys.has(key)),
            );
            return next.size === prev.size ? prev : next;
        });
        if (waitingParticipants.length === 0) setAdmitAllPending(false);
    }, [waitingParticipants]);
```

- [ ] **Step 2: Waiting Room section UI**

Replace the section (current lines 123–147): heading becomes a flex row with the conditional Admit-all button; each row gets an Admit button.

```tsx
                {/* Waiting Room */}
                {waitingParticipants.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Waiting Room ({waitingParticipants.length})
                            </h3>
                            {waitingParticipants.length >= 2 && (
                                <Button
                                    variant="primary"
                                    disabled={admitAllPending}
                                    onClick={admitAll}
                                    className="min-h-10 px-4 text-base"
                                >
                                    {admitAllPending ? "Admitting…" : "Admit all"}
                                </Button>
                            )}
                        </div>
                        <div className="relative">
                            {waitingParticipants.map((participant, index) => {
                                const key = String(participant.user_id);
                                const pending =
                                    admitAllPending || pendingAdmits.has(key);
                                return (
                                    <div key={participant.user_id} className="relative">
                                        <div className="flex items-center justify-between py-4 px-0">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                    {displayName(participant).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-700 font-medium text-base">{displayName(participant)}</span>
                                            </div>
                                            <Button
                                                variant="primary"
                                                disabled={pending || admitId(participant.user_id) == null}
                                                onClick={() => admit(participant.user_id)}
                                                className="min-h-10 px-4 text-base"
                                            >
                                                {pending ? "Admitting…" : "Admit"}
                                            </Button>
                                        </div>
                                        {index < waitingParticipants.length - 1 && (
                                            <div className="h-px bg-gray-200"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
```

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint` → build exits 0; lint at the 14-error baseline.

- [ ] **Step 4: Commit**

```bash
git add src/components/tabbed/StatusTab.tsx
git commit -m "feat: admit waiting-room guests from status tab

Claude-Session: https://claude.ai/code/session_018qDD3bER4XFvVZAhgvjSgY"
```

---

## Self-Review (done at planning time)

- Spec coverage: actions/coercion → Step 1; pending semantics incl. prune + admit-all clear → Step 1; layout incl. n ≥ 2 gate → Step 2; error path relies on execute's toast → Step 1 catch blocks. Complete.
- Placeholder scan: none.
- Type consistency: `admit(userId: number | string)`, `admitId → number | null`, pending keys `String(user_id)` used identically in both steps.
