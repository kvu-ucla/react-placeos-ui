import CameraController from "../CameraController";
import {useModuleExecute} from "../../hooks/placeos";
import {useZoomContext} from "../../hooks/ZoomContext";
import {useParams} from "react-router-dom";
import {useRef} from "react";
import {CameraPresetButton} from "./CameraPresetButton";

// CameraController's natural rendered size (zoom column + joystick + its own
// padding/gaps) and the factor that shrinks it so the Camera tab fits the
// settings modal without scrolling. A transform scale inside a fixed-size box
// keeps the pointer math exact — getBoundingClientRect reflects transforms —
// so joystick/zoom behavior is untouched.
const CONTROLLER_NATURAL_W = 528;
const CONTROLLER_NATURAL_H = 448;
const CONTROLLER_SCALE = 0.5;

export function CameraTab() {
    const {
        cams,
        selectedCamera,
        recording
    } = useZoomContext();
    const { system_id } = useParams();
    const execute = useModuleExecute(system_id!);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const cameraSelection = (camera_id: string) => {
        // daisyUI dropdowns close on blur; only blur focus held inside this
        // dropdown rather than whatever element is focused app-wide
        const active = document.activeElement;
        if (active instanceof HTMLElement && dropdownRef.current?.contains(active)) {
            active.blur();
        }
        execute('System', 'selected_camera', [camera_id]);
    }

    if (recording) return <div>Cameras are automated when BruinCasting!</div>;

    const selectedCam = selectedCamera ? cams[selectedCamera] : null;

    return (
        <>
            <h3 className="font-semibold mb-2">Camera</h3>

            {/* Active camera selector */}
            <div className="border border-[#999] text-avit-grey-80 rounded-lg p-4 flex items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-semibold">Active camera</h3>
                <div ref={dropdownRef} className="dropdown dropdown-bottom dropdown-end w-[420px]">
                    <div tabIndex={0} role="button" className="w-full text-xl h-12 btn">
                        {cams?.[selectedCamera ?? -1]?.camera_name ?? 'Select a camera to control'}
                    </div>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-1 w-full text-xl p-2 shadow-sm"
                    >
                        {Object.values(cams).map((cam) => (
                            <li key={cam.camera_id}>
                                <button
                                    type="button"
                                    onClick={ () =>
                                        cameraSelection(cam.camera_id)
                                    }
                                >
                                    {cam.camera_name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Pan/tilt/zoom + presets side by side */}
            <div className="border border-[#999] rounded-lg p-4 flex items-start justify-between gap-6">
                <div>
                    <h4 className="font-semibold mb-2">Pan, tilt &amp; zoom</h4>
                    <div
                        style={{
                            width: CONTROLLER_NATURAL_W * CONTROLLER_SCALE,
                            height: CONTROLLER_NATURAL_H * CONTROLLER_SCALE,
                        }}
                    >
                        <div
                            className="origin-top-left"
                            style={{
                                transform: `scale(${CONTROLLER_SCALE})`,
                                width: CONTROLLER_NATURAL_W,
                                height: CONTROLLER_NATURAL_H,
                            }}
                        >
                            <CameraController
                                id={system_id!}
                                activeCamera={{mod: selectedCamera!}}
                            ></CameraController>
                        </div>
                    </div>
                </div>

                {/* Camera Presets */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-2">Camera presets</h4>
                    {selectedCam?.presets ? (
                        /* 3-up so even a long preset list stays shorter than
                           the joystick column and can't grow the card */
                        <div className="grid grid-cols-3 gap-2">
                            {selectedCam.presets.map((preset) => (
                                <CameraPresetButton
                                    key={preset}
                                    preset={preset}
                                    system_id={system_id!}
                                    selectedCamera={selectedCamera!}
                                    cams={cams}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}
