import { useEffect, useMemo } from "react";
import {
  ControlStateProvider,
  useControlContext,
} from "../hooks/ControlStateContext";
import SplashScreen from "./SplashScreen";
import MainScreen from "./MainScreen";
import RoomStatusModal from "./RoomStatusModal";

// The transition modal always shows for at least this long from arming, even
// if the room reports ready instantly — a sub-second flash would read as a
// glitch, and on systems that ack optimistically it's the only honest
// "something is happening" feedback the user gets.
const TRANSITION_MIN_DWELL_MS = 4_000;
import { Header } from "./Header";
import { Navigate, useParams } from "react-router-dom";
import { ZoomProvider, useZoomContext } from "../hooks/ZoomContext";
import ClarityInitializer from "./ClarityInitializer.tsx";
import ZoomPromptHost from "./prompts/ZoomPromptHost";

export default function MainView() {
  const { system_id } = useParams();

  if (!system_id) return <Navigate to="/404" replace />;

  return (
    <ControlStateProvider systemId={system_id}>
        <ClarityInitializer/>
      <ZoomProvider systemId={system_id}>
        <MainViewInner />
        {/* Prompts (e.g. waiting_for_host) can fire on either screen */}
        <ZoomPromptHost />
      </ZoomProvider>
    </ControlStateProvider>
  );
}

function MainViewInner() {
  const { active, pendingPower, clearPendingPower } = useControlContext();
  const { outputs, connection } = useZoomContext();

  // System.power() sets `active` optimistically, so readiness also requires
  // every display output that reports a power state to have reached the
  // target. Outputs without a power reading yet don't block; if NO output
  // has one (or the room has no outputs), the condition is waived and the
  // minimum dwell alone paces the screen.
  const outputsReady = useMemo(() => {
    if (!pendingPower) return true;
    const want = pendingPower.target === "on";
    const reporting = Object.values(outputs).filter(
      (o) => typeof o.power === "boolean",
    );
    if (reporting.length === 0) return true;
    return reporting.every((o) => o.power === want);
  }, [outputs, pendingPower]);

  const ready =
    pendingPower !== null &&
    active === (pendingPower.target === "on") &&
    outputsReady;

  // Clear pacing: the modal shows immediately on arm (rendered whenever
  // pendingPower is set) and clears once ready AND the minimum dwell from
  // arming has elapsed. Not ready → no timer; readiness or the 60s
  // abandonment in useControlState ends the wait. pendingPower is a fresh
  // object per arm (seq), so a repeat toggle re-runs this effect and
  // re-anchors the dwell to the new armedAt.
  useEffect(() => {
    if (!pendingPower || !ready) return;
    const { seq, armedAt } = pendingPower;
    const remaining = Math.max(
      0,
      armedAt + TRANSITION_MIN_DWELL_MS - Date.now(),
    );
    const timer = setTimeout(() => clearPendingPower(seq), remaining);
    return () => clearTimeout(timer);
  }, [pendingPower, ready, clearPendingPower]);

  const statusVariant = pendingPower
    ? pendingPower.target === "on"
      ? "starting"
      : "stopping"
    : connection === "connecting"
      ? "loading"
      : null;
  return (
    <div className="first-step relative isolate flex h-screen w-full flex-col overflow-hidden bg-avit-bg">
      {/* One Header for both screens so it never remounts on the swap */}
      <div className="z-10 shrink-0">
        <Header />
      </div>
      {/* Key-based remount + entrance fade; the outgoing screen unmounts
          instantly, so an invisible screen can never be left behind. During
          a power transition the underlying screen stays mounted (and may
          crossfade splash ↔ main) behind the modal's scrim. */}
      <div
        key={active ? "main" : "splash"}
        className="screen-fade z-0 flex min-h-0 flex-1 flex-col"
      >
        {active ? <MainScreen /> : <SplashScreen />}
      </div>
      {/* One modal for all three loading states. pendingPower wins the
          message if it and cold-load connecting ever hold together; while
          offline the Header's OfflineModal takes over instead, so the two
          overlays can never stack ('loading' also can't coexist with it —
          connecting and offline are exclusive states). */}
      {statusVariant && connection !== "offline" && (
        <RoomStatusModal variant={statusVariant} />
      )}
    </div>
  );
}
