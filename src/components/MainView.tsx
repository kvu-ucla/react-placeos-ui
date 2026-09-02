import {
  ControlStateProvider,
  useControlContext,
} from "../hooks/ControlStateContext";
import SplashScreen from "./SplashScreen";
import MainScreen from "./MainScreen";
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
  const { active } = useControlContext();
  return (
    <div className="first-step relative isolate flex h-screen w-full flex-col overflow-hidden bg-avit-bg">
      {/* One Header for both screens so it never remounts on the swap */}
      <div className="z-10 shrink-0">
        <Header />
      </div>
      {/* Key-based remount + entrance fade; the outgoing screen unmounts
          instantly, so an invisible screen can never be left behind */}
      <div
        key={active ? "main" : "splash"}
        className="screen-fade z-0 flex min-h-0 flex-1 flex-col"
      >
        {active ? <MainScreen /> : <SplashScreen />}
      </div>
    </div>
  );
}
