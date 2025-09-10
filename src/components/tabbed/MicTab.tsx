import {useZoomContext} from "../../hooks/ZoomContext";
import {Icon} from "@iconify/react";
import {useEffect, useState} from "react";

export function MicTab() {
    const {
        //TODO add mics
        volume,
        volumeMute,
        toggleMasterMute,
        adjustMasterVolume,
        setMasterMute
    } = useZoomContext();
    
    const [value, setValue] = useState(volume);
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        if (!volume) return;
        let percent = (100 * (volume - 800)) / (1200 - 800);
        setPercentage(Math.round(percent));
    }, [value, volume]);
    const handleRelease = () => {
        if (!value) return;

        value === 800 ? setMasterMute(true) : setMasterMute(false);

        adjustMasterVolume(value);
    };

    function MicControl({ mic }: { mic: number }) {
        // const isEven = mic % 2 === 0;
        const muted = mic % 2 !== 0;
        const volume = muted ? 0 : 65;

        return (
            <div className="border border-[#999] rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold mb-2">Mic {mic} volume (output)</h4>
                    <span className="font-bold text-blue-600">{volume}%</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <Icon
                        icon="material-symbols:volume-mute-outline-rounded"
                        width={48}
                        height={48}
                    ></Icon>
                    <input
                        type="range"
                        className="mr-2 w-full range rounded-3xl [--range-thumb:white] text-blue-600 touch-none"
                        defaultValue={60}
                    />
                    <Icon
                        icon="material-symbols:volume-up-outline-rounded"
                        width={48}
                        height={48}
                    ></Icon>
                    {/*<Volume2 className="h-24 w-24"></Volume2>*/}
                </div>
                <button
                    className={`btn w-full h-[64px] rounded-lg text-xl font-medium ${
                        muted
                            ? "bg-gray-800 text-white"
                            : "text-avit-grey-80 bg-gray-100 border-gray-100"
                    }`}
                >
                    {muted ? "Unmute Mic" : "Mute Mic"}
                </button>
            </div>
        );
    }
    return(
        <>
            <h3 className="font-semibold mb-2">Volume</h3>

            {/* Make the row fill the parent width */}
            <div className="w-full border border-[#999] flex items-center justify-between p-4 rounded-lg">
                {/* Main column takes all remaining space */}
                <div className="flex flex-col w-full items-start">
                    {/* Row spans full width */}
                    <div className="flex w-full items-center justify-between">
                        <p className="font-semibold">Speaker volume</p>
                        <span className="text-blue-600 font-bold">
                          {percentage}%
                        </span>
                    </div>

                    {/* Slider row also spans full width */}
                    <div className="flex w-full items-center">
                        <Icon
                            icon="material-symbols:volume-mute-outline-rounded"
                            width={64}
                            height={64}
                        ></Icon>
                        <input
                            min={800}
                            max={1200}
                            value={value}
                            onChange={(e) => setValue(Number(e.target.value))}
                            onPointerUp={handleRelease}
                            type="range"
                            className="w-full range rounded-3xl [--range-thumb:white] text-blue-600 touch-none"
                            defaultValue={60}
                        />
                        <Icon
                            icon="material-symbols:volume-up-outline-rounded"
                            width={64}
                            height={64}
                        ></Icon>
                    </div>
                </div>
                <div className="flex justify-end items-end">
                    {volumeMute ? (
                        <button
                            onClick={toggleMasterMute}
                            className="btn w-[300px] h-[64px] ml-4 bg-black border-black px-9 py-6 rounded-lg text-xl text-white font-medium"
                        >
                            Unmute Speaker
                        </button>
                    ) : (
                        <button
                            onClick={toggleMasterMute}
                            className="btn w-[300px] h-[64px] ml-4 bg-gray-100 border-gray-100 px-9 py-6 rounded-lg text-xl text-avit-grey-80 font-medium"
                        >
                            Mute Speaker
                        </button>
                    )}
                </div>
            </div>

            {/* Microphones section also fills width */}
            <div className="w-full">
                <h3 className="font-semibold mb-2">Microphones</h3>
                <div className="grid grid-cols-2 gap-4 w-full">
                    {[1, 2, 3, 4].map((mic) => (
                        <MicControl key={mic} mic={mic} />
                    ))}
                </div>
            </div>
        </>
    );
}