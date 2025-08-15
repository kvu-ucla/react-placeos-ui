import {ControlStateProvider, useControlContext} from "../hooks/ControlStateContext.tsx";
import SplashScreen from "./SplashScreen.tsx";
import MainScreen from "./MainScreen.tsx";
import {useParams} from "react-router-dom";

export default function MainView() {
    const {active} = useControlContext();

    const { system_id } = useParams();
    const systemId = system_id ?? "";
    
    return (
        <ControlStateProvider systemID={systemId}>
            {active} ? <MainScreen/> : <SplashScreen/>
        </ControlStateProvider>
        
    );
}
