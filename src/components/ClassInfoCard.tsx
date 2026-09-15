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
