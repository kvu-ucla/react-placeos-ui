import CameraController from "../CameraController.tsx";
import {getModule} from "@placeos/ts-client";
import {useZoomContext} from "../../hooks/ZoomContext";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";

export function CameraTab() {
    const {
        cams,
        selectedCamera,
    } = useZoomContext();
    const { system_id } = useParams();
    const cameraSelection = (camera_id: string) => {
        (document.activeElement as HTMLElement)?.blur()
        const mod = getModule(system_id!, 'System');
        if (!mod) return;
        mod.execute('selected_camera', [camera_id]);
    }

    const notify = (preset: string) => toast(cams[selectedCamera!].camera_name + ' ' + preset + ' recalled!');
    
    return (
        <div className="border rounded-lg p-6 space-y-6">
            {/* Section Title */}
            <h2 className="text-xl font-semibold">Camera Management</h2>

            {/* Active Camera Dropdown */}
            <div>
                <label className="block text-gray-800 font-medium mb-2">
                    Active Camera
                </label>
                <div className="dropdown dropdown-bottom dropdown-center w-full">
                    <div tabIndex={0} role="button" className="w-full text-3xl h-15 btn m-1">
                        {cams[selectedCamera!].camera_name ?? 'Select a camera to control'}
                    </div>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-1 w-full text-3xl p-2 shadow-sm"
                    >
                        {Object.values(cams).map((cam) => (
                            <li
                                onClick={ () =>
                                    cameraSelection(cam.camera_id)
                                }
                            >
                                <a>{cam.camera_name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Pan Zoom Tilt + Presets */}
            <div className="flex justify-between items-start gap-4">
                <div className="bg-gray-400 w-full h-[600px] flex items-center justify-center text-white text-lg font-bold rounded">
                    <CameraController
                        id={system_id!}
                        activeCamera={{mod: selectedCamera!}}
                    ></CameraController>
                </div>

                {/* Camera Presets */}
                <div className="flex flex-col justify-center items-center w-[300px] space-y-3">
                    <h4 className="font-semibold text-right text-gray-800 mb-2">
                        Camera Presets
                    </h4>
                    {/* Camera Presets from camera 1*/}
                    {cams[selectedCamera!].presets.map((preset) => (
                        <button
                            onClick={ () => notify(preset)}
                            key={preset}
                            className="bg-gray-100 text-gray-800 py-2 rounded w-full h-15 font-medium hover:bg-gray-200"
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}