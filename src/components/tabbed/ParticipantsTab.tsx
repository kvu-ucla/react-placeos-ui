import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useZoomContext } from "../../hooks/ZoomContext";
import type { ZrcParticipant } from "../../hooks/useZoomRoom";
import { Button } from "../Button";

// Deny calls the driver's deny_from_waiting_room (ucla-dev @ 52c6606114;
// wrapper pod feat-waiting-room-deny-6f3d37d serves the expel + admit routes).
const DENY_ENABLED = true;

const displayName = (participant: ZrcParticipant) =>
    participant.user_name ?? "Unknown";

// Module-scope + memo so tab re-renders don't remount every row
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

type WaitingAction = "admit" | "deny";

export function ParticipantsTab() {
    const { participants, zoomMod, execute } = useZoomContext();

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

    // Admit-all covers the guests waiting AT COMMAND TIME; a new arrival
    // mid-flight must neither be treated as busy nor strand the pending flag.
    const admitAllIdsRef = useRef<Set<string>>(new Set());

    const admitAll = async () => {
        admitAllIdsRef.current = new Set(
            waitingParticipants.map((p) => String(p.user_id)),
        );
        setAdmitAllPending(true);
        try {
            await execute(zoomMod, "admit_all_from_waiting_room", []);
        } catch {
            admitAllIdsRef.current = new Set();
            setAdmitAllPending(false);
        }
    };

    // Roster refresh is the source of truth: prune pendings that left the
    // waiting room, and clear admit-all once every guest it covered has moved.
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
        if (
            admitAllPending &&
            ![...admitAllIdsRef.current].some((key) => waitingKeys.has(key))
        ) {
            admitAllIdsRef.current = new Set();
            setAdmitAllPending(false);
        }
    }, [waitingParticipants, admitAllPending]);

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

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                    Participants ({totalCount})
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

            {/* Scrolling happens in the modal's content pane; this card just
                grows with the list */}
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
                    const pendingAction =
                        pendingActions.get(key) ??
                        (admitAllPending && admitAllIdsRef.current.has(key)
                            ? "admit"
                            : undefined);
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
