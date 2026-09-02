import {useZoomContext} from "../../hooks/ZoomContext";
import {Icon} from "@iconify/react";
import {memo, useCallback, useEffect, useRef, useState} from "react";
import VolumeSlider from "../VolumeSlider";
import type { DspMicrophone } from "../../hooks/useAvControls.ts";

// Calculate mic percentage
const getMicPercentage = (mic: DspMicrophone, currentLevel: number) => {
    const percent = (100 * (currentLevel - mic.min_level)) / (mic.max_level - mic.min_level);
    return Math.round(Math.max(0, Math.min(100, percent)));
};

// Module-scope + memo so MicTab re-renders (e.g. speaker drag frames) don't
// remount every mic row and reset its local slider state.
const MicControl = memo(function MicControl({
    mic,
    onCommit,
    onToggleMute,
}: {
    mic: DspMicrophone;
    onCommit: (micId: string, micLevel: number) => void;
    onToggleMute: (micId: string) => void;
}) {
    const micId = mic.id;
    const min = mic.min_level;
    const max = mic.max_level;

    const [localMicValue, setLocalMicValue] = useState(mic.level);
    const dragging = useRef(false);

    // Sync from the DSP binding only while not dragging, so echoes can't yank the thumb
    useEffect(() => {
        if (dragging.current) return;
        setLocalMicValue(mic.level);
    }, [mic.level]);

    const handleDragStart = useCallback(() => {
        dragging.current = true;
    }, []);

    // Fires on every pointerup/pointercancel; onCommit alone is unreliable
    // (Radix skips it when the value didn't change)
    const handleDragEnd = useCallback(() => {
        dragging.current = false;
    }, []);

    const handleCommit = (val: number) => {
        onCommit(micId, val);
    };

    const micPercentage = getMicPercentage(mic, localMicValue);

    return (
        <div className="border border-[#999] rounded-lg p-4">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold mb-2">{mic.name} volume</h4>
                <span className="font-bold text-blue-600">{micPercentage}%</span>
            </div>
            <div className="flex items-center justify-between mb-2">
                <Icon
                    icon="material-symbols:volume-mute-outline-rounded"
                    width={48}
                    height={48}
                ></Icon>
                <VolumeSlider
                    min={min}
                    max={max}
                    value={localMicValue}
                    onChange={setLocalMicValue}
                    onCommit={handleCommit}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    ariaLabel={`${mic.name} volume`}
                />
                <Icon
                    icon="material-symbols:volume-up-outline-rounded"
                    width={48}
                    height={48}
                ></Icon>
            </div>
            <button
                onClick={() => {
                    onToggleMute(micId);
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
});

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
    const dragging = useRef(false);

    //speaker volume percentage
    useEffect(() => {
        if (!volume) return;
        let percent = (100 * (volume - 800)) / (1200 - 800);
        setPercentage(Math.round(percent));
    }, [value, volume]);

    // Re-sync the local speaker value from the binding while not dragging
    useEffect(() => {
        if (dragging.current) return;
        if (!volume) return;
        setValue(volume);
    }, [volume]);

    const handleDragStart = useCallback(() => {
        dragging.current = true;
    }, []);

    // Fires on every pointerup/pointercancel; onCommit alone is unreliable
    // (Radix skips it when the value didn't change)
    const handleDragEnd = useCallback(() => {
        dragging.current = false;
    }, []);

    //handle speaker volume
    const handleRelease = (val: number) => {
        if (!val) return;

        setMasterMute(val === 800);

        adjustMasterVolume(val);
    };

    //handle mics volume
    const handleMicRelease = useCallback(
        (micId: string, micLevel: number) => {
            adjustDspVolume(micLevel, micId);
        },
        [adjustDspVolume],
    );

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
                        <VolumeSlider
                            value={value!}
                            onChange={setValue}
                            onCommit={handleRelease}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            ariaLabel="Speaker volume"
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

            {/* Microphones, render only if mics exists */}
            {mics && Object.keys(mics).length > 0 &&
                (<div className="w-full">
                <h3 className="font-semibold mb-2">Microphones</h3>
                <div className="grid grid-cols-2 gap-4 w-full">
                    {Object.values(mics).map((mic) => (
                        <MicControl
                            key={mic.id}
                            mic={mic}
                            onCommit={handleMicRelease}
                            onToggleMute={toggleDspMute}
                        />
                    ))}
                </div>
            </div>)}
        </>
    );
}
