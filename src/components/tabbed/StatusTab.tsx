import { memo, useEffect, useMemo, useState } from "react";
import { useZoomContext } from "../../hooks/ZoomContext";
import type { ZrcParticipant } from "../../hooks/useZoomRoom";
import { Button } from "../Button";

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

export function StatusTab() {
    const {
        currentMeeting,
        activeBooking,
        participants,
        bookings,
        zoomMod,
        execute
    } = useZoomContext();

    // undefined = driver hasn't reported yet; [] = confirmed-empty meeting
    const participantsLoading = participants === undefined;

    // Separate participants by status
    const activeParticipants = useMemo(
        () => participants?.filter(p => !p.is_in_waiting_room) || [],
        [participants],
    );
    const waitingParticipants = useMemo(
        () => participants?.filter(p => p.is_in_waiting_room) || [],
        [participants],
    );

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
            </div>

            <h3 className="font-semibold mb-2">Participants</h3>

            {/* Participants List */}
            <div className="border border-[#999] rounded-lg p-4">
                {/* Loading — driver hasn't reported participants yet.
                    Skeleton rows in ParticipantRow geometry (avatar + name);
                    this surface appears post-load, so it keeps its own
                    skeleton rather than the RoomStatusModal treatment */}
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

                {/* Active Participants */}
                {activeParticipants.length > 0 && (
                    <div className="relative">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Participants ({activeParticipants.length})
                        </h3>
                        {activeParticipants.map((participant, index) => (
                            <div key={participant.user_id} className="relative">
                                <ParticipantRow
                                    participant={participant}
                                />
                                {index < activeParticipants.length - 1 && (
                                    <div className="h-px bg-gray-200"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

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

                {/* No Participants — only once the driver has confirmed empty */}
                {!participantsLoading && activeParticipants.length === 0 && waitingParticipants.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <p>No participants in this meeting</p>
                    </div>
                )}
            </div>
        </>
    );
}
