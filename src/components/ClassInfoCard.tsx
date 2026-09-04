import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useZoomContext } from "../hooks/ZoomContext";

interface meetingDetails {
  classStart: string;
  classEnd: string;
  classTitle: string;
  instructor: string;
}

export function ClassInfoCard() {
  const { nextMeeting, currentMeeting, sharingKey } = useZoomContext();
  const [meetingDetails, setMeetingDetails] = useState<meetingDetails>({
    classStart: "",
    classEnd: "",
    classTitle: "",
    instructor: "",
  });

  const [upcoming, setUpcoming] = useState<string>();

  const [countdown, setCountdown] = useState(() =>
    getCountdownToTime(meetingDetails.classStart),
  );

  const noMeeting = currentMeeting == null;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdownToTime(meetingDetails.classStart));
    }, 15000); // countdown text has minute resolution; 15s keeps it fresh without per-second renders

    return () => clearInterval(interval); // cleanup
  }, [meetingDetails.classStart]);

  useEffect(() => {
    const start = currentMeeting
      ? getLocaleTime(currentMeeting.event_start)
      : "";
    const end = currentMeeting ? getLocaleTime(currentMeeting.event_end) : "";
    const title = currentMeeting ? currentMeeting.title : "";
    const instructor = currentMeeting?.creator ?? "";

    const data = {
      classStart: start,
      classEnd: end,
      classTitle: title,
      instructor: instructor,
    };

    setMeetingDetails(data);
  }, [currentMeeting]);

  useEffect(() => {
    const start = nextMeeting
      ? "Upcoming " + getLocaleTime(nextMeeting.event_start)
      : "No upcoming classes";

    setUpcoming(start);
  }, [nextMeeting]);

  function getLocaleTime(unixTimeStamp: number) {
    const date = new Date(unixTimeStamp * 1000);

    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return timeString;
  }

  function getCountdownToTime(timeString: string): string {
    const now = new Date();

    // Handle AM/PM if present
    const isPM = timeString.toLowerCase().includes("pm");
    const cleanTime = timeString.replace(/am|pm/i, "").trim();

    const [hourStr, minuteStr] = cleanTime.split(":");
    let inputHour = parseInt(hourStr, 10);
    const inputMinute = parseInt(minuteStr, 10);

    // Convert to 24-hour format
    if (isPM && inputHour < 12) inputHour += 12;
    if (!isPM && inputHour === 12) inputHour = 0; // midnight edge case

    // Create a Date for the scheduled time today
    const scheduled = new Date(now);
    scheduled.setHours(inputHour, inputMinute, 0, 0);

    // If time already passed today, assume it's tomorrow
    if (scheduled < now) {
      return "Class already started";
    }

    const diffMs = scheduled.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins <= 0) return "Starting now";
    if (diffMins === 1) return "Starts in 1 minute";
    return `Starts in ${diffMins} minutes`;
  }

  return (
    <div className="flex flex-col justify-between items-center card bg-white p-4 rounded shadow w-full max-w-[620px] text-center h-[300px]">
      {!noMeeting ? (
        <>
          <div className="text-2xl flex items-center justify-center gap-2 tabular-nums">
            <Icon
              icon="material-symbols:schedule-outline-rounded"
              width={48}
              height={48}
            ></Icon>
            <span>Next Class:</span>
            <strong>{meetingDetails.classStart}</strong>
            <span className="text-xs mx-2">●</span>
            <div className="text-blue-600">{countdown}</div>
          </div>
          <div>
            <h1 className="mt-4 text-3xl font-bold">
              {meetingDetails.classTitle}
            </h1>
            {meetingDetails.instructor ? (
              <p className="text-xl">{meetingDetails.instructor}</p>
            ) : null}
          </div>
          <div className="mt-8 mb-8 text-xl flex items-center justify-center gap-2 tabular-nums">
            <span>Ends at</span>
            <span>{meetingDetails.classEnd}</span>
            <span className="text-xs mx-2">●</span>
            <div>{upcoming}</div>
          </div>

          {sharingKey && (
            <div className="flex items-center justify-center gap-2">
              <div className="font-semibold">Sharing Key: {sharingKey}</div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center gap-4 h-[300px] p-6">
            <span className="text-2xl">
              No classes are currently scheduled. You can still start a session.
            </span>
            {sharingKey && (
              <div className="font-semibold">Sharing Key: {sharingKey}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
