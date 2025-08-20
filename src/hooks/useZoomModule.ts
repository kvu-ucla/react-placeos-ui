// src/hooks/useZoomState.ts

import ZoomMeeting, {type ExecutedResult} from "@zoom/meetingsdk/embedded";
import {useEffect, useMemo, useRef, useState} from "react";
import {getModule, PlaceModuleBinding} from "@placeos/ts-client";

type DeviceState = 'NONE' | 'MUTED' | 'UNMUTED';

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

interface ZoomBooking {
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

export function useZoomModule(mod = 'Zoom') {
    const systemId: string = 'sys-Ic6SL_lDwR';
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
        // Create the Zoom client
        zoomClientRef.current = ZoomMeeting.createClient();

        if (outletRef.current) {
            zoomClientRef.current.init({
                zoomAppRoot: outletRef.current,
                language: 'en-US',
            });
        }
    }, []);

    useEffect(() => {
        if (!module) return;

        // Attach listeners from zoom client and placeOS driver
        listenToBindings();

        return () => clearSubs();
    }, [module]);

    useEffect(() => {
        const zoomClient = zoomClientRef.current;
        if (!zoomClient) return;

        const toDeviceState = (value: string): DeviceState => {
            if (value === 'MUTED' || value === 'UNMUTED' || value === 'NONE') return value;
            return 'NONE';
        }
        const updateParticipant = (details: any) => {
            setParticipants((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((u) => u.id === details.userId);
                const isHost = details.isHost ?? false;

                const updatedUser = {
                    id: details.userId,
                    name: details.displayName || details.userName || '',
                    video_muted: toDeviceState(details.video_muted), // You can improve this logic
                    audio_muted: toDeviceState(details.audio_muted),
                    speaking: false,
                    is_host: isHost,
                };

                if (idx !== -1) {
                    updated[idx] = {...updated[idx], ...updatedUser};
                } else {
                    updated.push(updatedUser);
                }

                return updated;
            });
        };

        const removeParticipant = (details: any) => {
            setParticipants((prev) => prev
                .filter((u) => u.id !== details.userId)
                .sort((a, b) => a.name.localeCompare(b.name))
            );

            return participants;
        };

        const onUserUpdate = (details: any) => {
            console.log('user update', details);
            if (Array.isArray(details)) {
                details.forEach(updateParticipant);
            } else {
                updateParticipant(details);
            }
        };

        zoomClient.on('user-added', onUserUpdate);
        zoomClient.on('user-updated', onUserUpdate);
        zoomClient.on('user-removed', (details: any) => {
            console.log('user removed', details);
            if (Array.isArray(details)) {
                details.forEach(removeParticipant);
            } else {
                removeParticipant(details);
            }
        });

        zoomClient.on('active-speaker', (speakers: any[]) => {
            console.log('active-speaker', speakers);
            setParticipants((prev) => {
                return prev.map((user) => {
                    const isSpeaking = speakers.some((s) => s.userId === user.id);

                    // Set timeout to clear speaking flag
                    if (isSpeaking) {
                        if (clearTimeoutsRef.current[user.id]) {
                            clearTimeout(clearTimeoutsRef.current[user.id]);
                        }
                        clearTimeoutsRef.current[user.id] = window.setTimeout(() => {
                            setParticipants((list) =>
                                list.map((u) =>
                                    u.id === user.id ? {...u, speaking: false} : u
                                )
                            );
                        }, 1000);
                    }

                    return {...user, speaking: isSpeaking};
                });
            });
        });

        zoomClient.on('connection-change', (payload: any) => {
            console.log('connection-change', payload);

            if (payload.state === 'Closed') {
                setZoomJoined(false);
            }

            if (payload.state === 'Connected') {
                console.log('connection-connected', payload);
                setJoined(currentMeeting?.event_start || 1);
                setZoomJoined(true);
            }
        });

        return () => {
            zoomClient.off('user-added', onUserUpdate);
            zoomClient.off('user-updated', onUserUpdate);
            zoomClient.off('user-removed');
            zoomClient.off('active-speaker');
            zoomClient.off('connection-change');

            // Clear remaining speaking timeouts
            Object.values(clearTimeoutsRef.current).forEach(clearTimeout);
            clearTimeoutsRef.current = {};
        };
    }, [zoomClientRef.current, currentMeeting]);

    const leave = async () => {
        if (!zoomClientRef.current) return;

        try {
            const result = await zoomClientRef.current.leaveMeeting();
            console.log('Meeting left:', result);

            if (!module) return;

            await module.execute('leave_meeting');

            setJoined(0);
        } catch (error) {
            console.error('Failed to leave meeting:', error);
        }
    };

    const join = async (time: number) => {
        if (!zoomClientRef.current) return;

        if (!module) return;

        const meeting = await module.execute('join_meeting', time ? [time] : []);
        console.log('Meeting joined:', meeting);

        zoomClientRef.current
            .join({...meeting})
            .then(() => {
                console.log('Zoom meeting joined successfully');
                setZoomJoined(true);
                setUser(zoomClientRef.current.getCurrentUser());
            })
            .catch((err: any) => {
                setZoomJoined(false);
                console.log('Error:', err);
                if (err.errorCode === 5012) {
                    leave();

                    timeout('rejoin', () => join(time));
                    return;
                }
            });
    }

    const toggleAudioMuteAll = async () => {
        if (!module) return;

        const newState = !audioMuted;
        await module.execute('mic_mute', [newState]);

        setAudioMuted(newState);
    }

    const toggleVideoMuteAll = async () => {
        if (!module) return;

        const newState = !videoMuted;
        await module.execute('camera_mute', [newState]);

        setVideoMuted(newState);

        return newState;
    }

    const toggleSharing = async () => {
        if (!module) return;

        const newState = !sharing;
        await module.execute('share_content', [newState]);

        setSharing(newState);
    };

    const toggleUserAudio = async (user: Participant) => {
        if (user.audio_muted === 'NONE') return;

        const newState = user.audio_muted !== 'MUTED';
        const result: ExecutedResult = await zoomClientRef.current.mute(newState, user.id);
        console.log(result);

        if (!module) return;

        await module.execute('mic_mute', [!user.audio_muted]);
        user.audio_muted = newState ? 'MUTED' : 'UNMUTED';
    };

    const removeParticipant = async (participant: Participant) => {
        if (participant.id === user.userId) {
            leave();
            return;
        }

        const result = await zoomClientRef.current.expel(participant.id);
        console.log(result);

        if (!module) return;
        await module.execute('remove_participant', [participant.id]);
    }
// public async removeParticipant(user: Participant) {
//         if (user.id === this.user()?.userId) {
//             this.leave();
//             return;
//         }
//         const result = await this._zoom_client.expel(user.id);
//         console.log(result);
//         const module = await this.module();
//         if (!module) return;
//         await module.execute('remove_participant', [user.id]);
//     }
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
        bindAndListen('meeting_in_progress', module, setInProgress);
        bindAndListen('meeting_joined', module, setZoomJoined);
        bindAndListen('share_content', module, setSharing);
        bindAndListen('next_pending', module, setNextPending);
        bindAndListen('mic_mute', module, setAudioMuted);
        bindAndListen('camera_mute', module, setVideoMuted);

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
