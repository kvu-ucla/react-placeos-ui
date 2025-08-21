import {Header} from './Header';
import {ClassInfoCard} from './ClassInfoCard';
import { useControlContext } from "../hooks/ControlStateContext";
import {ModalProvider} from "../hooks/ModalContext.tsx";
import {useZoomModule} from "../hooks/useZoomModule.ts";

export default function SplashScreen() {
    const {system, togglePower} = useControlContext();
    const { currentMeeting } = useZoomModule();
    
    function Start() {
       togglePower();
       if (currentMeeting) {
           //todo 
       }
        // join(currentMeeting?.event_start);
    }

    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    
    const screenWidth = screen.width;
    const screenHeight = screen.height;
    const devicePixelRatio = window.devicePixelRatio;


    return (
        <ModalProvider>
            <div className="min-h-screen flex flex-col items-center text-center bg-gray-100 pb-32">
                <Header />

                <h1 className="text-6xl font-semibold mt-12 mb-12">Welcome to {system.name ?? 'Unknown Room'}</h1>
                <main className="flex-1 flex items-center justify-center px-4">
                    <ClassInfoCard />
                </main>

                <footer className="p-6">
                    <button onClick={Start}
                            className="btn btn-primary min-w-64 min-h-24 mt-9 mb-9 text-white px-6 py-2 rounded-lg text-3xl">Start
                        Class
                    </button>
                    <p className="max-w-6xl text-3xl text-gray-500">
                        This will start the <b className="text-avit-blue">Zoom Room</b> for this session.
                        Once started, you can <b className="text-avit-blue">join wirelessly from your personal device</b> to
                        present.
                        Instructions on next screen.
                        Window Resolution is {innerWidth} x {innerHeight}
                        Screen Resolution is {screenWidth} x {screenHeight}
                        Pixel Ratio is {devicePixelRatio}
                        
                    </p>
                </footer>
            </div>
            
            {/*<div className="min-h-screen bg-gray-100 flex flex-col items-center text-center">*/}
            {/*    <Header*/}
            {/*    />*/}
            {/*    <h1 className="text-6xl font-semibold mt-12 mb-12">Welcome to {system.name ?? 'Unknown Room'}</h1>*/}
            
            {/*    <ClassInfoCard*/}
            {/*    />*/}
            {/*    <button onClick={Start}*/}
            {/*            className="btn btn-primary min-w-64 min-h-24 mt-9 mb-9 text-white px-6 py-2 rounded-lg text-3xl">Start*/}
            {/*        Class*/}
            {/*    </button>*/}
            {/*    <p className="max-w-6xl text-3xl text-gray-500">*/}
            {/*        This will start the <b className="text-avit-blue">Zoom Room</b> for this session.*/}
            {/*        Once started, you can <b className="text-avit-blue">join wirelessly from your personal device</b> to*/}
            {/*        present.*/}
            {/*        Instructions on next screen.*/}
            {/*    </p>*/}
            {/*</div>*/}
        </ModalProvider>

    );
}
