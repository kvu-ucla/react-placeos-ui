// src/hooks/useZoomModule.ts
import {useEffect, useState} from "react";
import {getModule, PlaceModuleBinding} from "@placeos/ts-client";

// type DeviceState = 'NONE' | 'MUTED' | 'UNMUTED';
type CallState = 'NOT_IN_MEETING' | 'CONNECTING_MEETING' | 'IN_MEETING' | 'LOGGED_OUT' | 'UNKNOWN';
// interface Participant {
//     id: string;
//     name: string;
//     video_muted: DeviceState;
//     audio_muted: DeviceState;
//     speaking: boolean;
//     is_host: boolean;
// }

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

export function useZoomModule(systemId: string, mod = 'ZoomCSAPI') {
   
    const [module, setModule] = useState<PlaceModuleBinding>();
    const [currentMeeting, setCurrentMeeting] = useState<Booking>();
    const [nextMeeting, setNextMeeting] = useState<Booking>();
    // const [sharing, setSharing] = useState<boolean>(false);
    const [recording, setRecording] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>();

    const handleActiveRecordings = (data: string[] | null | undefined) => {
        const value = !!(data && data.length > 0)
        console.log("new recording value: ", value);
        setRecording(value);
    }

    //clear subscriptions to PlaceOS Zoom driver
    const clearSubs = () => {
        subscriptions.forEach((unsub) => unsub());
        subscriptions = [];
    };

    // get zoom module instance from PlaceOS
    useEffect(() => {
        
        const zoomModule =  getModule(systemId, mod);
        setModule(zoomModule);
 
    }, [systemId, mod]);

    useEffect(() => {
        if (!module) return;

        // Attach listeners from zoom client and placeOS driver
        listenToBindings();

        return () => clearSubs();
    }, [module]);

    const leave = async () => {

    };

    // const join = async (time: number) => {
    //
    //     if (!module) return;
    //    
    // }

    const toggleAudioMuteAll = async () => {
        if (!module) return;
        
    }

    const toggleVideoMuteAll = async () => {
        if (!module) return;

    }

    const toggleSharing = async () => {

    };
    
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
        
        bindAndListen('Call', module, (val) => {
            let tempMic = null;
            let tempCam = null;
            
            console.log("Call status val from zoom module: ", val);
            if(val.Microphone.Mute != null)
                tempMic = val.Microphone.Mute;
            if(val.Microphone.Mute != null)
                tempCam = val.Camera.Mute;
                
            const data = {
                status: val.Status,
                isMicMuted: tempMic,
                isCamMuted: tempCam
            }

            console.log("Call status data from zoom module: ", data);
            
            setCallStatus(data);
        });

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
        currentMeeting,
        nextMeeting,
        recording,
        callStatus,
        leave,
        toggleAudioMuteAll,
        toggleVideoMuteAll,
        toggleSharing
    };
}
