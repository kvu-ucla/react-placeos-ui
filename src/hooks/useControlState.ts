// src/hooks/useControlState.ts
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useBinder, useModuleExecute } from "./placeos";

// In-flight power transition. The System module exposes no transitional
// status var (only power/active/connected), so this is driven locally:
// armed in togglePower — the ONLY code path that changes System power —
// and cleared when `active` reaches the target or a generous timeout gives
// up. `seq` makes every arm a distinct object so a repeat toggle toward the
// SAME target still re-runs the lifecycle effects (a bare "on" → "on" would
// be a same-value set that React bails out of), and lets async paths
// (execute rejection, timeout) clear only their own attempt.
export type PendingPower = { target: "on" | "off"; seq: number } | null;

// Real hardware power-up can take many seconds; past this we assume the
// transition failed and fall back to the real state rather than strand the
// user on the loading screen.
const POWER_TRANSITION_TIMEOUT_MS = 60_000;

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
  /** Direction of an in-flight power transition, null when settled */
  pendingPower: PendingPower;
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
  const [pendingPower, setPendingPower] = useState<PendingPower>(null);
  const pendingSeqRef = useRef(0);

  const powerRef = useRef(false);
  const activeRef = useRef(false);
  const volumeRef = useRef(0);
  const mutedRef = useRef(false);
  const connectedRef = useRef(false);

  const execute = useModuleExecute(systemId);

  useBinder(
    systemId,
    (binder) => {
      const bind = (name: keyof SystemState, onChange: (val: any) => void) => {
        binder.listen(moduleAlias, name, (val) => {
          setSystem((prev) => ({ ...prev, [name]: val }));
          onChange(val);
        });
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
    },
    [moduleAlias],
  );

  // Clear the pending transition when `active` reaches the target (instant
  // flips clear before the screen's 300ms anti-flash delay ever shows it),
  // or give up after the timeout so the user is never stranded.
  useEffect(() => {
    if (!pendingPower) return;
    if (active === (pendingPower.target === "on")) {
      setPendingPower(null);
      return;
    }
    // The timeout belongs to this arm: cleanup clears it whenever a newer
    // arm replaces the object, so it can only fire for the latest attempt;
    // the seq guard is a backstop.
    const { seq } = pendingPower;
    const timer = setTimeout(() => {
      toast.error(
        "The room is taking longer than expected — showing current status.",
      );
      setPendingPower((cur) => (cur?.seq === seq ? null : cur));
    }, POWER_TRANSITION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingPower, active]);

  const togglePower = async () => {
    const target = !activeRef.current;
    const seq = ++pendingSeqRef.current;
    setPendingPower({ target: target ? "on" : "off", seq });
    try {
      await execute(moduleAlias, "power", [target]);
    } catch (err) {
      // Command never reached the backend — no transition is coming from
      // THIS attempt. Clear only our own arm: a stale rejection must not
      // kill a newer retry that is still in flight.
      setPendingPower((cur) => (cur?.seq === seq ? null : cur));
      throw err;
    }
  };

  const setVolume = async (val: number) => {
    await execute(moduleAlias, "volume", [val]);
  };

  const toggleMute = async () => {
    await execute(moduleAlias, "mute", [!mutedRef.current]);
  };

  return {
    power,
    active,
    mute,
    volume,
    system,
    connected,
    pendingPower,
    toggleMute,
    setVolume,
    togglePower,
  };
}
