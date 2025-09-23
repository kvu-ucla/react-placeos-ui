// src/components/SessionDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { toast, type Id } from 'react-toastify';
import { useZoomContext } from "../hooks/ZoomContext";

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
  else {
    return new Date(ms).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
}


interface SurveyToastProps {
  onStartNext: () => void;
  onWait: () => void;
}

const SurveyToast = ({ onStartNext, onWait }: SurveyToastProps) => (
    <div className="p-4">
      <div className="flex items-start mb-4">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 mt-0.5">
          <span className="text-white text-sm font-bold">i</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Have feedback to share?
          </h3>
          <div className="text-gray-600">
            <div className="text-sm">
              Take our survey in under 30 seconds.
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
            onClick={onWait}
            className="flex-1 bg-blue-100 text-blue-950 font-semibold py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors"
        >
          No
        </button>
        <button
            onClick={onStartNext}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Yes
        </button>
      </div>
    </div>
);


export default function SessionDetails() {
  const { nextMeeting, joinMeetingId, timeJoined, activeBooking } = useZoomContext();

  // Tick every second so progress/remaining update live
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Toast states
  const [surveyToastId, setSurveyToastId] = useState<Id | null>(null);
  const [hasNotified, setHasNotified] = useState(false);

  // Debug mode for testing
  const [debugMode, setDebugMode] = useState(false);

  // Pull and normalize times
  const startMs = toMs(Number(activeBooking?.startTime));
  const endMs = toMs(Number(activeBooking?.endTime));
  const nextStartMs = toMs(Number(nextMeeting?.startTime));
  const nextEndMs = toMs(Number(nextMeeting?.endTime));
  const timeJoinedMs = toMs(timeJoined);

  const { isClass, percent, elapsedMs, remainingMs, sessionStart } = useMemo(() => {
    // Use the earlier of meeting start or when you joined
    const sessionStart = Math.min(startMs, timeJoinedMs);
    const duration = endMs - sessionStart;

    const valid =
        Number.isFinite(sessionStart) && Number.isFinite(endMs) && duration > 0;

    if (!valid) {
      return {
        isClass: false,
        percent: 0,
        elapsedMs: 0,
        remainingMs: 0,
        sessionStart: startMs || 0,
      };
    }

    const elapsed = clamp(now - sessionStart, 0, duration);
    const remaining = clamp(endMs - now, 0, duration);

    const pct = clamp(Math.round((elapsed / duration) * 100), 0, 100);

    const active = now >= sessionStart && now <= endMs;

    return {
      isClass: active,
      percent: pct,
      elapsedMs: elapsed,
      remainingMs: remaining,
      sessionStart,
    };
  }, [now, startMs, endMs, timeJoinedMs]);

  // Toast logic for meeting end
  useEffect(() => {
    // Use debug mode or actual meeting end condition
    const meetingEnded = debugMode || (now >= endMs);

    // When current meeting ends and there's a next meeting
    if (meetingEnded && !hasNotified) {
      const handleStartSurvey = () => {
        if (surveyToastId) {
          toast.dismiss(surveyToastId);
        }
        setSurveyToastId(null);
        setHasNotified(true);
        setDebugMode(false); // Reset debug mode
      };

      const handleWait = () => {
        if (surveyToastId) {
          toast.dismiss(surveyToastId);
        }
        setSurveyToastId(null);

        // Show toast again after delay (shorter for testing)
        const WAIT_TIMEOUT = process.env.NODE_ENV === 'development' ?
            10000 : // 10 seconds for testing
            2 * 60 * 1000; // 2 minutes for production

        setTimeout(() => {
          setHasNotified(false);
        }, WAIT_TIMEOUT);
      };

      const toastId = toast(
          <SurveyToast
              onStartNext={handleStartSurvey}
              onWait={handleWait}
          />,
          {
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            closeButton: true,
            style: {
              minWidth: '400px',
              width: 'auto',
              maxWidth: '600px'
            }
          }
      );

      setSurveyToastId(toastId);
      setHasNotified(true);
    }

    // Reset when new meeting starts or conditions change
    if ((now < endMs ) && !debugMode) {
      setHasNotified(false);
      if (surveyToastId) {
        toast.dismiss(surveyToastId);
        setSurveyToastId(null);
      }
    }
  }, [now, endMs, isClass, hasNotified, surveyToastId, debugMode]);

  const remainingMinutes = Math.ceil(remainingMs / 60000);
  const elapsedLabel = fmtHM(elapsedMs);

  const currentClassName = activeBooking?.meetingName ?? "—";
  const nextClassName = nextMeeting?.meetingName ?? "—";

  return (
      <div id="details" className="first-step grid grid-cols-8 gap-4">
        {/* Session progress */}
        <div className="col-span-5 bg-white rounded-lg shadow justify-center p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-3xl font-bold">Session progress</h2>
            {isClass && (
                <div className="text-xl">
                  Started at {fmtTime(sessionStart)} • Ends at{" "}
                  {fmtTime(endMs)}
                </div>
            )}
          </div>

          {/* Debug button for testing (only in development) */}
              <div className="mb-4">
                <button
                    onClick={() => setDebugMode(!debugMode)}
                    className={`px-3 py-1 text-xs rounded ${
                        debugMode
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  {debugMode ? 'Debug: Meeting Ended' : 'Debug: Force Meeting End'}
                </button>
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
                  <span className="font-medium">{percent}%</span> Complete •{" "}
                  {elapsedLabel} Elapsed
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
              <div className="text-[24px] mb-4">
                Starts at {fmtTime(nextStartMs)} • Ends at {fmtTime(nextEndMs)}
                {percent >= 95 && nextMeeting && (
                    <button
                        onClick={() => {
                          if (nextMeeting) {
                            joinMeetingId(nextMeeting.meetingNumber);
                          }
                        }}
                        className="ml-4 animate-pulse bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Next
                    </button>
                )}
              </div>
          )}

        </div>
      </div>
  );
}