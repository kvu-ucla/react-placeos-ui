import { useEffect, useState } from "react";
import {
  ControlStateProvider,
  useControlContext,
} from "../hooks/ControlStateContext";
import SplashScreen from "./SplashScreen";
import MainScreen from "./MainScreen";
import PowerTransitionScreen from "./PowerTransitionScreen";
import { Header } from "./Header";
import { Navigate, useParams } from "react-router-dom";
import { ZoomProvider } from "../hooks/ZoomContext";
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
  const { active, pendingPower } = useControlContext();

  // Anti-flash: only surface the transition screen if the power command is
  // still pending 300ms after it was armed — an instant `active` flip clears
  // pendingPower before this fires, so fast transitions never render it.
  const [showTransition, setShowTransition] = useState(false);
  useEffect(() => {
    if (!pendingPower) {
      setShowTransition(false);
      return;
    }
    const timer = setTimeout(() => setShowTransition(true), 300);
    return () => clearTimeout(timer);
  }, [pendingPower]);

  const transition = showTransition ? pendingPower : null;
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
