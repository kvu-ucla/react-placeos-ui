// src/hooks/useZoomModule.ts
import {useEffect, useState} from "react";
import {bind, getModule, PlaceModuleBinding} from "@placeos/ts-client";

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

// interface Attendee {
//     name: string,
//     email: string,
//     response_status: string,
//     resource: boolean
// }

interface CallStatus {
    status: CallState,
    isMicMuted: boolean,
    isCamMuted: boolean,
}

interface SharingStatus {
    "directPresentationPairingCode": string,
    "directPresentationSharingKey": string,
    "dispState": string,
    "isAirHostClientConnected": boolean, //
    "isBlackMagicConnected": boolean,
    "isBlackMagicDataAvailable": boolean,
    "isDirectPresentationConnected": boolean, //wireless sharing
    "isSharingBlackMagic": boolean, //wired sharing
    "password": string,
    "serverName": string,
    "wifiName": string,
}


interface ZoomBooking {
    creatorName: string,
    "startTime": string, //"2025-08-24T23:27:47Z", ISO8601 need to convert to epoch (unix) seconds
    "endTime": string, //"2025-08-24T23:46:50Z",
    "meetingName": string,
    "meetingNumber": string
}

// interface Booking {
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

let subscriptions: (() => void)[] = [];

export function useZoomModule(systemId: string, mod = 'ZoomCSAPI') {
   
    const [module, setModule] = useState<PlaceModuleBinding>();
    const [currentMeeting, setCurrentMeeting] = useState<ZoomBooking>();
    const [nextMeeting, setNextMeeting] = useState<ZoomBooking>();
    const [sharing, setSharing] = useState<SharingStatus>();
    const [recording, setRecording] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>();
    const [bookings, setBookings] = useState<ZoomBooking[]>();
    const [volume, setVolume] = useState<number>();
    const [volumeMute, setVolumute] = useState<boolean>();

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

    useEffect(() => {
        const [first, second] = bookings ?? [];
        setCurrentMeeting(first);
        setNextMeeting(second);
    }, [bookings]);

    const leave = async () => {
        if (!module) return;
        
        if (callStatus?.status === "IN_MEETING")
            await module.execute('call_disconnect');
    };

    const joinPmi = async (time = 15) => {
        if (!module) return;

        await module.execute('dial_start_pmi', [time]);
    }

    const joinMeetingId = async (meetingId: string) => {
        if (!module) return;

        await module.execute('dial_join', [meetingId]);
    }

    const toggleAudioMuteAll = async () => {
        if (!module) return;

        const newState = !callStatus?.isMicMuted;
        await module.execute('call_mute_self', [newState]);
    }

    const toggleVideoMuteAll = async () => {
        if (!module) return;

        const newState = !callStatus?.isCamMuted;
        await module.execute('call_mute_camera', [newState]);
    }

    const toggleSharing = async () => {
        if (!module) return;
        
        if (sharing?.isDirectPresentationConnected) {
            //zCommand Call Sharing Disconnect
            //TODO add command into zoom mod
        }
        else if (sharing?.isSharingBlackMagic) {
            await module.execute('sharing_stop');
        }
        else 
            await module.execute('sharing_start_hdmi');
    };
    
    const adjustMasterVolume = async (value: number) => {
        const volumeMod = getModule(systemId, 'Mixer');
        if (!volumeMod) return;
        
        await volumeMod.execute('set_audio_gain_hi_res', [27, value])
    }
    
    const toggleMasterMute = async () => {
        const volumeMod = getModule(systemId, 'Mixer');
        if (!volumeMod) return;

        const newState = !volumeMute;
        await volumeMod.execute('set_audio_mute', [27, newState]);
    }
    
    const setMasterMute = () => {
        const volumeMod = getModule(systemId, 'Mixer');
        if (!volumeMod) return;

        volumeMod.execute('set_audio_mute', [27, ]);
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
        
        //bind call state for zoom, including mic and cam
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
        
        //bind sharing status for wireless and wired sharing
        bindAndListen('Sharing', module,  setSharing);

        //bind and get bookings from Zoom Rooms
        bindAndListen('Bookings', module, (val: ZoomBooking[]) => {
            const nowMs = Date.now();

            const updatedBookings: ZoomBooking[] = val
                .flatMap<ZoomBooking>(z => {
                    const startMs = Date.parse(z.startTime);
                    const endMs   = Date.parse(z.endTime);
                    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return [];
                    if (endMs <= nowMs) return []; // only drop meetings that already ended

                    return [{
                        ...z,
                        startTime: String(Math.floor(startMs / 1000)),
                        endTime:   String(Math.floor(endMs   / 1000)),
                    }];
                })

            console.log("Updated bookings in epoch", updatedBookings);
            
            setBookings(updatedBookings);
        });
        
        //bind to Bookings module in placeOS
        // const bookingsMod = getModule(systemId, 'Bookings');
        // if (!bookingsMod) return;

        // bindAndListen('current_booking', bookingsMod, setCurrentMeeting);
        // bindAndListen('next_booking', bookingsMod, setNextMeeting);
        
        //bind to Recording module in placeOS
        const recordingsMod = getModule(systemId, 'Recording');
        if (!recordingsMod) return;

        bindAndListen('active_recordings', recordingsMod, handleActiveRecordings);
        
        const volumeMod = getModule(systemId, 'Mixer');
        if (!volumeMod) return;
        
        bindAndListen('audio_gain_hi_res_27', volumeMod, (val) => {
            const vol = Number(val);
            setVolume(vol);
            
        });
        
        bindAndListen('audio_mute_27', volumeMod, (val) => {
            const muteVal = val.toString();
            setVolume(muteVal);
        })
    };


    return {
        volume,
        volumeMute,
        adjustMasterVolume,
        toggleMasterMute,
        currentMeeting,
        nextMeeting,
        recording,
        callStatus,
        sharing,
        bookings,
        leave,
        joinPmi,
        joinMeetingId,
        toggleAudioMuteAll,
        toggleVideoMuteAll,
        toggleSharing
    };
}
