// src/hooks/useControlState.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "../notify";
import { useBinder, useModuleExecute } from "./placeos";

// In-flight power transition. The System module exposes no transitional
// status var, and its power() sets `active` OPTIMISTICALLY (before the
// hardware actually powers), so `active` alone can't gate the transition
// screen. Ownership is split: this hook arms (togglePower is the ONLY code
// path that changes System power) and owns the 60s abandonment timeout and
// the execute-rejection clear; MainViewInner owns the readiness gate
// (active + display power + minimum dwell) and clears via
// clearPendingPower, because display outputs live in ZoomContext, which is
// nested INSIDE ControlStateProvider — reading them here would be a
// circular provider dependency. `seq` makes every arm a distinct object so
// a repeat toggle toward the SAME target still re-runs the lifecycle
// effects (a bare "on" → "on" would be a same-value set that React bails
// out of), and lets async paths clear only their own attempt. `armedAt`
// anchors the minimum-dwell timer.
export type PendingPower = {
  target: "on" | "off";
  seq: number;
  armedAt: number;
} | null;

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

export interface SupportContact {
  phone: string | null;
  display: string | null;
}

export interface SupportCard {
  title: string;
  description: string;
  phone: string | null;
  href: string | null;
}

// The `help` status is meet.cr's Hash(String, HelpPage); pages may carry
// unmapped `phone`/`phone_display` keys authored in the system settings YAML.
// Any malformed shape must resolve to nulls/empty, never throw.
function pagePhone(page: Record<string, unknown>): SupportContact {
  const phone =
    typeof page.phone === "string" && page.phone.trim() !== ""
      ? page.phone
      : null;
  if (!phone) return { phone: null, display: null };
  const display =
    typeof page.phone_display === "string" && page.phone_display.trim() !== ""
      ? page.phone_display
      : phone;
  return { phone, display };
}

export function extractSupportContact(help: unknown): SupportContact {
  const none: SupportContact = { phone: null, display: null };
  if (typeof help !== "object" || help === null) return none;
  const support = (help as Record<string, unknown>).support;
  if (typeof support !== "object" || support === null) return none;
  return pagePhone(support as Record<string, unknown>);
}

// Every help page with a title becomes a contact card, in YAML key order.
export function extractSupportCards(help: unknown): SupportCard[] {
  if (typeof help !== "object" || help === null) return [];
  const cards: SupportCard[] = [];
  for (const value of Object.values(help as Record<string, unknown>)) {
    if (typeof value !== "object" || value === null) continue;
    const page = value as Record<string, unknown>;
    if (typeof page.title !== "string" || page.title.trim() === "") continue;
    const { phone, display } = pagePhone(page);
    cards.push({
      title: page.title,
      description: typeof page.content === "string" ? page.content : "",
      phone: display,
      href: phone ? `tel:${phone}` : null,
    });
  }
  return cards;
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
  /** AV support contact from the System module's help["support"] page */
  supportPhone: string | null;
  supportPhoneDisplay: string | null;
  /** One card per help page with a title, YAML order; empty when unset */
  supportCards: SupportCard[];
  /** In-flight power transition, null when settled */
  pendingPower: PendingPower;
  /** Clear a pending transition — no-op unless seq matches the current arm */
  clearPendingPower: (seq: number) => void;
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
  const [supportContact, setSupportContact] = useState<SupportContact>({
    phone: null,
    display: null,
  });
  const [supportCards, setSupportCards] = useState<SupportCard[]>([]);
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

      binder.listen(moduleAlias, "help", (val) => {
        setSupportContact(extractSupportContact(val));
        setSupportCards(extractSupportCards(val));
      });
    },
    [moduleAlias],
  );

  // Clear the pending transition when `active` reaches the target (instant
  // flips clear before the screen's 300ms anti-flash delay ever shows it),
  // or give up after the timeout so the user is never stranded.
  // Abandonment timeout only — readiness clearing (active + display power +
  // dwell) lives in MainViewInner, see the PendingPower comment above. The
  // timer belongs to this arm: cleanup clears it whenever a newer arm
  // replaces the object, so it can only fire for the latest attempt; the
  // seq guard is a backstop.
  useEffect(() => {
    if (!pendingPower) return;
    const { seq } = pendingPower;
    const timer = setTimeout(() => {
      notify.error(
        "The room is taking longer than expected — showing current status.",
      );
      setPendingPower((cur) => (cur?.seq === seq ? null : cur));
    }, POWER_TRANSITION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingPower]);

  const clearPendingPower = useCallback((seq: number) => {
    setPendingPower((cur) => (cur?.seq === seq ? null : cur));
  }, []);

  const togglePower = async () => {
    const target = !activeRef.current;
    const seq = ++pendingSeqRef.current;
    setPendingPower({ target: target ? "on" : "off", seq, armedAt: Date.now() });
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
    supportPhone: supportContact.phone,
    supportPhoneDisplay: supportContact.display,
    supportCards,
    pendingPower,
    clearPendingPower,
    toggleMute,
    setVolume,
    togglePower,
  };
}
