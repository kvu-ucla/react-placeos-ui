import { useEffect, useRef } from "react";
import { notify } from "../../notify";
import { useModuleExecute } from "../../hooks/placeos";

interface CameraPresetButtonProps {
    preset: string;
    system_id: string;
    selectedCamera: string;
    cams: Record<string, { camera_id: string; camera_name: string }>;
}

const HOLD_DURATION = 800; // ms before long press triggers

export function CameraPresetButton({
                                       preset,
                                       system_id,
                                       selectedCamera,
                                       cams,
                                   }: CameraPresetButtonProps) {
    const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHeld = useRef(false);
    const execute = useModuleExecute(system_id);

    const camera = cams?.[selectedCamera];

    const clearHold = () => {
        if (holdTimeout.current) {
            clearTimeout(holdTimeout.current);
            holdTimeout.current = null;
        }
    };

    const extractNumber = (input: string): number | null => {
        const match = input.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
    };


    const handleSave = () => {
        if (!camera) return;
        notify.success(`${camera.camera_name} ${preset} saved!`);
        execute(camera.camera_id, "cam_preset_save", [extractNumber(preset)]);
    };

    const handleRecall = () => {
        if (!camera) return;
        notify.success(`${camera.camera_name} ${preset} recalled!`);
        execute(camera.camera_id, "cam_preset_recall", [extractNumber(preset)]);
    };

    const onPointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
        // Prevent long-press context menu and mouse synthesis after touch
        e.preventDefault();

        isHeld.current = false;
        clearHold();
        holdTimeout.current = setTimeout(() => {
            isHeld.current = true;
            handleSave();
        }, HOLD_DURATION);

        // capture the pointer so leaving the element doesn’t cancel unexpectedly
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    };

    const onPointerUp: React.PointerEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        const held = isHeld.current;
        clearHold();
        if (!held) handleRecall();
        try {
            (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
        } catch {}
    };

    const onPointerCancelOrLeave: React.PointerEventHandler<HTMLButtonElement> = () => {
        clearHold();
    };

    // safety: clear any pending timers on unmount
    useEffect(() => clearHold, []);

    return (
        <button
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerCancelOrLeave}
            onPointerCancel={onPointerCancelOrLeave}
            onContextMenu={(e) => e.preventDefault()} // block mobile long-press menu
            disabled={!camera}
            className="bg-gray-100 text-gray-800 py-2 rounded w-full h-15 font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed select-none"
            style={{ WebkitTouchCallout: "none", userSelect: "none" }}
            aria-label={camera ? `${preset} for ${camera.camera_name}` : `${preset} (no camera)`}
        >
            {preset}
        </button>
    );
}
