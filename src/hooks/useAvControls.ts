// src/hooks/useAvControls.ts
// Local AV control state (cameras, displays, inputs, DSP audio, recording)
// bound from the System / Mixer / Recording PlaceOS modules.
import { useState } from "react";
import { showSystem } from "@placeos/ts-client";
import { useBinder, useModuleExecute, type Binder } from "./placeos";

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

export interface DspMicrophone {
  name: string;
  id: string;
  level: number;
  is_muted: boolean;
  min_level: number;
  max_level: number;
}

export interface Camera {
  camera_id: string;
  camera_name: string;
  presets: string[];
}

export interface Output {
  ref: string;
  source: string;
  locked: boolean;
  name: string;
  inputs: string[];
  mute: boolean;
  power: boolean;
}

export interface Input {
  ref: string;
  source: string;
  locked: boolean;
  name: string;
  icon: string;
}

export type CameraMap = Record<string, Camera>;
export type OutputMap = Record<string, Output>;
export type InputMap = Record<string, Input>;
export type MicsMap = Record<string, DspMicrophone>;

export const SYSTEM_FEATURE = {
  Recording: 'recording',
  Booking: 'booking',
  AV: 'av',
  Lighting: 'lighting',
  HVAC: 'hvac',
  CameraControl: 'camera_control',
  PTZ: 'ptz',
  Signage: 'signage',
  AccessControl: 'access_control',
  Occupancy: 'occupancy',
  BruinCast: 'bruincast',
};

// Master mix fader on the Shure IMX Room DSP
const MASTER_FADER = 27;

export function useAvControls(systemId: string) {
  const [volume, setVolume] = useState<number>();
  const [volumeMute, setVolumeMute] = useState<boolean>();
  const [recording, setRecording] = useState(false);
  const [gallery, setGallery] = useState<boolean>(true);
  const [mics, setMics] = useState<MicsMap>({});
  const [cams, setCams] = useState<CameraMap>({});
  const [outputs, setOutputs] = useState<OutputMap>({});
  const [inputs, setInputs] = useState<InputMap>({});
  const [selectedCamera, setSelectedCamera] = useState<string>();
  const [getFeatures, setActiveFeatures] = useState<string[]>();

  const execute = useModuleExecute(systemId);

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

  useBinder(systemId, (binder: Binder) => {
    //bind selected camera
    binder.listen<string>("System", "selected_camera", (camera_id) => {
      setSelectedCamera(camera_id);
    });

    //bind local cameras for control and preset info. first, get the list of available cameras
    binder.listen<string[] | null>("System", "available_cameras", (list) => {
      if (!list) return;

      syncCameraSet(list);

      for (const camId of list) {
        // name from System status "input/<camId>"
        binder.listen(`System`, `input/${camId}`, (entry: unknown) => {
          const name =
            typeof entry === "string"
              ? entry
              : ((entry as { name?: string })?.name ?? camId);
          patchCam(camId, { camera_name: name });
        });

        // presets from the camera module itself
        binder.listen<string[]>(camId, "presets", (presets = []) => {
          patchCam(camId, { presets });
        });
      }
    });

    //bind local displays for control and device info. first, get the list of available displays
    binder.listen<string[] | null>("System", "available_outputs", (list) => {
      if (!list) return;

      for (const outputId of list) {
        // name from System status "output/<outputId>"
        binder.listen<Partial<Output>>(
          "System",
          `output/${outputId}`,
          (newOutput) => {
            setOutputs((prevOutputs) => ({
              ...prevOutputs,
              [outputId]: {
                ...prevOutputs[outputId],
                ...newOutput, // Update with new output data
              },
            }));
          },
        );

        //display video mute state
        binder.listen<boolean>(outputId, "mute", (newMute) => {
          setOutputs((prevOutputs) => ({
            ...prevOutputs,
            [outputId]: {
              ...prevOutputs[outputId],
              mute: newMute, // Add/update just the mute property
            },
          }));
        });

        //display power state
        binder.listen<boolean>(outputId, "power", (newPower) => {
          setOutputs((prevOutputs) => ({
            ...prevOutputs,
            [outputId]: {
              ...prevOutputs[outputId],
              power: newPower, // Add/update just the power property
            },
          }));
        });
      }
    });

    //bind local inputs for control and device info. first, get the list of available inputs
    binder.listen<string[] | null>("System", "inputs", (list) => {
      if (!list) return;

      //filter out camera inputs
      const nonCameraInputs = list.filter(
        (input: string) => !input.toLowerCase().includes("camera"),
      );

      for (const inputId of nonCameraInputs) {
        // name from System status "input/<inputId>"
        binder.listen<Input>("System", `input/${inputId}`, (newInput) => {
          setInputs((prevInputs) => ({
            ...prevInputs,
            [inputId]: newInput,
          }));
        });
      }
    });

    //bind to Recording (Epiphan) module in placeOS
    binder.listen<string[] | null>(
      "Recording",
      "active_recordings",
      (data) => {
        setRecording(!!(data && data.length > 0));
      },
    );

    //DSP bindings for Shure IMX Room master fader
    binder.listen("Mixer", `audio_gain_hi_res_${MASTER_FADER}`, (val) => {
      setVolume(Number(val));
    });

    binder.listen<string>("Mixer", `audio_mute_${MASTER_FADER}`, (val) => {
      setVolumeMute(val?.toLowerCase() === "on");
    });

    //bind local microphones for tag and min/max info
    binder.listen<Microphone[] | null>("System", "microphones", (list) => {
      if (!list) return;

      for (const micId of list) {
        // bind to dsp level state
        binder.listen<number>(
          "Mixer",
          `audio_gain_hi_res_0${micId.level_id[0]}`,
          // dsp current value
          (newVal) => {
            setMics((prevMics) => ({
              ...prevMics,
              [micId.level_id[0]]: {
                ...prevMics[micId.level_id[0]], // Preserve existing state
                name: micId.name,
                id: micId.level_id[0],
                level: newVal,
                min_level: micId.min_level,
                max_level: micId.max_level,
              },
            }));
          },
        );

        // bind to dsp mute state
        binder.listen<string>(
          "Mixer",
          `audio_mute_0${micId.mute_id[0]}`,
          //dsp current mute state as a string
          (isMuted) => {
            setMics((prevMics) => ({
              ...prevMics,
              [micId.level_id[0]]: {
                ...prevMics[micId.level_id[0]], // Preserve existing state
                is_muted: isMuted?.toLowerCase() === "on",
              },
            }));
          },
        );
      }
    });

    //get system features
    binder.track(
      showSystem(systemId).subscribe((sys) => {
        const active = Object.values(SYSTEM_FEATURE).filter((f) =>
          sys.features.includes(f),
        );
        setActiveFeatures(active);
      }),
    );
  });

  //toggle "gallery"/"participant", which is just routing different NVX routes to each display
  const toggleGallery = async () => {
    if (gallery) {
      await execute("System", "apply_default_routes");
      setGallery(false);
    } else {
      await execute("System", "apply_participant_routes");
      setGallery(true);
    }
  };

  //adjust Shure IMX volume for the master fader
  const adjustMasterVolume = (value: number) => {
    execute("Mixer", "set_audio_gain_hi_res", [MASTER_FADER, value]);
  };

  //toggle Shure IMX mute for the master fader
  const toggleMasterMute = () => {
    execute("Mixer", "set_audio_mute", [MASTER_FADER, !volumeMute]);
  };

  //set Shure IMX mute for the master fader
  const setMasterMute = (state: boolean) => {
    execute("Mixer", "set_audio_mute", [MASTER_FADER, state]);
  };

  //adjust Shure IMX volume for generic fader
  const adjustDspVolume = (value: number, id: string) => {
    execute("Mixer", "set_audio_gain_hi_res", [Number(id), value]);
  };

  //adjust Shure IMX toggle mute for generic fader
  const toggleDspMute = (id: string) => {
    execute("Mixer", "set_audio_mute", [Number(id), !mics[id].is_muted]);
  };

  return {
    volume,
    volumeMute,
    recording,
    gallery,
    mics,
    cams,
    outputs,
    inputs,
    selectedCamera,
    getFeatures,
    toggleGallery,
    adjustMasterVolume,
    toggleMasterMute,
    setMasterMute,
    adjustDspVolume,
    toggleDspMute,
  };
}
