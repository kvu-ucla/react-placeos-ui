import { useEffect, useMemo, useState } from "react";
import {
  ControlStateProvider,
  useControlContext,
} from "../hooks/ControlStateContext";
import SplashScreen from "./SplashScreen";
import MainScreen from "./MainScreen";
import PowerTransitionScreen from "./PowerTransitionScreen";

// Don't render the transition screen at all if the room is fully ready
// within this window (anti-flash for instant transitions).
const TRANSITION_SHOW_DELAY_MS = 300;
// Once the screen IS shown, hold it at least this long from arming so a
// near-instant readiness flip doesn't strobe splash → loading → main.
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
  const { outputs } = useZoomContext();

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

  // Show/clear pacing. pendingPower is a fresh object per arm (seq), so a
  // repeat toggle re-runs this effect and re-anchors both timers to the new
  // armedAt; if the screen is already up, re-arming leaves it up.
  const [showTransition, setShowTransition] = useState(false);
  useEffect(() => {
    if (!pendingPower) {
      setShowTransition(false);
      return;
    }
    const { seq, armedAt } = pendingPower;
    if (ready && !showTransition) {
      // Fully ready before the screen ever showed — skip it entirely
      clearPendingPower(seq);
      return;
    }
    if (ready) {
      // Shown and ready — hold until the minimum dwell (from arming) is met
      const remaining = Math.max(
        0,
        armedAt + TRANSITION_MIN_DWELL_MS - Date.now(),
      );
      const timer = setTimeout(() => clearPendingPower(seq), remaining);
      return () => clearTimeout(timer);
    }
    if (!showTransition) {
      // Not ready — surface the screen once the show delay elapses
      const remaining = Math.max(
        0,
        armedAt + TRANSITION_SHOW_DELAY_MS - Date.now(),
      );
      const timer = setTimeout(() => setShowTransition(true), remaining);
      return () => clearTimeout(timer);
    }
    // Shown and not ready — wait for readiness or the 60s abandonment
  }, [pendingPower, ready, showTransition, clearPendingPower]);

  const transition = showTransition && pendingPower ? pendingPower.target : null;
  return (
    <div className="first-step relative isolate flex h-screen w-full flex-col overflow-hidden bg-avit-bg">
      {/* One Header for both screens so it never remounts on the swap */}
      <div className="z-10 shrink-0">
        <Header />
      </div>
      {/* Key-based remount + entrance fade; the outgoing screen unmounts
          instantly, so an invisible screen can never be left behind. The
          power-transition screen is a third state of the same crossfade. */}
      <div
        key={transition ? "transition" : active ? "main" : "splash"}
        className="screen-fade z-0 flex min-h-0 flex-1 flex-col"
      >
        {transition ? (
          <PowerTransitionScreen direction={transition} />
        ) : active ? (
          <MainScreen />
        ) : (
          <SplashScreen />
        )}
      </div>
    </div>
  );
}
