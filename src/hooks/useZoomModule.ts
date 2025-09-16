// src/hooks/useZoomModule.ts
import { useEffect, useState } from "react";
import { getModule, PlaceModuleBinding } from "@placeos/ts-client";
import {useParams} from "react-router-dom";

type CallState =
  | "NOT_IN_MEETING"
  | "CONNECTING_MEETING"
  | "IN_MEETING"
  | "LOGGED_OUT"
  | "UNKNOWN";

type AudioState = "AUDIO_MUTED" | "AUDIO_UNMUTED";
type MediaType = "audio" | "video";

interface ZoomParticipant {
  user_id: number;
  user_name: string;
  audio_state: AudioState;
  video_has_source: boolean;
  video_is_sending: boolean;
  isCohost: boolean;
  is_host: boolean;
  is_in_waiting_room: boolean;
  hand_status: {
    is_raise_hand: boolean;
    is_valid: string;
    time_stamp: string;
  };
}

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

export interface ZoomBooking {
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

interface Camera {
  camera_id: string;
  camera_name: string;
  presets: string[];
}

interface Output {
  ref: string;
  source: string;
  locked: boolean;
  name: string;
  inputs: string[];
  mute: boolean;  
  power: boolean;
}

interface Input {
  ref: string;
  source: string;
  locked: boolean;
  name: string;
  icon: string;
}

let subscriptions: (() => void)[] = [];

export function useZoomModule(systemId: string, mod = "ZoomCSAPI") {
  const [module, setModule] = useState<PlaceModuleBinding>();
  const [currentMeeting, setCurrentMeeting] = useState<ZoomBooking>();
  const [nextMeeting, setNextMeeting] = useState<ZoomBooking>();
  const [sharing, setSharing] = useState<SharingStatus>();
  const [timeJoined, setTimeJoined] = useState<number>(0);
  const [recording, setRecording] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>();
  const [bookings, setBookings] = useState<ZoomBooking[]>();
  const [volume, setVolume] = useState<number>();
  const [volumeMute, setVolumeMute] = useState<boolean>();
  const [gallery, setGallery] = useState<boolean>(true);
  const [mics, SetMics] = useState<Microphone[]>([]);
  const [cams, setCams] = useState<CameraMap>({});
  const [outputs, setOutputs] = useState<OutputMap>({});
  const [inputs, setInputs] = useState<InputMap>({});
  const [selectedCamera, setSelectedCamera] = useState<string>();
  const [muteEveryone, setMuteEveryone] = useState<boolean>();
  const [participants, setParticipants] = useState<ZoomParticipant[]>([]);

  type CameraMap = Record<string, Camera>;
  type OutputMap = Record<string, Output>;
  type InputMap = Record<string, Input>;

  const { system_id = 'sys-1234' }  = useParams();

  const handleActiveRecordings = (data: string[] | null | undefined) => {
    const value = !!(data && data.length > 0);
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
  const joinPmi = async () => {
    if (!module) return;

    await module.execute("dial_start_pmi");
  };

  //connect to scheduled meeting or meeting with meetingId
  const joinMeetingId = async (meetingId: string) => {
    if (!module) return;

    await module.execute("dial_join", [meetingId]);
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

  //toggle mute all participants
  const toggleAudioMuteEveryone = async () => {
    if (!module) return;

    const newState = !muteEveryone;
    await module.execute("call_mute_all", [newState]);

    setMuteEveryone(newState);
  };

  //toggle individual participant audio
  const participantMediaMute = async (type: MediaType, participant_id: number) => {
    if (!module) return;

    // Find the participant
    const participant = participants.find(x => x.user_id === participant_id);

    if (!participant) {
      console.error(`Participant with ID ${participant_id} not found`);
      return;
    }

    if (type === "audio") {
      const newAudio = participant.audio_state !== "AUDIO_MUTED";
      await module.execute("call_mute_participant_audio", [newAudio, participant_id.toString()]);
    } else if (type === "video") {
      const newVideo = !participant.video_is_sending;
      await module.execute("call_mute_participant_video", [newVideo, participant_id.toString()]);
    }
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

      const binding = mod.binding(bindingName);
      if (!binding) return;

      const bound = binding.bind();
      subscriptions.push(bound);

      const sub = binding.listen().subscribe((v) => {
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
    bindAndListen(
      "selected_camera",
      getModule(systemId, "System"),
      (camera_id: string) => {
        setSelectedCamera(camera_id);
      },
    );

    //bind local cameras for control and preset info. first, get the list of available cameras
    bindAndListen(
      "available_cameras",
      getModule(systemId, "System"),
      (list) => {
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
      },
    );

    //bind local displays for control and device info. first, get the list of available displays
    bindAndListen(
        "available_outputs",
        getModule(systemId, "System"),
        (list) => {
          if (!list) return;

          for (const outputId of list) {
            // name from System status "Output/<outputId>"
            bindAndListen(
                `output/${outputId}`,
                getModule(systemId, "System"),
                (newOutput) => {
                  setOutputs(prevOutputs => ({
                    ...prevOutputs,
                    [outputId]: {
                      ...prevOutputs[outputId], 
                      ...newOutput // Update with new output data
                    }
                  }));
                }
            );

            //display video mute state
            bindAndListen(
                `mute`,
                getModule(systemId, outputId),
                (newMute) => {
                  setOutputs(prevOutputs => ({
                    ...prevOutputs,
                    [outputId]: {
                      ...prevOutputs[outputId], 
                      mute: newMute // Add/update just the mute property
                    }
                  }));
                }
            );

            //display power state 
            bindAndListen(
                `power`,
                getModule(systemId, outputId),
                (newPower) => {
                  setOutputs(prevOutputs => ({
                    ...prevOutputs,
                    [outputId]: {
                      ...prevOutputs[outputId], 
                      power: newPower // Add/update just the power property
                    }
                  }));
                }
            );
          }
        },
    );

    //bind local inputs for control and device info. first, get the list of available inputs
    bindAndListen(
        "inputs",
        getModule(systemId, "System"),
        (list) => {
          if (!list) return;

          //filter out camera inputs
          const nonCameraInputs = list.filter( (input: string) =>
              !input.toLowerCase().includes('camera')
          );

          for (const inputId of nonCameraInputs) {
            // name from System status "input/<inputId>"
            bindAndListen(
                `input/${inputId}`,
                getModule(systemId, "System"),
                (newInput) => {
                  setInputs(prevInputs => ({
                    ...prevInputs,
                    [inputId]: newInput
                  }));
                }
            );
          }
        },
    );

    //bind call state for zoom, including mic and cam
    
    bindAndListen("Call", module, (val) => {
      let tempMic = null;
      let tempCam = null;
      
      if (val.Microphone.Mute != null) tempMic = val.Microphone.Mute;
      if (val.Microphone.Mute != null) tempCam = val.Camera.Mute;

      const data = {
        status: val.Status,
        isMicMuted: tempMic,
        isCamMuted: tempCam,
      };

      setCallStatus(data);
    });

    //bind sharing status for wireless and wired sharing
    bindAndListen("Sharing", module, setSharing);

    //
    bindAndListen("meeting_started_time", module, setTimeJoined);

    //bind and get bookings from Zoom Rooms
    bindAndListen("Bookings", module, setBookings);
    bindAndListen("Participants", module, setParticipants);

    //bind to Recording (Epiphan) module in placeOS
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
    system_id,
    cams,
    outputs,
    inputs,
    muteEveryone,
    timeJoined,
    currentMeeting,
    nextMeeting,
    recording,
    callStatus,
    sharing,
    bookings,
    participants,
    gallery,
    leave,
    joinPmi,
    joinMeetingId,
    toggleAudioMuteAll,
    toggleVideoMuteAll,
    toggleSharing,
    toggleGallery,
    toggleAudioMuteEveryone,
    participantMediaMute
  };
}
