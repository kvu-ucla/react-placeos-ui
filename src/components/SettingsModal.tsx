import {useEffect, useState} from "react";
import type { TabSection } from "../models/Modal";
import { Icon } from "@iconify/react";
import {useZoomContext} from "../hooks/ZoomContext.tsx";



export default function SettingsModal({
  onClose,
  initialTab = "Volume",
}: {
  onClose: () => void;
  initialTab?: TabSection;
}) {
  const {
    volume,
    volumeMute,
    toggleMasterMute,
    adjustMasterVolume,
    setMasterMute,
    currentMeeting  
  } = useZoomContext();
  const [activeTab, setActiveTab] = useState<TabSection>(initialTab);

  const [value, setValue] = useState(volume);
  const [percentage, setPercentage] = useState(0);
  const handleRelease = () => {
    if (!value) return;

    value === 800 ? setMasterMute(true) : setMasterMute(false);
    
    adjustMasterVolume(value);
  };

  const audioTabs: TabSection[] = ["Volume", "Sources"];
  const videoTabs: TabSection[] = ["Display"];
  const meetingTabs: TabSection[] = ["Status", "View", "Camera"];
  
  useEffect( () => {
    if (!volume) return;
    let percent = 100 * (volume - 800) / (1200 - 800);
    setPercentage(Math.round(percent));
  }, [value, volume] )

  return (
    <div className="modal modal-open bg-black/40">
      <div id="settings" className="modal-box bg-white p-8 w-[1547px] h-[1098px] max-w-full rounded-lg">
        <div className="">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-avit-grey pb-8">
            <h2 className="text-4xl font-semibold">Settings</h2>
            <button onClick={onClose} className="btn-ghost text-2xl font-bold ">
              <Icon icon="material-symbols:close-small-outline-rounded" width={48} height={48}></Icon>
            </button>
          </div>

          <div className="flex mt-4 space-x-6">
            {/* Sidebar */}
            <div className="w-[248px] space-y-2">
              <Section
                label="Audio"
                tabs={audioTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              <Section
                label="Video"
                tabs={videoTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              <Section
                label="Meeting Controls"
                tabs={meetingTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>

            {/* Content */}
            <div className="w-full space-y-6 flex-col justify-end items-center">
              {activeTab === "Volume" && (
                <>
                  <h3 className="font-semibold mb-2">Volume</h3>

                  {/* Make the row fill the parent width */}
                  <div className="w-full border border-[#999] flex items-center justify-between p-4 rounded-lg">
                    {/* Main column takes all remaining space */}
                    <div className="flex flex-col w-full items-start">
                      {/* Row spans full width */}
                      <div className="flex w-full items-center justify-between">
                        <p className="font-semibold">Speaker volume</p>
                        <span className="text-blue-600 font-bold">{percentage}%</span>
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
                      {volumeMute ? <button onClick={toggleMasterMute} className="btn w-[300px] h-[64px] ml-4 bg-black border-black px-9 py-6 rounded-lg text-xl text-white font-medium">
                        Unmute Speaker
                      </button> :
                      <button onClick={toggleMasterMute} className="btn w-[300px] h-[64px] ml-4 bg-gray-100 border-gray-100 px-9 py-6 rounded-lg text-xl text-avit-grey-80 font-medium">
                        Mute Speaker
                      </button>}
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
              )}

              {activeTab === "Sources" && (
                <>
                  <h3 className="font-semibold mb-2">Sources</h3>
                  
                  {/* Speaker Inputs */}
                  <div className="border border-[#999] rounded-lg p-4 space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {/* Replace with an actual icon if desired */}
                      <span>
                        <Icon
                          icon="material-symbols:volume-up-outline-rounded"
                          width={48}
                          height={48}
                        ></Icon>
                      </span>{" "}
                      Speaker outputs
                    </h3>
                    <div className="bg-gray-100 text-gray-700 p-3 rounded flex items-center gap-2">
                      <span className="text-avit-grey-80">
                        <Icon
                          icon="material-symbols:info-rounded"
                          width={48}
                          height={48}
                        ></Icon>
                      </span>
                      <span className="font-medium">
                        Sources are automatically connected via Zoom.
                      </span>
                    </div>
                    <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-between">
                      <span className="font-semibold">
                        Jordan’s Laptop (Zoom)
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                          CONNECTED
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="relative">
                            <div className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>
                            <div className="relative h-4 w-4 bg-green-400 rounded-full mr-4"></div>
                          </div>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Microphone Inputs */}
                  <div className="border border-[#999] rounded-lg p-4 space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {/* Replace with an actual icon if desired */}
                      <span>
                        <Icon
                            icon="material-symbols:mic-outline-rounded"
                            width={48}
                            height={48}
                        ></Icon>
                      </span>{" "}
                      Microphone inputs
                    </h3>
                    <div className="bg-gray-100 text-gray-700 p-3 rounded flex items-center gap-2">
                      <span className="text-avit-grey-80">
                        <Icon
                            icon="material-symbols:info-rounded"
                            width={48}
                            height={48}
                        ></Icon>
                      </span>
                      <span className="font-medium">
                        Sources are automatically connected via Zoom.
                      </span>
                    </div>
                    <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-between">
                      <span className="font-semibold">
                        Jordan’s Laptop (Zoom)
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                          CONNECTED
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="relative">
                            <div className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>
                            <div className="relative h-4 w-4 bg-green-400 rounded-full mr-4"></div>
                          </div>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "Display" && (
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
                        type="checkbox"
                        defaultChecked
                        className="toggle border-gray-300 bg-gray-300 toggle-xl checked:border-blue-600 checked:bg-blue-600 checked:text-white"
                      />
                    </label>
                  </div>

                  {/* Left Display Screen */}
                  <div className="border border-[#999] rounded-lg p-4 space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {/* Replace with an actual icon if desired */}
                      <span>
                        <Icon
                            icon="material-symbols:tv-displays-outline-rounded"
                            width={48}
                            height={48}
                        ></Icon>
                      </span>{" "}
                      Left display screen
                    </h3>
                    <div className="bg-gray-100 text-gray-700 p-3 rounded flex items-center gap-2">
                      <span className="text-avit-grey-80">
                        <Icon
                            icon="material-symbols:info-rounded"
                            width={48}
                            height={48}
                        ></Icon>
                      </span>
                      <span className="font-medium">
                        Sources are automatically connected via Zoom.
                      </span>
                    </div>
                    <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-between">
                      <span className="font-semibold">
                        Jordan’s Laptop (Zoom)
                        <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                          CONNECTED
                        </span>
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <div className="relative">
                            <div className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>
                            <div className="relative h-4 w-4 bg-green-400 rounded-full mr-4"></div>
                          </div>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Display Screen */}
                  <div className="border border-[#999] rounded-lg p-4 space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {/* Replace with an actual icon if desired */}
                      <span>
                        <Icon
                            icon="material-symbols:tv-displays-outline-rounded"
                            width={48}
                            height={48}
                        ></Icon>
                      </span>{" "}
                      Right display screen
                    </h3>
                    <div className="bg-gray-100 text-gray-700 p-3 rounded flex items-center gap-2">
                      <span className="text-avit-grey-80">
                        <Icon
                            icon="material-symbols:info-rounded"
                            width={48}
                            height={48}
                        ></Icon>
                      </span>
                      <span className="font-medium">
                        Sources are automatically connected via Zoom.
                      </span>
                    </div>
                    <div className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-between">
                      <span className="font-semibold">
                        Jordan’s Laptop (Zoom)
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                          CONNECTED
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="relative">
                            <div className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>
                            <div className="relative h-4 w-4 bg-green-400 rounded-full mr-4"></div>
                          </div>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "Status" && (
                <div className="border rounded-lg p-6 space-y-6">
                  {/* Zoom Meeting Status Header */}
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      Zoom Meeting Status
                    </h3>
                    <p className="text-gray-700 font-medium">Active Camera</p>
                  </div>

                  {/* Room Info */}
                  <div className="border rounded-md p-4 bg-white">
                    <div className="font-semibold text-black">
                      {currentMeeting?.meetingName}
                    </div>
                    <div className="text-gray-600">
                      {currentMeeting?.meetingNumber} &nbsp; • &nbsp; {}
                    </div>
                  </div>

                  {/* Tabs and Global Tools */}
                  <div className="flex items-center gap-3">
                    <button className="bg-blue-600 text-white font-bold px-4 py-2 rounded flex items-center gap-1">
                      Participants <span>▲</span>
                    </button>
                    <button className="bg-gray-100 text-gray-900 px-4 py-2 rounded flex items-center gap-2">
                      Invite <span>▼</span>
                    </button>
                    <button className="bg-gray-100 text-gray-900 px-4 py-2 rounded flex items-center gap-2">
                      Host Tools <span>▼</span>
                    </button>
                  </div>

                  {/* Global actions */}
                  <div className="flex gap-4">
                    <button className="bg-gray-300 px-4 py-2 rounded text-sm font-semibold">
                      Mute all participants
                    </button>
                    <button className="bg-gray-300 px-4 py-2 rounded text-sm font-semibold">
                      Disable video for all
                    </button>
                  </div>

                  {/* Participants list */}
                  //TODO participant list
                </div>
              )}

              {activeTab === "View" && (
                <div className="border rounded-lg p-6 space-y-6">
                  {/* Section Title */}
                  <h3 className="text-xl font-semibold">Zoom Meeting View</h3>

                  {/* View Toggle Buttons */}
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-3 rounded bg-blue-600 text-white font-semibold">
                      {/* Replace emoji with icon if needed */}
                      <span></span> Gallery View <span></span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 rounded bg-gray-100 text-gray-800 font-semibold">
                      <span></span> Speaker View
                    </button>
                  </div>

                  {/* Spotlight Dropdown */}
                  <div>
                    <label className="block text-gray-800 font-medium mb-2">
                      Spotlight Participant
                    </label>
                    <select className="w-full bg-gray-100 px-4 py-3 rounded text-gray-700">
                      <option>None</option>
                      {/* Additional participants can go here */}
                    </select>
                  </div>

                  {/* Bottom Buttons */}
                  <div className="flex gap-4">
                    <button className="bg-gray-100 text-gray-900 px-6 py-3 rounded font-medium">
                      Pin Video
                    </button>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded font-medium flex items-center gap-2">
                      Hide Self View <span></span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "Camera" && (
                <div className="border rounded-lg p-6 space-y-6">
                  {/* Section Title */}
                  <h3 className="text-xl font-semibold">Camera Management</h3>

                  {/* Active Camera Dropdown */}
                  <div>
                    <label className="block text-gray-800 font-medium mb-2">
                      Active Camera
                    </label>
                    <div className="bg-gray-100 text-gray-700 px-4 py-3 rounded w-fit">
                      Front Camera
                    </div>
                  </div>

                  {/* Pan Zoom Tilt + Presets */}
                  <div className="flex justify-between items-start gap-4">
                    {/* Pan Zoom Tilt Controls (placeholder) */}
                    <div className="bg-gray-400 w-[500px] h-[200px] flex items-center justify-center text-white text-lg font-bold rounded">
                      Pan Zoom Tilt Controls
                    </div>

                    {/* Camera Presets */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-right text-gray-800 mb-2">
                        Camera Presets
                      </h4>
                      {["Preset 1", "Preset 2", "Preset 3", "Preset 4"].map(
                        (preset) => (
                          <button
                            key={preset}
                            className="w-28 bg-gray-100 text-gray-800 py-2 rounded text-sm font-medium hover:bg-gray-200"
                          >
                            {preset}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="bg-blue-100 text-blue-900 p-3 text-xl rounded flex items-center justify-left">
                  <div className="flex items-center">
                    <span className="mr-2">
                      <Icon icon="material-symbols:phone-enabled-outline" width={32} height={32}></Icon>
                    </span>
                    <span>
                      Need help? Call <strong>AV Technical Support</strong> for
                      assistance:
                    </span>
                  </div>
                  <a
                    href="tel:+13102066597"
                    className="ml-2 font-bold hover:underline"
                  >
                    (310) 206-6597
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
        </div>
      </div>
      {/* Optional: backdrop click closes modal */}
      <div className="modal-backdrop" onClick={() => onClose()} />
    </div>
  );
}

function Section({
  label,
  tabs,
  activeTab,
  setActiveTab,
}: {
  label: string;
  tabs: TabSection[];
  activeTab: TabSection;
  setActiveTab: (tab: TabSection) => void;
}) {
  return (
    <div>
      <div className="text-xl text-gray-500 font-semibold mb-1">{label}</div>
      <div className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`block w-full text-left px-4 py-4 rounded-lg font-medium ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

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
