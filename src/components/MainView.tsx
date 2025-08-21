import { useControlContext} from "../hooks/ControlStateContext.tsx";
import SplashScreen from "./SplashScreen.tsx";
import MainScreen from "./MainScreen.tsx";

export default function MainView() {
    const { active } = useControlContext();

    return (
 active ? <MainScreen /> : <SplashScreen />
    );
}


