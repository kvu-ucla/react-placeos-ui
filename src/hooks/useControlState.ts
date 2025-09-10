// src/hooks/useControlState.ts
import { useEffect, useRef, useState } from "react";
import { Subscription } from "rxjs";
import { getModule, querySystems, showSystem } from "@placeos/ts-client";

export interface EnvironmentSource {
  name: string;
  states: string[];
  state: string;
}

export interface RoomAccessory {
  name: string;
  module: string;
  controls: RoomAccessoryAction[];
}

export interface RoomAccessoryAction {
  name: string;
  icon: string;
  function_name: string;
  arguments: any[];
}

export interface LightScene {
  id: number;
  name: string;
  icon: string;
  opacity: number;
}

export interface TabDetails {
  icon: string;
  name: string;
  inputs: string[];
  help: string;
  controls: string;
  type: string;
}

export interface RoomInput {
  id?: string;
  ref: string;
  name: string;
  type: string;
  mod: string;
  index?: string;
  volume: number;
  mute: boolean;
  locked: boolean;
  routes: string[];
  outputs: string[];
  hidden?: boolean;
  presentable?: boolean;
}

export interface RoomOutput {
  id?: string;
  ref: string;
  name: string;
  type: string;
  mod: string;
  mute: boolean;
  volume: number;
  locked: boolean;
  source: string;
  inputs: string[];
  following: string;
  hidden?: boolean;
}

export interface SystemState {
  name?: string;
  power?: boolean;
  active?: boolean;
  connected?: boolean;
  selected_tab?: string;
  selected_input?: string;
  mute?: boolean;
  volume?: number;
}

export interface ControlState {
  system: SystemState;
  power?: boolean;
  active?: boolean;
  connected?: boolean;
  mute?: boolean;
  volume?: number;
  togglePower: () => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
}

export function useControlState(
  systemId: string,
  moduleAlias = "System",
): ControlState {
  const [power, setPower] = useState(false);
  const [active, setActive] = useState(false);
  const [volume, setVolumeState] = useState(0);
  const [mute, setMuted] = useState(false);
  const [system, setSystem] = useState<SystemState>({});
  const [connected, setConnected] = useState<boolean>(false);

  const powerRef = useRef(false);
  const activeRef = useRef(false);
  const volumeRef = useRef(0);
  const mutedRef = useRef(false);
  const connectedRef = useRef(false);
  const subs = useRef<Subscription[]>([]);

  useEffect(() => {
    querySystems({ limit: 10 })
      .toPromise()
      .then((res) => {
        console.log(res!.data);
      });

    showSystem(systemId).subscribe((sys) => {
      console.log("System object: ", sys);
    });

    const nvxMod = getModule(systemId, "Decoder_1");

    const nvxBinding = nvxMod.binding("subscriptions");
    const nvxSub = nvxBinding.listen().subscribe((val) => {
      console.log("NVX RX 1 state", val);
    });
    subs.current.push(nvxSub);
    const nvxUnbind = nvxBinding.bind();
    subs.current.push(new Subscription(nvxUnbind));

    const camMod = getModule(systemId, "Display_2");

    const camBinding = camMod.binding("connected");
    const camSub = camBinding.listen().subscribe((val) => {
      console.log("camera 1 state", val);
    });
    subs.current.push(camSub);
    const camUnbind = camBinding.bind();
    subs.current.push(new Subscription(camUnbind));

    const recMod = getModule(systemId, "Recording_1");

    const recBinding = recMod.binding("active_recordings");
    const recSub = recBinding.listen().subscribe((val) => {
      console.log("recSub active recordings ", val);
    });
    subs.current.push(recSub);
    const recUnbind = camBinding.bind();
    subs.current.push(new Subscription(recUnbind));

    const mod = getModule(systemId, moduleAlias);

    const bind = (name: keyof SystemState, onChange: (val: any) => void) => {
      const binding = mod.binding(name);
      const sub = binding.listen().subscribe((val) => {
        setSystem((prev) => ({ ...prev, [name]: val }));
        onChange(val);
      });
      subs.current.push(sub);

      // Call bind but don't push to subs, since unbind is not a Subscription
      const unbind = binding.bind();
      subs.current.push(new Subscription(unbind));
    };

    bind("power", (val) => {
      if (typeof val === "boolean") {
        powerRef.current = val;
        setPower(val);
      }
    });

    bind("active", (val) => {
      if (typeof val === "boolean") {
        activeRef.current = val;
        setActive(val);
      }
    });

    bind("connected", (val) => {
      if (typeof val === "boolean") {
        connectedRef.current = val;
        setConnected(val);
      }
    });

    bind("volume", (val) => {
      if (typeof val === "number") {
        volumeRef.current = val;
        setVolumeState(val);
      }
    });

    bind("mute", (val) => {
      if (typeof val === "boolean") {
        mutedRef.current = val;
        setMuted(val);
      }
    });

    bind("name", () => {});
    bind("selected_input", () => {});
    bind("selected_tab", () => {});

    return () => {
      subs.current.forEach((s) => s.unsubscribe());
      subs.current = [];
    };
  }, [systemId, moduleAlias]);

  const togglePower = async () => {
    const system = getModule(systemId, moduleAlias);
    await system.execute("power", [!activeRef.current]);

    const mixer = getModule(systemId, 'Mixer_1');
    
    const zoom = getModule(systemId, 'ZoomCSAPI_1');

    console.log("activeRef State", activeRef.current);
    
    if (activeRef.current) {
      mixer.execute("set_preset", [1]);
    }
    else
    {
      await mixer.execute("set_preset", [2]);
      await zoom.execute("call_disconnect");
    }
  };

  const setVolume = async (val: number) => {
    const mod = getModule(systemId, moduleAlias);
    await mod.execute("volume", [val]);
  };

  const toggleMute = async () => {
    const mod = getModule(systemId, moduleAlias);
    await mod.execute("mute", [!mutedRef.current]);
  };

  return {
    power,
    active,
    mute,
    volume,
    system,
    connected,
    toggleMute,
    setVolume,
    togglePower,
  };
}
