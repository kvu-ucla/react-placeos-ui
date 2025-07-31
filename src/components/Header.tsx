// src/components/Header.tsx
import Clock from "./Clock";
import {useControlContext} from "../hooks/ControlStateContext.tsx";
import {CircleX, Compass, House, LifeBuoy, Settings2} from "lucide-react";

interface HeaderProps {
    roomName: string;
    systemOnline: boolean;
}

export function Header({ roomName, systemOnline }: HeaderProps) {
    
    

    const { active } = useControlContext();
    return (
        <header className={`min-h-42 w-screen flex justify-between items-center px-16 py-4 ${ active ? "bg-avit-grey shadow-lg" : ""}`}>
            <div className="flex items-center space-x-6">
                <img src="src/assets/ucla_logo.svg" alt="Logo" className="h-16"/>
                <div className="flex flex-col items-start">
                    <Clock format="12h" />
                    <div className="flex items-center space-x-2 text-2xl">
                        <span >{roomName}</span>
                        <span className={systemOnline ? 'text-green-600' : 'text-red-600'}>
                            ● {systemOnline ? 'System Online' : 'System Offline'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-end">
                {active && <button className="flex flex-col p-2 items-center h-32 w-32">
                    <House className="h-16 w-16"></House>
                    <span className="text-xl mt-2 font-semibold">Home</span>
                </button>}
                {active && <button className="flex flex-col p-2 items-center h-32 w-32">
                    <Compass className="h-16 w-16"></Compass>
                    <span className="text-xl mt-2 font-semibold">Take Tour</span>
                </button>}
                <button className="flex flex-col p-2 items-center h-32 w-32">
                    <LifeBuoy className="h-16 w-16"></LifeBuoy>
                    <span className="text-xl mt-2 font-semibold">Support</span>
                </button>
                {active && <button className="flex flex-col p-2 items-center h-32 w-32">
                    <Settings2 className="h-16 w-16"></Settings2>
                    <span className="text-xl mt-2 font-semibold">Settings</span>
                </button>}
                {active && <button className="flex flex-col p-2 items-center h-32 w-32">
                    <CircleX className="h-16 w-16"></CircleX>
                    <span className="text-xl mt-2 font-semibold">End</span>
                </button>}

            </div>
        </header>
    );
}
