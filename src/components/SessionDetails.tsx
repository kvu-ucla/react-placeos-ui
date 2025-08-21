// src/components/SessionDetails.tsx
import {useEffect, useMemo, useState} from "react";
import {useZoomModule} from "../hooks/useZoomModule";

function toMs(v?: number | null) {
    if (v == null) return NaN;
    // Support Unix seconds or milliseconds
    return v < 1e12 ? v * 1000 : v;
}

function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
}

function fmtHM(ms: number) {
    const totalMins = Math.floor(ms / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}m`;
}

function fmtTime(ms: number) {
    if (!isFinite(ms)) return "—";
    return new Date(ms).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export default function SessionDetails() {
    const { nextMeeting, currentMeeting } = useZoomModule();

    // Tick every second so progress/remaining update live
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    // Pull and normalize times
    const startMs = toMs(currentMeeting?.event_start);
    const endMs   = toMs(currentMeeting?.event_end);
    const nextStartMs = toMs(nextMeeting?.event_start);
    const nextEndMs = toMs(nextMeeting?.event_end);

    // Derived timeline values
    const {
        isClass,
        percent,
        elapsedMs,
        remainingMs,
    } = useMemo(() => {
        const duration = endMs - startMs;
        const valid = isFinite(startMs) && isFinite(endMs) && duration > 0;

        if (!valid) {
            return {
                isClass: false,
                percent: 0,
                elapsedMs: 0,
                remainingMs: 0,
            };
        }

        const elapsed = clamp(now - startMs, 0, duration);
        const remaining = clamp(endMs - now, 0, duration);
        const pct = Math.round((elapsed / duration) * 100);

        // “In class” means current time between start and end (inclusive of start)
        const active = now >= startMs && now <= endMs;

        return {
            isClass: active,
            percent: pct,
            elapsedMs: elapsed,
            remainingMs: remaining,
        };
    }, [now, startMs, endMs]);

    const remainingMinutes = Math.ceil(remainingMs / 60000);
    const elapsedLabel = fmtHM(elapsedMs);

    const currentClassName = currentMeeting?.title ?? "—";
    const nextClassName = nextMeeting?.title ?? "—";

    return (
        <div id="details" className="first-step grid grid-cols-8 gap-4">
            {/* Session progress */}
            <div className="col-span-5 bg-white rounded-lg shadow justify-center p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-3xl font-bold">Session progress</h2>
                    {isClass && (
                        <div className="text-xl">
                            Started at {fmtTime(startMs)} • Ends at {fmtTime(endMs)}
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {isClass && (
                    <div
                        className="w-full bg-gray-200 rounded-2xl overflow-hidden mb-4"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                    >
                        <div
                            className="h-5 bg-blue-600 transition-[width] duration-1000 ease-linear"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                )}

                <div className="flex items-center justify-between">
                    {isClass ? (
                        <div className="text-xl text-gray-500">
                            <span className="font-medium">{percent}%</span> Complete • {elapsedLabel} Elapsed
                        </div>
                    ) : (
                        <div className="text-xl text-gray-500">
                            Not currently in a class
                        </div>
                    )}

                    <div className="text-xl text-gray-500">
            <span className="text-blue-600 text-[30px] font-bold">
              {Math.max(0, remainingMinutes)}
            </span>{" "}
                        {isClass ? "Minutes remaining" : "Minutes until next"}
                    </div>
                </div>
            </div>

            {/* Class info */}
            <div className="col-span-3 bg-white rounded-lg shadow px-9 py-6">
                <h2 className="truncate font-bold text-3xl mb-3">
                    Current class: {isClass ? currentClassName : "None"}
                </h2>

                {isClass ? (
                    <div className="truncate text-blue-600 text-3xl font-bold mb-4">
                        Next up: {nextClassName}
                    </div>
                ) : (
                    <div className="truncate text-gray-500 font-bold text-2xl mb-4">
                        No classes after
                    </div>
                )}

                {isClass && (
                    <div className="text-[24px]">
                        Starts at {fmtTime(nextStartMs)} • Ends at {fmtTime(nextEndMs)}
                    </div>
                )}
            </div>
        </div>
    );
}
