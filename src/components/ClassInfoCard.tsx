import {useEffect, useState} from "react";
import {Icon} from "@iconify/react";
import {useZoomContext} from "../hooks/ZoomContext";

interface meetingDetails {
    classStart: string,
    classEnd: string,
    classTitle: string,
    instructor: string

}


export function ClassInfoCard() {
    const {
        nextMeeting,
        currentMeeting,
    } = useZoomContext();
    const [meetingDetails, setMeetingDetails] = useState<meetingDetails>({
        classStart: "",
        classEnd: "",
        classTitle: "",
        instructor: ""
    });
    
    const [ upcoming, setUpcoming ] = useState<string>();
    
    const [countdown, setCountdown] = useState(() => getCountdownToTime(meetingDetails.classStart));
    
    const noMeeting = currentMeeting == null;
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(getCountdownToTime(meetingDetails.classStart));
        }, 1000); // updates every second (can change to 60000 for 1 min)

        return () => clearInterval(interval); // cleanup
    }, [meetingDetails.classStart]);

    useEffect(() => {
        const start = currentMeeting ? getLocaleTime(Number(currentMeeting.startTime)) : '' ;
        const end = currentMeeting ? getLocaleTime(Number(currentMeeting.endTime)) : '';
        const title = currentMeeting ? currentMeeting.meetingName : '';
        const instructor = currentMeeting ? currentMeeting.creatorName : '';

        const data = {
            classStart: start,
            classEnd: end,
            classTitle: title,
            instructor: instructor,
        }

        setMeetingDetails(data);
    }, [currentMeeting])

    useEffect(() => {
        const start = nextMeeting ? "Upcoming " + getLocaleTime(Number(nextMeeting.startTime)) : 'No upcoming classes' ;
        
        setUpcoming(start);
    }, [nextMeeting])
    
    function getLocaleTime(unixTimeStamp: number) {

        const date = new Date(unixTimeStamp * 1000);

        const timeString = date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true, 
        });
        
        return timeString;
    }

    function getCountdownToTime(timeString: string): string {
        const now = new Date();

        // Handle AM/PM if present
        const isPM = timeString.toLowerCase().includes("pm");
        const cleanTime = timeString.replace(/am|pm/i, "").trim();

        const [hourStr, minuteStr] = cleanTime.split(':');
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
           return 'Class already started'
        }

        const diffMs = scheduled.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);

        
        if (diffMins <= 0) return 'Starting now';
        if (diffMins === 1) return 'Starts in 1 minute';
        return `Starts in ${diffMins} minutes`;
    }


    return (
        <div className="card bg-white px-16 py-12 rounded shadow w-full max-w-4xl text-center">
            {!noMeeting 
                ? (<>
                    <div className="text-3xl flex items-center justify-center gap-2">
                        <Icon icon="material-symbols:schedule-outline-rounded" width={64} height={64}></Icon>
                        <span>Next Class:</span>
                        <strong>{meetingDetails.classStart}</strong>
                        <span className="text-xs mx-2">●</span>
                        <div className="text-blue-600">{countdown}</div>
                    </div>
                    <h1 className="mt-8 text-6xl font-bold mt-2">{meetingDetails.classTitle}</h1><p
                    className="mt-4 text-3xl">{meetingDetails.instructor}</p>
                    <div className="mt-8 text-3xl flex items-center justify-center gap-2">
                        <span>Ends at</span>
                        <span>{meetingDetails.classEnd}</span>
                        <span className="text-xs mx-2">●</span>
                        <div>{upcoming}</div>
                    </div>
                </>)
                :
                <>
                    <div className="p-6 text-3xl flex items-center justify-center gap-2">
                        <span>No classes are currently scheduled. You can still start a session.</span>
                    </div>
                </>
            }
        </div>
    );
}
