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
  const { nextMeeting, currentMeeting } = useZoomContext();
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
    }, 1000); // updates every second (can change to 60000 for 1 min)

    return () => clearInterval(interval); // cleanup
  }, [meetingDetails.classStart]);

  useEffect(() => {
    const start = currentMeeting
      ? getLocaleTime(Number(currentMeeting.startTime))
      : "";
    const end = currentMeeting
      ? getLocaleTime(Number(currentMeeting.endTime))
      : "";
    const title = currentMeeting ? currentMeeting.meetingName : "";
    const instructor = currentMeeting ? currentMeeting.creatorName : "";

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
      ? "Upcoming " + getLocaleTime(Number(nextMeeting.startTime))
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
          <div className="text-2xl flex items-center justify-center gap-2">
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
            <p className="text-xl">{meetingDetails.instructor}</p>
          </div>
          <div className="mt-8 mb-8 text-xl flex items-center justify-center gap-2">
            <span>Ends at</span>
            <span>{meetingDetails.classEnd}</span>
            <span className="text-xs mx-2">●</span>
            <div>{upcoming}</div>
          </div>

          {/*<div className="flex items-center justify-center gap-2">*/}
          {/*  /!*Sharing Key*!/*/}
          {/*  <div className="font-semibold">*/}
          {/*    Sharing Key: {sharing?.directPresentationSharingKey}*/}
          {/*  </div>*/}
          {/*  /!*BruinCasting State*!/*/}
          {/*  {recording && (*/}
          {/*      <div className="flex flex-col items-center p-2">*/}
          {/*        <div className="inline-flex justify-evenly items-center bg-gray-400/15 rounded-[10px] px-4 py-2">*/}
          {/*          <div className="relative">*/}
          {/*            <div className="absolute inline-flex h-4 w-4 rounded-full bg-[#48E960] opacity-75 animate-ping"></div>*/}
          {/*            <div className="relative h-4 w-4 bg-[#48E960] rounded-full mr-4"></div>*/}
          {/*          </div>*/}
          {/*          <div className="font-semibold text-xl">BruinCasting</div>*/}
          {/*        </div>*/}
          {/*        <div className="text-lg text-gray-300">*/}
          {/*          Recording powered by BruinCast*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*  )}*/}
          {/*  {!recording && (*/}
          {/*      <div className="flex flex-col items-center p-2">*/}
          {/*        <div className="inline-flex justify-evenly items-center bg-[#001A5C] rounded-[10px] px-4 py-2">*/}
          {/*          <div className="h-4 w-4 bg-[#CCCCCC] rounded-full mr-4"></div>*/}
          {/*          <div className="font-semibold text-xl">Not Bruincasting</div>*/}
          {/*        </div>*/}
          {/*        <div className="text-lg text-gray-300">*/}
          {/*          Recording powered by BruinCast*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*  )}*/}
          {/*</div>*/}

        </>
      ) : (
        <>
          <div className="p-6 text-2xl flex items-center justify-center gap-2 h-[300px]">
            <span>
              No classes are currently scheduled. You can still start a session.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
