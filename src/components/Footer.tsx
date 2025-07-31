// src/components/Footer.tsx
import {useControlContext} from "../hooks/ControlStateContext.tsx";
import {Volume, Volume2} from "lucide-react";

export default function Footer() {

    const { togglePower } = useControlContext();
    
    return (
        <footer className="min-h-38 bg-blue-900 text-white py-4 px-8 flex justify-between items-center">
            <div className="flex flex-col p-2">
                <div className="inline-flex justify-evenly items-center bg-gray-400/15 rounded-lg p-4">
                    <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                    <div className="text-2xl">BruinCast On</div>
                </div>
                <div className="text-lg text-gray-300">Recording powered by BruinCast</div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="flex items-center mr-8">
                    <div className="text-3xl">Speaker Volume</div>
                    <Volume className="h-24 w-24"></Volume>
                    <div className="w-full overflow-hidden">
                        <input type="range" className="w-full range range-xl rounded-3xl touch-none"/>
                    </div>
                    <Volume2 className="h-24 w-24"></Volume2>
                </div>

                <button onClick={togglePower}  className="btn btn-error text-white text-3xl p-8 rounded-lg font-medium">
                    End Meeting
                </button>
            </div>

 
        </footer>
    );
}
