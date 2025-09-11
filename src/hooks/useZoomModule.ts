// src/hooks/useZoomModule.ts
import { useEffect, useState } from "react";
import { getModule, PlaceModuleBinding } from "@placeos/ts-client";

// type DeviceState = 'NONE' | 'MUTED' | 'UNMUTED';
type CallState =
  | "NOT_IN_MEETING"
  | "CONNECTING_MEETING"
  | "IN_MEETING"
  | "LOGGED_OUT"
  | "UNKNOWN";


// interface ZoomParticipant {
//   user_id: number;
//   user_name: string;
//   "audio_status state": string;
//   "video_status has_source": boolean;
//   "video_status is_sending": boolean;
//   isCohost: boolean;
//   is_host: boolean;
//   is_in_waiting_room: boolean;
//   hand_status: {
//     is_raise_hand: boolean;
//     is_valid: string;
//     time_stamp: string;
//   };
// }



interface CallStatus {
  status: CallState;
  isMicMuted: boolean;
  isCamMuted: boolean;
}

interface SharingStatus {
  directPresentationPairingCode: string;
  directPresentationSharingKey: string;
  dispState: string;
  isAirHostClientConnected: boolean; //
  isBlackMagicConnected: boolean;
  isBlackMagicDataAvailable: boolean;
  isDirectPresentationConnected: boolean; //wireless sharing
  isSharingBlackMagic: boolean; //wired sharing
  password: string;
  serverName: string;
  wifiName: string;
}

interface ZoomBooking {
  creatorName: string;
  startTime: string; //"2025-08-24T23:27:47Z", ISO8601 need to convert to epoch (unix) seconds
  endTime: string; //"2025-08-24T23:46:50Z",
  meetingName: string;
  meetingNumber: string;
}

interface Microphone {
  name: string;
  level_id: string[];
  mute_id: string[];
  level_index: number;
  mute_index: number;
  level_feedback: string;
  mute_feedback: string;
  module_id: string;
  min_level: number;
  max_level: number;
  rooms: null;
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

interface Camera {
  camera_id: string;
  camera_name: string;
  presets: string[];
}

let subscriptions: (() => void)[] = [];

export function useZoomModule(systemId: string, mod = "ZoomCSAPI") {
  const [module, setModule] = useState<PlaceModuleBinding>();
  const [currentMeeting, setCurrentMeeting] = useState<ZoomBooking>();
  const [nextMeeting, setNextMeeting] = useState<ZoomBooking>();
  const [sharing, setSharing] = useState<SharingStatus>();
  const [recording, setRecording] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>();
  const [bookings, setBookings] = useState<ZoomBooking[]>();
  const [volume, setVolume] = useState<number>();
  const [volumeMute, setVolumeMute] = useState<boolean>();
  const [gallery, setGallery] = useState<boolean>(true);
  const [timeJoined, setTimeJoined] = useState<number>(0);
  const [mics, SetMics] = useState<Microphone[]>([]);
  const [cams, setCams] = useState<CameraMap>({});
  const [selectedCamera, setSelectedCamera] = useState<string>();
  const [muteEveryone, setMuteEveryone] = useState<boolean>();
  // const [participants, setParticipants] = useState<ZoomParticipant[]>();

  type CameraMap = Record<string, Camera>;

  const handleActiveRecordings = (data: string[] | null | undefined) => {
    const value = !!(data && data.length > 0);
    console.log("new recording value: ", value);
    setRecording(value);
  };

  // Helper: add missing cameras and prune removed ones
  const syncCameraSet = (ids: string[]) => {
    setCams((prev) => {
      const next: CameraMap = { ...prev };
      for (const id of ids) {
        if (!next[id])
          next[id] = { camera_id: id, camera_name: "", presets: [] };
      }
      for (const id of Object.keys(next)) {
        if (!ids.includes(id)) delete next[id];
      }
      return next;
    });
  };

  // Helper: patch a single camera immutably
  const patchCam = (id: string, patch: Partial<Camera>) => {
    setCams((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  //clear subscriptions to PlaceOS Zoom driver
  const clearSubs = () => {
    subscriptions.forEach((unsub) => unsub());
    subscriptions = [];
  };

  // get zoom module instance from PlaceOS
  useEffect(() => {
    const zoomModule = getModule(systemId, mod);
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

  //disconnect from Zoom call
  const leave = async () => {
    if (!module) return;

    if (callStatus?.status === "IN_MEETING")
      await module.execute("call_disconnect");
  };

  //connect to ad-hoc meeting
  const joinPmi = async (time = 15) => {
    if (!module) return;

    await module.execute("dial_start_pmi", [time]);
  };

  //connect to scheduled meeting or meeting with meetingId
  const joinMeetingId = async (meetingId: string) => {
    if (!module) return;

    await module.execute("dial_join", [meetingId]);

    //set time joined
    const ms = Date.now();
    setTimeJoined(ms);
  };

  //toggle in-call microphone
  const toggleAudioMuteAll = async () => {
    if (!module) return;

    const newState = !callStatus?.isMicMuted;
    await module.execute("call_mute_self", [newState]);
  };

  //toggle in-call camera
  const toggleVideoMuteAll = async () => {
    if (!module) return;

    const newState = !callStatus?.isCamMuted;
    await module.execute("call_mute_camera", [newState]);
  };

  const toggleAudioMuteEveryone = async () => {
    if (!module) return;

    const newState = !muteEveryone;
    await module.execute("call_mute_all", [newState]);
    
    setMuteEveryone(newState);
  };

  //toggle in-call wired-sharing, or cancel wireless or wired sharing
  const toggleSharing = async () => {
    if (!module) return;

    if (sharing?.isDirectPresentationConnected) {
      //zCommand Call Sharing Disconnect
      await module.execute("sharing_stop_wireless");
    } else if (sharing?.isSharingBlackMagic) {
      await module.execute("sharing_stop");
    } else await module.execute("sharing_start_hdmi");
  };

  //toggle "gallery", which is just routing different NVX routes to each display
  const toggleGallery = async () => {
    const sysMod = getModule(systemId, "System");
    if (!module) return;

    if (gallery) {
      await sysMod.execute("apply_default_routes");
      setGallery(false);
    } else {
      await sysMod.execute("route", ["Zoom_Output_1", "Display_1"]);
      await sysMod.execute("route", ["Zoom_Output_1", "Display_2"]);
      await sysMod.execute("route", ["Zoom_Output_1", "Display_3"]);
      setGallery(true);
    }
  };

  //adjust Shure IMX volume for fader 27
  const adjustMasterVolume = (value: number) => {
    const volumeMod = getModule(systemId, "Mixer");
    if (!volumeMod) return;

    volumeMod.execute("set_audio_gain_hi_res", [27, value]);
  };

  //adjust Shure IMX mute for fader 27
  const toggleMasterMute = () => {
    const volumeMod = getModule(systemId, "Mixer");
    if (!volumeMod) return;

    const newState = !volumeMute;
    volumeMod.execute("set_audio_mute", [27, newState]);
  };

  //adjust Shure IMX mute for fader 27
  const setMasterMute = (state: boolean) => {
    const volumeMod = getModule(systemId, "Mixer");
    if (!volumeMod) return;

    volumeMod.execute("set_audio_mute", [27, state]);
  };

  const listenToBindings = () => {
    clearSubs();

    const bindAndListen = (
      bindingName: string,
      mod: PlaceModuleBinding,
      setter: (val: any) => void,
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

    //bind local microphones for tag and min/max info
    bindAndListen(
      "microphones",
      getModule(systemId, "System"),
      (val: Microphone[]) => {
        console.log("mics enter?: ", mics);
        if (!val) return;

        SetMics(val);

        console.log("mics?: ", val);
      },
    );
    
    //bind selected camera
    bindAndListen('selected_camera', getModule(systemId, "System"), (camera_id: string) => {
      setSelectedCamera(camera_id);
    })

    //bind local cameras for control and preset info. first, get the list of available cameras
    bindAndListen(
      "available_cameras",
      getModule(systemId, "System"),
      (list) => {
        console.log("cams enter?", cams);
        if (!list) return;

        syncCameraSet(list);

        for (const camId of list) {
          // name from System status "Input/<camId>"
          bindAndListen(
            `input/${camId}`,
            getModule(systemId, "System"),
            (entry) => {
              const name =
                typeof entry === "string" ? entry : (entry?.name ?? camId);
              patchCam(camId, { camera_name: name });
            },
          );

          // presets from the camera module itself
          bindAndListen(
            "presets",
            getModule(systemId, camId),
            (presets = []) => {
              patchCam(camId, { presets });
            },
          );
        }

        console.log("cams?", cams);
      },
    );

    //bind call state for zoom, including mic and cam
    bindAndListen("Call", module, (val) => {
      let tempMic = null;
      let tempCam = null;

      console.log("Call status val from zoom module: ", val);
      if (val.Microphone.Mute != null) tempMic = val.Microphone.Mute;
      if (val.Microphone.Mute != null) tempCam = val.Camera.Mute;

      const data = {
        status: val.Status,
        isMicMuted: tempMic,
        isCamMuted: tempCam,
      };

      console.log("Call status data from zoom module: ", data);

      setCallStatus(data);
    });

    //bind sharing status for wireless and wired sharing
    bindAndListen("Sharing", module, setSharing);

    //bind and get bookings from Zoom Rooms
    bindAndListen("Bookings", module, (val: ZoomBooking[]) => {
      const nowMs = Date.now();

      const updatedBookings: ZoomBooking[] = val.flatMap<ZoomBooking>((z) => {
        const startMs = Date.parse(z.startTime);
        const endMs = Date.parse(z.endTime);
        if (Number.isNaN(startMs) || Number.isNaN(endMs)) return [];
        if (endMs <= nowMs) return []; // only drop meetings that already ended

        return [
          {
            ...z,
            startTime: String(Math.floor(startMs / 1000)),
            endTime: String(Math.floor(endMs / 1000)),
          },
        ];
      });

      setBookings(updatedBookings);
    });
    
    // bindAndListen("Participants", module, (val: ZoomParticipant[]) => {
    //
    //   setParticipants(val);
    // })

    //bind to Bookings module in placeOS
    // const bookingsMod = getModule(systemId, 'Bookings');
    // if (!bookingsMod) return;

    // bindAndListen('current_booking', bookingsMod, setCurrentMeeting);
    // bindAndListen('next_booking', bookingsMod, setNextMeeting);

    //bind to Recording module in placeOS
    const recordingsMod = getModule(systemId, "Recording");
    if (!recordingsMod) return;

    bindAndListen("active_recordings", recordingsMod, handleActiveRecordings);

    const volumeMod = getModule(systemId, "Mixer");
    if (!volumeMod) return;

    //DSP bindings for Shure IMX Room
    bindAndListen("audio_gain_hi_res_27", volumeMod, (val) => {
      const vol = Number(val);
      setVolume(vol);
    });

    bindAndListen("audio_mute_27", volumeMod, (val) => {
      const muteVal = val.toLowerCase();

      muteVal == "on" ? setVolumeMute(true) : setVolumeMute(false);
    });
  };

  return {
    volume,
    volumeMute,
    setMasterMute,
    adjustMasterVolume,
    toggleMasterMute,
    mics,
    selectedCamera,
    cams,
    muteEveryone,
    currentMeeting,
    nextMeeting,
    recording,
    callStatus,
    sharing,
    bookings,
    // participants,
    gallery,
    timeJoined,
    leave,
    joinPmi,
    joinMeetingId,
    toggleAudioMuteAll,
    toggleVideoMuteAll,
    toggleSharing,
    toggleGallery,
    toggleAudioMuteEveryone
  };
}
