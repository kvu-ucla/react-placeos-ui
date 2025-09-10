import { useRef } from "react";
import { toast } from "react-toastify";
import { getModule } from "@placeos/ts-client";

interface CameraPresetButtonProps {
    preset: string;
    system_id: string;
    selectedCamera: string;
    cams: any;
}

const HOLD_DURATION = 800; // ms before long press triggers

export function CameraPresetButton({
                                       preset,
                                       system_id,
                                       selectedCamera,
                                       cams,
                                   }: CameraPresetButtonProps) {
    const holdTimeout = useRef<NodeJS.Timeout | null>(null);
    const isHeld = useRef(false);

    const handleSave = () => {
        toast(`${cams[selectedCamera].camera_name} ${preset} saved!`);
        const mod = getModule(system_id, cams[selectedCamera].camera_id);
        mod.execute("save_position", [preset]);
    };

    const handleRecall = () => {
        toast(`${cams[selectedCamera].camera_name} ${preset} recalled!`);
        const mod = getModule(system_id, cams[selectedCamera].camera_id);
        mod.execute("recall", [preset]);
    };

    const handleMouseDown = () => {
        isHeld.current = false;
        holdTimeout.current = setTimeout(() => {
            isHeld.current = true;
            handleSave();
        }, HOLD_DURATION);
    };

    const handleMouseUp = () => {
        if (holdTimeout.current) clearTimeout(holdTimeout.current);
        if (!isHeld.current) handleRecall();
    };

    return (
        <button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // cancel if dragged away
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="bg-gray-100 text-gray-800 py-2 rounded w-full h-15 font-medium hover:bg-gray-200"
        >
            {preset}
        </button>
    );
}
