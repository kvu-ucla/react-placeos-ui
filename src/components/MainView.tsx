import {ControlStateProvider, useControlContext} from "../hooks/ControlStateContext";
import SplashScreen from "./SplashScreen";
import MainScreen from "./MainScreen";
import {Navigate, useParams} from "react-router-dom";
import {ZoomProvider} from "../hooks/ZoomContext";

export default function MainView() {
    const { system_id } = useParams();

    if (!system_id) return <Navigate to="/404" replace />;


    return (
        <ControlStateProvider systemId={system_id}>
            <ZoomProvider systemId={system_id}>
                <MainViewInner />
            </ZoomProvider>
        </ControlStateProvider>
    );
}

function MainViewInner() {
    const { active } = useControlContext();
    return active ? <MainScreen /> : <SplashScreen />;
}

