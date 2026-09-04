import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useZoomContext } from "../../hooks/ZoomContext";

const timeOf = (unixSeconds: number) =>
    new Date(unixSeconds * 1000).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });

export function StatusTab() {
    const {
        currentMeeting,
        activeBooking,
        bookings,
        sharingKey,
        participants,
        timeJoined,
        nextMeeting,
        recording,
        hdmiSharing,
    } = useZoomContext();

    // Elapsed re-renders on a coarse tick; nothing else here is time-driven
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(timer);
    }, []);
    const elapsedMin =
        timeJoined > 0 ? Math.max(0, Math.floor((now - timeJoined) / 60_000)) : null;

    const waitingCount = useMemo(
        () => participants?.filter((p) => p.is_in_waiting_room).length ?? 0,
        [participants],
    );
    const inMeetingCount = useMemo(
        () => participants?.filter((p) => !p.is_in_waiting_room).length ?? 0,
        [participants],
    );

    return (
        <>
            <h3 className="font-semibold mb-2">Zoom meeting status</h3>

            {/* Cloud recording should never be on — BruinCast owns class
                capture. This renders ONLY as an anomaly warning. */}
            {recording && (
                <div className="flex items-center gap-3 rounded-lg bg-amber-100 text-amber-900 p-3 mb-4 text-lg">
                    <Icon
                        icon="material-symbols:radio-button-checked"
                        className="text-red-600"
                        width={28}
                        height={28}
                    />
                    <span>
                        <b>Cloud recording is active.</b> BruinCast handles class
                        capture — cloud recording should normally be off.
                    </span>
                </div>
            )}

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
                {(elapsedMin != null || activeBooking?.event_end) && (
                    <div className="text-gray-600 mt-1">
                        {elapsedMin != null && `In meeting for ${elapsedMin} min`}
                        {elapsedMin != null && activeBooking?.event_end && " · "}
                        {activeBooking?.event_end &&
                            `scheduled until ${timeOf(activeBooking.event_end)}`}
                    </div>
                )}
                {participants !== undefined && (
                    <div className="text-gray-600 mt-1">
                        {inMeetingCount} in meeting
                        {waitingCount > 0 && ` · ${waitingCount} waiting`}
                    </div>
                )}
                {hdmiSharing && (
                    <div className="text-gray-600 mt-1">
                        HDMI source connected and sharing
                    </div>
                )}
                {sharingKey && (
                    <div className="text-gray-600 mt-1">
                        Sharing Key:{" "}
                        <span className="font-mono font-semibold tracking-widest text-black">
                            {sharingKey}
                        </span>
                    </div>
                )}
            </div>

            {nextMeeting && (
                <div className="text-gray-600 text-lg">
                    Next: <b>{nextMeeting.title}</b> at{" "}
                    {timeOf(nextMeeting.event_start)}
                </div>
            )}
        </>
    );
}
