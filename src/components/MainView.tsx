import {ControlStateProvider, useControlContext} from "../hooks/ControlStateContext.tsx";
import SplashScreen from "./SplashScreen.tsx";
import MainScreen from "./MainScreen.tsx";
import {Navigate, useParams} from "react-router-dom";

export default function MainView() {
    const { system_id } = useParams();

    // If your route guarantees :system_id, you can assert; otherwise guard:
    if (!system_id) return <Navigate to="/404" replace />; // or return null / a fallback

    return (
        <ControlStateProvider systemID={system_id}>
            <MainViewInner />
        </ControlStateProvider>
    );
}

function MainViewInner() {
    const { active } = useControlContext();
    return active ? <MainScreen /> : <SplashScreen />;
}

