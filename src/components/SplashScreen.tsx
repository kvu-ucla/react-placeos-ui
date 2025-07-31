import { Header } from './Header';
import { ClassInfoCard } from './ClassInfoCard';
import { useControlContext } from "../hooks/ControlStateContext.tsx";

export default function SplashScreen() {
    const { system, togglePower} = useControlContext();

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center text-center">
            <Header
                roomName={system.name ?? 'Unknown Room'}
                systemOnline={true} // or some other logic from PlaceOS
            />
            <h1 className="text-6xl font-semibold mt-12 mb-12">Welcome to {system.name ?? 'Unknown Room'}</h1>
            
            <ClassInfoCard
            />
            <button onClick={togglePower} className="btn bg-avit-blue min-w-64 min-h-24 mt-9 mb-9 text-white px-6 py-2 rounded-lg text-3xl">Start Class</button>
            <p className="max-w-6xl text-3xl text-gray-500">
                This will start the <b className="text-avit-blue">Zoom Room</b> for this session. 
                Once started, you can <b className="text-avit-blue">join wirelessly from your personal device</b> to present. 
                Instructions on next screen.
            </p>
        </div>
    );
}
