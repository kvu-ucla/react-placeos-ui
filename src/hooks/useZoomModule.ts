// src/hooks/useZoomState.ts

import ZoomMeeting, {type ExecutedResult} from "@zoom/meetingsdk/embedded";
import {useEffect, useMemo, useRef, useState} from "react";
import {getModule, PlaceModuleBinding} from "@placeos/ts-client";

type DeviceState = 'NONE' | 'MUTED' | 'UNMUTED';
type CallState = 'NOT_IN_MEETING' | 'CONNECTING_MEETING' | 'IN_MEETING' | 'LOGGED_OUT' | 'UNKNOWN';
interface Participant {
    id: string;
    name: string;
    video_muted: DeviceState;
    audio_muted: DeviceState;
    speaking: boolean;
    is_host: boolean;
}

interface Attendee {
    name: string,
    email: string,
    response_status: string,
    resource: boolean
}

interface CallStatus {
    status: CallState,
    isMicMuted: boolean,
    isCamMuted: boolean,
}

// interface ZoomBooking {
//     event_start: number,
//     event_end: number,
//     id: string,
//     host: string,
//     title: string,
//     body: string,
//     attendees: Attendee[],
//     hide_attendees: boolean,
//     location: string,
//     private: boolean,
//     all_day: boolean,
//     timezone: string,
//     recurring: boolean,
//     created: string,
//     updated: string,
//     attachments: [],
//     status: string,
//     creator: string,
//     ical_uid: string,
//     online_meeting_provider: string,
//     online_meeting_phones: string[],
//     online_meeting_url: string,
//     visibility: string,
//     mailbox: string
// }

interface Booking {
    event_start: number,
    event_end: number,
    id: string,
    host: string,
    title: string,
    body: string,
    attendees: Attendee[],
    hide_attendees: boolean,
    location: string,
    private: boolean,
    all_day: boolean,
    timezone: string,
    recurring: boolean,
    created: string,
    updated: string,
    attachments: [],
    status: string,
    creator: string,
    ical_uid: string,
    online_meeting_provider: string,
    online_meeting_phones: string[],
    online_meeting_url: string,
    visibility: string,
    mailbox: string
}

let subscriptions: (() => void)[] = [];

export function useZoomModule(mod = 'ZoomCSAPI') {
    const systemId: string = 'sys-I-_pptn4a5';
    const [module, setModule] = useState<PlaceModuleBinding>();
    const [inProgress, setInProgress] = useState<string>('');
    const [joined, setJoined] = useState<number>(0);
    const [zoomJoined, setZoomJoined] = useState<boolean>(false);
    const [nextPending, setNextPending] = useState<boolean>(false);
    const [currentMeeting, setCurrentMeeting] = useState<Booking>();
    const [nextMeeting, setNextMeeting] = useState<Booking>();
    const [sharing, setSharing] = useState<boolean>(false);
    const [recording, setRecording] = useState(false);
    const [audioMuted, setAudioMuted] = useState<boolean>(false);
    const [videoMuted, setVideoMuted] = useState<boolean>(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [user, setUser] = useState<any>(null);
    const [callStatus, setCallStatus] = useState<CallStatus>();

    const handleActiveRecordings = (data: string[] | null | undefined) => {
        const value = !!(data && data.length > 0)
        console.log("new recording value: ", value);
        setRecording(value);
    }
    
    const clearTimeoutsRef = useRef<Record<string, number>>({});

    const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const timeout = (id: string, fn: () => void, delay = 1000) => {
        if (timeoutsRef.current[id]) clearTimeout(timeoutsRef.current[id]);
        timeoutsRef.current[id] = setTimeout(fn, delay);
    };

    const isJoined = useMemo(() => {
        return !!joined && zoomJoined;
    }, [joined, zoomJoined]);

    const outletRef = useRef<HTMLDivElement>(null);
    const zoomClientRef = useRef<any>(null); // persistent ref across renders

    //clear subscriptions to PlaceOS Zoom driver
    const clearSubs = () => {
        subscriptions.forEach((unsub) => unsub());
        subscriptions = [];
    };

    // get zoom module instance from PlaceOS
    useEffect(() => {
        async function getZoomModule() {

            //TODO replace with value from ControlState
            // const system_id = await getSystemId();
            const zoomModule = await getModule(systemId, mod);
            setModule(zoomModule);
        }

        getZoomModule();
    }, [systemId, mod]);

    useEffect(() => {
        if (!module) return;

        // Attach listeners from zoom client and placeOS driver
        listenToBindings();

        return () => clearSubs();
    }, [module]);

    const leave = async () => {

    };

    const join = async (time: number) => {

        if (!module) return;
        
    }

    const toggleAudioMuteAll = async () => {
        if (!module) return;
        
    }

    const toggleVideoMuteAll = async () => {
        if (!module) return;

    }

    const toggleSharing = async () => {

    };

    const toggleUserAudio = async (user: Participant) => {

    };

    const removeParticipant = async (participant: Participant) => {

    }
    const listenToBindings = () => {
        clearSubs();

        const bindAndListen = (
            bindingName: string,
            mod: PlaceModuleBinding,
            setter: (val: any) => void
        ) => {
            console.log(`[Binding] Setting up binding for: ${bindingName}`);

            const binding = mod.binding(bindingName);
            if (!binding) {
                console.warn(`[Binding] ${bindingName} not found on module`);
                return;
            }

            const bound = binding.bind();
            subscriptions.push(bound);
            
            const sub = binding.listen().subscribe((v) => {
                console.log(`[Binding] ${bindingName} update received:`, v);
                setter(v);
            });

            subscriptions.push(() => sub.unsubscribe());
        };

        if (!module) return;

        //bind to Zoom Rooms driver in placeOS
        // bindAndListen('meeting_in_progress', module, setInProgress);
        // bindAndListen('meeting_joined', module, setZoomJoined);
        // bindAndListen('share_content', module, setSharing);
        // bindAndListen('next_pending', module, setNextPending);
        // bindAndListen('mic_mute', module, setAudioMuted);
        // bindAndListen('camera_mute', module, setVideoMuted);
        
        bindAndListen('Call', module, setCallStatus);

        //bind to Bookings module in placeOS
        const bookingsMod = getModule(systemId, 'Bookings');
        if (!bookingsMod) return;

        bindAndListen('current_booking', bookingsMod, setCurrentMeeting);
        bindAndListen('next_booking', bookingsMod, setNextMeeting);
        
        //bind to Recording module in placeOS
        const recordingsMod = getModule(systemId, 'Recording');
        if (!recordingsMod) return;

        bindAndListen('active_recordings', recordingsMod, handleActiveRecordings);

    };


    return {
        outletRef,
        zoomClient: zoomClientRef.current,
        inProgress,
        joined,
        zoomJoined,
        isJoined,
        nextPending,
        currentMeeting,
        nextMeeting,
        sharing,
        recording,
        audioMuted,
        videoMuted,
        participants,
        user,
        leave,
        join,
        toggleAudioMuteAll,
        toggleVideoMuteAll,
        toggleSharing,
        toggleUserAudio,
        removeParticipant
    };
}
