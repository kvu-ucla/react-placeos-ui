import {useZoomContext} from "../../hooks/ZoomContext";
import {Icon} from "@iconify/react";
import {useEffect, useState} from "react";
import * as Slider from "@radix-ui/react-slider";
import type { DspMicrophone } from "../../hooks/useZoomModule.ts";

export function MicTab() {
    const {
        mics,
        adjustDspVolume,
        toggleDspMute,
        volume,
        volumeMute,
        toggleMasterMute,
        adjustMasterVolume,
        setMasterMute
    } = useZoomContext();

    const [value, setValue] = useState(volume);
    const [percentage, setPercentage] = useState(0);
    //speaker volume percentage
    useEffect(() => {
        if (!volume) return;
        let percent = (100 * (volume - 800)) / (1200 - 800);
        setPercentage(Math.round(percent));
    }, [value, volume]);

    //handle speaker volume
    const handleRelease = () => {
        if (!value) return;

        value === 800 ? setMasterMute(true) : setMasterMute(false);

        adjustMasterVolume(value);
    };

    //handle mics volume
    const handleMicRelease = (micId: string, micLevel: number) => {
        adjustDspVolume(micLevel, micId);
    };

    // Calculate mic percentage
    const getMicPercentage = (mic: DspMicrophone, currentLevel: number) => {
        const percent = (100 * (currentLevel - mic.min_level)) / (mic.max_level - mic.min_level);
        return Math.round(Math.max(0, Math.min(100, percent)));
    };

    function MicControl({ mic }: { mic: DspMicrophone }) {
        const micId = mic.id;
        const min = mic.min_level;
        const max = mic.max_level;
        
        const [localMicValue, setLocalMicValue] = useState(mic.level);
        
        useEffect(() => {
            setLocalMicValue(mic.level);
        }, [mic.level]);

        const micPercentage = getMicPercentage(mic, localMicValue);

        return (
            <div className="border border-[#999] rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold mb-2">Mic {mic.name} volume (output)</h4>
                    <span className="font-bold text-blue-600">{micPercentage}%</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <Icon
                        icon="material-symbols:volume-mute-outline-rounded"
                        width={48}
                        height={48}
                    ></Icon>
                    <Slider.Root
                        className="relative flex items-center select-none touch-none w-full h-16"
                        min={min}
                        max={max}
                        step={10}
                        value={[localMicValue]}
                        onValueChange={([val]) => {
                            setLocalMicValue(val);
                        }}
                        onValueCommit={() => handleMicRelease(micId, localMicValue)}
                    >
                        <Slider.Track className="relative grow rounded-full h-6 bg-gray-300">
                            <Slider.Range className="absolute h-full bg-blue-500 rounded-full" />
                        </Slider.Track>
                        <Slider.Thumb
                            className="block w-12 h-12 bg-white border-2 border-blue-500 rounded-full shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-6 focus:ring-blue-500"
                            aria-label="Volume"
                        />
                    </Slider.Root>
                    <Icon
                        icon="material-symbols:volume-up-outline-rounded"
                        width={48}
                        height={48}
                    ></Icon>
                </div>
                <button
                    onClick={() => {
                        toggleDspMute(micId);
                    }}
                    className={`btn w-full h-[64px] rounded-lg text-xl font-medium ${
                        mic.is_muted
                            ? "bg-gray-800 text-white"
                            : "text-avit-grey-80 bg-gray-100 border-gray-100"
                    }`}
                >
                    {mic.is_muted ? "Unmute Mic" : "Mute Mic"}
                </button>
            </div>
        );
    }

    return(
        <>
            <h3 className="font-semibold mb-2">Volume</h3>
            
            <div className="w-full border border-[#999] flex items-center justify-between p-4 rounded-lg">
                <div className="flex flex-col w-full items-start">
                    {/* Title */}
                    <div className="flex w-full items-center justify-between">
                        <p className="font-semibold">Speaker volume</p>
                        <span className="text-blue-600 font-bold">
                          {percentage}%
                        </span>
                    </div>

                    {/* Slider */}
                    <div className="flex w-full items-center">
                        <Icon
                            icon="material-symbols:volume-mute-outline-rounded"
                            width={64}
                            height={64}
                        ></Icon>
                        <Slider.Root
                            className="relative flex items-center select-none touch-none w-full h-16"
                            min={800}
                            max={1200}
                            step={10}
                            value={[value!]}
                            onValueChange={([val]) => setValue(val)}
                            onValueCommit={() => handleRelease()}
                        >
                            <Slider.Track className="relative grow rounded-full h-6 bg-gray-300">
                                <Slider.Range className="absolute h-full bg-blue-500 rounded-full" />
                            </Slider.Track>
                            <Slider.Thumb
                                className="block w-12 h-12 bg-white border-2 border-blue-500 rounded-full shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-6 focus:ring-blue-500"
                                aria-label="Volume"
                            />
                        </Slider.Root>
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

            {/* Microphones, render only if mics exists */}
            {mics && Object.keys(mics).length > 0 &&  
                (<div className="w-full">
                <h3 className="font-semibold mb-2">Microphones</h3>
                <div className="grid grid-cols-2 gap-4 w-full">
                    {Object.values(mics).map((mic) => (
                        <MicControl key={mic.id} mic={mic} />
                    ))}
                </div>
            </div>)}
        </>
    );
}