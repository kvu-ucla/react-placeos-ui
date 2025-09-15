import {useZoomContext} from "../../hooks/ZoomContext";
import {getModule} from "@placeos/ts-client";
import {useState} from "react";

export function DisplayTab() {
    const {
        system_id,
        outputs
    } = useZoomContext();

    const [displays, setDisplays] = useState(true);

    const toggleDisplays = () => {
        if (!outputs) return;
        
        const newDisplayState = !displays;
        setDisplays(newDisplayState);
        
        for (const output of Object.keys(outputs)) {
            const mod = getModule(system_id, output);
            if (!mod) return;
            
            mod.execute('power', [newDisplayState]);
        }
    };
    
    return (
        <>
            <h3 className="font-semibold mb-2">Displays</h3>

            {/* Toggle All Display Screens */}
            <div className="border border-[#999] text-avit-grey-80 rounded-lg p-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                    All display screens
                </h3>
                {/* Replace this with your actual toggle if needed */}
                <label className="cursor-pointer label">
                    <input
                        onChange={ () => toggleDisplays()}
                        type="checkbox"
                        checked={displays}
                        className="toggle border-gray-300 bg-gray-300 toggle-xl checked:border-blue-600 checked:bg-blue-600 checked:text-white"
                    />
                </label>
            </div>

            {/*/!* Left Display Screen *!/*/}
            {/*<div className="border border-[#999] rounded-lg p-4 space-y-4">*/}
            {/*  <h3 className="text-xl font-semibold flex items-center gap-2">*/}
            {/*    /!* Replace with an actual icon if desired *!/*/}
            {/*    <span>*/}
            {/*      <Icon*/}
            {/*        icon="material-symbols:tv-displays-outline-rounded"*/}
            {/*        width={48}*/}
            {/*        height={48}*/}
            {/*      ></Icon>*/}
            {/*    </span>{" "}*/}
            {/*    Left display screen*/}
            {/*  </h3>*/}
            {/*  <div className="bg-gray-100 text-gray-700 p-3 rounded flex items-center gap-2">*/}
            {/*    <span className="text-avit-grey-80">*/}
            {/*      <Icon*/}
            {/*        icon="material-symbols:info-rounded"*/}
            {/*        width={48}*/}
            {/*        height={48}*/}
            {/*      ></Icon>*/}
            {/*    </span>*/}
            {/*    <span className="font-medium">*/}
            {/*      Sources are automatically connected via Zoom.*/}
            {/*    </span>*/}
            {/*  </div>*/}
            {/*  <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-between">*/}
            {/*    <span className="font-semibold">*/}
            {/*      Jordan’s Laptop (Zoom)*/}
            {/*      <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">*/}
            {/*        CONNECTED*/}
            {/*      </span>*/}
            {/*    </span>*/}
            {/*    <div className="flex items-center gap-4">*/}
            {/*      <span className="flex items-center gap-1">*/}
            {/*        <div className="relative">*/}
            {/*          <div className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>*/}
            {/*          <div className="relative h-4 w-4 bg-green-400 rounded-full mr-4"></div>*/}
            {/*        </div>*/}
            {/*        Active*/}
            {/*      </span>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</div>*/}

            {/*/!* Right Display Screen *!/*/}
            {/*<div className="border border-[#999] rounded-lg p-4 space-y-4">*/}
            {/*  <h3 className="text-xl font-semibold flex items-center gap-2">*/}
            {/*    /!* Replace with an actual icon if desired *!/*/}
            {/*    <span>*/}
            {/*      <Icon*/}
            {/*        icon="material-symbols:tv-displays-outline-rounded"*/}
            {/*        width={48}*/}
            {/*        height={48}*/}
            {/*      ></Icon>*/}
            {/*    </span>{" "}*/}
            {/*    Right display screen*/}
            {/*  </h3>*/}
            {/*  <div className="bg-gray-100 text-gray-700 p-3 rounded flex items-center gap-2">*/}
            {/*    <span className="text-avit-grey-80">*/}
            {/*      <Icon*/}
            {/*        icon="material-symbols:info-rounded"*/}
            {/*        width={48}*/}
            {/*        height={48}*/}
            {/*      ></Icon>*/}
            {/*    </span>*/}
            {/*    <span className="font-medium">*/}
            {/*      Sources are automatically connected via Zoom.*/}
            {/*    </span>*/}
            {/*  </div>*/}
            {/*  <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-between">*/}
            {/*    <span className="font-semibold">*/}
            {/*      Jordan’s Laptop (Zoom)*/}
            {/*    </span>*/}
            {/*    <div className="flex items-center gap-4">*/}
            {/*      <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">*/}
            {/*        CONNECTED*/}
            {/*      </span>*/}
            {/*      <span className="flex items-center gap-1">*/}
            {/*        <div className="relative">*/}
            {/*          <div className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>*/}
            {/*          <div className="relative h-4 w-4 bg-green-400 rounded-full mr-4"></div>*/}
            {/*        </div>*/}
            {/*        Active*/}
            {/*      </span>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</div>*/}
        </>
    );
}