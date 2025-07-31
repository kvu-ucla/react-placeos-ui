// src/components/SessionControls.tsx
import {HdmiPort, Mic, ScreenShare, Video} from "lucide-react";

export default function SessionControls() {

    return (
        <div className="bg-gradient-to-r from-[#0331A9] to-[#2F69FF] rounded-lg px-12 py-4 shadow text-white">

            <div className="inline-flex justify-between items-center w-full mb-4">
                <h2 className="font-semibold">Session Controls</h2>
                <div className="inline-flex justify-evenly items-center bg-avit-blue rounded-lg py-4 px-8">
                    <div className="relative mr-4">
                        <div
                            className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>
                        <div className="relative h-4 w-4 bg-green-400 rounded-full"></div>
                    </div>
                    <span className="font-semibold">In-Meeting</span>
                </div>
            </div>


            <div className="grid grid-cols-4 gap-4 mb-4">
                <ControlCard label="Microphone" status="On" icon="mic" locked/>
                <ControlCard label="Camera" status="On" icon="cam" locked/>
                <ControlCard label="Screen Share" status="On" icon="screen"/>
                <ControlCard label="Meeting Controls" status="" icon="meeting"/>
            </div>

            <h2 className="font-semibold mb-4">Join from your device</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="collapse collapse-arrow custom-collapse bg-gray-200/20 border-base-200/20 backdrop-blur-xl">
                    <input type="checkbox" name="my-accordion-1" defaultChecked/>
                    <div className="collapse-title font-semibold inline-flex">
                        <img src="/assets/zoom_logo_white.svg" alt="zoom logo" className="h-16"/>
                        <div className="flex flex-col ml-4">
                            Join wirelessly
                            <div className="text-2xl font-extralight mt-2">
                                Connect via Zoom to share your screen.
                            </div>
                        </div>

                    </div>
                    <div className="collapse-content text-xl font-light">
                        <ol className="list-decimal list-inside">
                            <li>Open the Zoom client application on the device you wish to present.</li>
                            <li>Tap "Share Screen" and input [Sharing Key], if applicable.</li>
                        </ol>
                    </div>
                </div>

                <div className="collapse collapse-arrow custom-collapse bg-gray-200/20 border-base-200/20 backdrop-blur-xl">
                    <input type="checkbox" name="my-accordion-1" defaultChecked/>
                    <div className="collapse-title font-semibold inline-flex">
                        <HdmiPort className="h-16 w-16"></HdmiPort>
                        <div className="flex flex-col ml-4">
                            Connect with USB-C / HDMI
                            <div className="text-2xl font-extralight mt-2">
                                Use a physical USB-C or HDMI cable for direct connection.
                            </div>
                        </div>

                    </div>
                    <div className="collapse-content text-xl font-light">
                        <ol className="list-decimal list-inside">
                            <li>Connect one end of the USB-C or HDMI cable into your laptop.</li>
                            <li>The system will detect your device and switch the display automatically</li>
                        </ol>
                    </div>
                </div>
                {/*<div className="bg-white text-black p-4 rounded">*/}
                {/*    <div className="font-medium mb-1">Join wirelessly</div>*/}
                {/*    <div className="text-sm">Connect via Zoom to share your screen.</div>*/}
                {/*</div>*/}
                {/*<div className="bg-white text-black p-4 rounded">*/}
                {/*    <div className="font-medium mb-1">Join with USB-C</div>*/}
                {/*    <div className="text-sm">Use a physical USB-C cable for direct connection.</div>*/}
                {/*</div>*/}
            </div>
        </div>
    );
}

function ControlCard({label, status, icon}: { label: string; status: string; icon: string; locked?: boolean }) {
    return (
        <button className="p-0 bg-transparent border-none h-48">
            <div
                className="bg-white rounded-lg text-avit-grey-80 p-8 flex flex-col items-center justify-center relative">
                <div className="text-3xl mb-2">
                    {
                        icon == "mic" &&
                        <div className="bg-avit-grey-button rounded-lg h-24 w-24 flex justify-center items-center">
                            <Mic className="h-16 w-16"></Mic>
                        </div>
                    }
                    {
                        icon == "cam" &&
                        <div className="bg-avit-grey-button rounded-lg h-24 w-24 flex justify-center items-center">
                            <Video className="h-16 w-16"></Video>
                        </div>
                    }
                    {
                        icon == "screen" &&
                        <div className="bg-avit-grey-button rounded-lg h-24 w-24 flex justify-center items-center">
                            <ScreenShare className="h-16 w-16"></ScreenShare>
                        </div>
                    }
                    {
                        icon == "meeting" &&
                        <div className="bg-avit-grey-button rounded-lg h-24 w-24 flex justify-center items-center">
                            <img src="/assets/zoom_logo.svg" alt="Logo" className="h-16 w-16"/>
                        </div>
                    }
                </div>
                <div className="text-xl font-medium">{label} {status}</div>
            </div>
        </button>

    );
}
