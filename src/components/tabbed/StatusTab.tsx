import { useZoomContext } from "../../hooks/ZoomContext";

export function StatusTab() {
    const { currentMeeting, activeBooking, bookings, sharingKey } =
        useZoomContext();

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
        </>
    );
}
