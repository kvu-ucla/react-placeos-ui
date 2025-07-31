import {useEffect, useState} from "react";
import {Clock3} from "lucide-react";

interface meetingDetails {
    classTime: string,
    classTitle: string,
    instructor: string

}

export function ClassInfoCard() {
    const [meetingDetails, setMeetingDetails] = useState<meetingDetails>({
        classTime: "",
        classTitle: "",
        instructor: "",
    });
    const [countdown, setCountdown] = useState(() => getCountdownToTime(meetingDetails.classTime));

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(getCountdownToTime(meetingDetails.classTime));
        }, 1000); // updates every second (can change to 60000 for 1 min)

        return () => clearInterval(interval); // cleanup
    }, [meetingDetails.classTime]);
    
    useEffect(() => {
        const dummyData = {
            classTime: "12:30 PM",
            classTitle: "Introduction to Psychology",
            instructor: "Professor Jordan Davis",
        }
        
        //TODO insert live data from registrar API here
        
        setMeetingDetails(dummyData);
    }, [])

    useEffect(() => {
        
    }, []);

    function getCountdownToTime(timeString: string): string {
        
        // Parse the input time string like "12:30"
        const [hourStr, minuteStr] = timeString.split(':');
        const inputHour = parseInt(hourStr, 10);
        const inputMinute = parseInt(minuteStr, 10);

        // Create a Date for the scheduled time today
        const now = new Date();
        const scheduled = new Date(now);
        scheduled.setHours(inputHour, inputMinute, 0, 0);

        // If time already passed today, assume it's tomorrow
        if (scheduled < now) {
            scheduled.setDate(scheduled.getDate() + 1);
        }

        const diffMs = scheduled.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins <= 0) return 'Starting now';
        if (diffMins === 1) return 'Starts in 1 minute';
        return `Starts in ${diffMins} minutes`;
    }
    
    return (
        <div className="card bg-white mt-6 p-6 rounded shadow w-full max-w-4xl min-h-96 text-center">
            <div className="mt-8 text-3xl flex items-center justify-center gap-2">
                <Clock3 className="h-12 w-12"/>
                <span>Next Class:</span>
                <strong>{meetingDetails.classTime}</strong>
                <span className="text-xs mx-2">●</span>
                <div className="text-blue-600">{countdown}</div>
            </div>
            <h1 className="mt-8 text-6xl font-bold mt-2">{meetingDetails.classTitle}</h1>
            <p className="mt-4 text-3xl">{meetingDetails.instructor}</p>
            <div className="mt-8 text-3xl flex items-center justify-center gap-2">
                <span>Ends at</span>
                <span>{meetingDetails.classTime}</span>
                <span className="text-xs mx-2">●</span>
                <div>Upcoming class at 4:00 PM</div>
            </div>
            
        </div>
    );
}
