import { memo, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useZoomContext } from "../../hooks/ZoomContext";
import type { ZrcParticipant } from "../../hooks/useZoomRoom";
import { Button } from "../Button";

// Deny calls the driver's deny_from_waiting_room (on ucla-dev @ 52c6606114;
// wrapper pod feat-waiting-room-deny-6f3d37d has the expel + admit routes
// verified live). Requires the backstage ZoomZRC driver reload to be current.
const DENY_ENABLED = true;

const displayName = (participant: ZrcParticipant) =>
    participant.user_name ?? "Unknown";

// Module-scope + memo so StatusTab re-renders don't remount every row
const ParticipantRow = memo(function ParticipantRow({ participant }: { participant: ZrcParticipant }) {
    return (
        <div className="flex items-center justify-between py-4 px-0">
            {/* User info section */}
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {displayName(participant).charAt(0).toUpperCase()}
                    </div>
                    {/* Raised hand indicator */}
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
        </div>
    );
});

type WaitingAction = "admit" | "deny";

export function StatusTab({
    initialView,
}: {
    initialView?: "participants";
}) {
    const {
        currentMeeting,
        activeBooking,
        participants,
        bookings,
        zoomMod,
        execute,
        sharingKey,
    } = useZoomContext();

    // Drill-down: overview by default; deep links (waiting toast, Meeting
    // Controls card) land straight on the roster.
    const [view, setView] = useState<"status" | "participants">(
        initialView ?? "status",
    );

    // undefined = driver hasn't reported yet; [] = confirmed-empty meeting
    const participantsLoading = participants === undefined;

    const activeParticipants = useMemo(
        () => participants?.filter(p => !p.is_in_waiting_room) || [],
        [participants],
    );
    const waitingParticipants = useMemo(
        () => participants?.filter(p => p.is_in_waiting_room) || [],
        [participants],
    );
    const totalCount = activeParticipants.length + waitingParticipants.length;

    // Driver takes Array(Int32); a non-integer user_id disables that row
    const admitId = (v: number | string): number | null => {
        const n = typeof v === "number" ? v : Number(v);
        return Number.isInteger(n) ? n : null;
    };

    // Pending until the driver's roster refetch removes the row — the command
    // ack precedes the actual move, so re-enabling on ack invites double-taps.
    // One entry per row covers both actions: a row is busy while either
    // command is in flight.
    const [pendingActions, setPendingActions] = useState<
        Map<string, WaitingAction>
    >(new Map());
    const [admitAllPending, setAdmitAllPending] = useState(false);

    const act = async (userId: number | string, action: WaitingAction) => {
        const id = admitId(userId);
        if (id == null) return;
        const key = String(userId);
        setPendingActions((prev) => new Map(prev).set(key, action));
        try {
            await execute(
                zoomMod,
                action === "admit"
                    ? "admit_from_waiting_room"
                    : "deny_from_waiting_room",
                [[id]],
            );
        } catch {
            // execute already toasts; make the row retryable
            setPendingActions((prev) => {
                const next = new Map(prev);
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
        setPendingActions((prev) => {
            const next = new Map(
                [...prev].filter(([key]) => waitingKeys.has(key)),
            );
            return next.size === prev.size ? prev : next;
        });
        if (waitingParticipants.length === 0) setAdmitAllPending(false);
    }, [waitingParticipants]);

    if (view === "participants") {
        return (
            <>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {/* Non-native back control — the panel webview skins
                            native buttons (see Button.tsx ghost comment) */}
                        <div
                            role="button"
                            tabIndex={0}
                            aria-label="Back to meeting status"
                            onClick={() => setView("status")}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setView("status");
                                }
                            }}
                            className="cursor-pointer select-none rounded-lg active:bg-gray-200 flex items-center justify-center w-12 h-12"
                        >
                            <Icon
                                icon="material-symbols:chevron-left-rounded"
                                width={40}
                                height={40}
                            />
                        </div>
                        <h3 className="font-semibold text-lg">
                            Participants ({totalCount})
                        </h3>
                    </div>
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

                <div className="border border-[#999] rounded-lg p-4">
                    {/* Loading — driver hasn't reported participants yet.
                        Skeleton rows in ParticipantRow geometry (avatar + name) */}
                    {participantsLoading && (
                        <div
                            className="py-4"
                            role="status"
                            aria-label="Loading participants"
                        >
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex items-center space-x-3 py-4">
                                    <div className="skeleton h-10 w-10 shrink-0 rounded-full"></div>
                                    <div className="skeleton h-5 w-44"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* One unified list: waiting guests pinned first (they're
                        the rows needing action), then everyone in the meeting */}
                    {waitingParticipants.map((participant, index) => {
                        const key = String(participant.user_id);
                        const pendingAction = admitAllPending
                            ? "admit"
                            : pendingActions.get(key);
                        const busy = pendingAction != null;
                        const badId = admitId(participant.user_id) == null;
                        return (
                            <div key={key} className="relative">
                                <div className="flex items-center justify-between py-4 px-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                            {displayName(participant).charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-gray-700 font-medium text-base">{displayName(participant)}</span>
                                        <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">
                                            Waiting
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {DENY_ENABLED && (
                                            <Button
                                                variant="outline"
                                                disabled={busy || badId}
                                                onClick={() => act(participant.user_id, "deny")}
                                                className="min-h-10 px-4 text-base"
                                            >
                                                {pendingAction === "deny" ? "Denying…" : "Deny"}
                                            </Button>
                                        )}
                                        <Button
                                            variant="primary"
                                            disabled={busy || badId}
                                            onClick={() => act(participant.user_id, "admit")}
                                            className="min-h-10 px-4 text-base"
                                        >
                                            {pendingAction === "admit" ? "Admitting…" : "Admit"}
                                        </Button>
                                    </div>
                                </div>
                                {(index < waitingParticipants.length - 1 ||
                                    activeParticipants.length > 0) && (
                                    <div className="h-px bg-gray-200"></div>
                                )}
                            </div>
                        );
                    })}

                    {activeParticipants.map((participant, index) => (
                        <div key={participant.user_id} className="relative">
                            <ParticipantRow participant={participant} />
                            {index < activeParticipants.length - 1 && (
                                <div className="h-px bg-gray-200"></div>
                            )}
                        </div>
                    ))}

                    {/* No Participants — only once the driver has confirmed empty */}
                    {!participantsLoading && totalCount === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <p>No participants in this meeting</p>
                        </div>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <h3 className="font-semibold mb-2">Zoom meeting status</h3>

            {/* Room Info */}
            <div className="border border-[#999] rounded-lg p-4 mb-4">
                <div className="font-semibold text-black">
                    {currentMeeting?.title}
                </div>
                <div className="text-gray-600 flex gap-4">
                    {/* Neutral dash until bookings hydrate — no "No Meeting" flash */}
                    <span>
                        Meeting Number:{" "}
                        {bookings === undefined
                            ? "—"
                            : activeBooking?.id ?? "No Meeting"}
                    </span>
                </div>
                {sharingKey && (
                    <div className="text-gray-600 mt-1">
                        Sharing Key:{" "}
                        <span className="font-mono font-semibold tracking-widest text-black">
                            {sharingKey}
                        </span>
                    </div>
                )}
            </div>

            {/* Meeting functions — roster and future actions drill down from
                here instead of cramming into this view */}
            <div className="relative inline-block">
                <Button
                    variant="primary"
                    onClick={() => setView("participants")}
                    className="min-h-[4rem] px-6 text-xl"
                >
                    Participants{totalCount > 0 ? ` (${totalCount})` : ""}
                </Button>
                {waitingParticipants.length > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-8 h-8 px-2 rounded-full bg-amber-400 text-black text-lg font-bold flex items-center justify-center">
                        {waitingParticipants.length}
                    </span>
                )}
            </div>
        </>
    );
}
