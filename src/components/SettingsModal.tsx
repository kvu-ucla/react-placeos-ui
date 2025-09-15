import { useState } from "react";
import type { TabSection } from "../models/Modal";
import { Icon } from "@iconify/react";
import { useZoomContext } from "../hooks/ZoomContext.tsx";
import {CameraTab} from "./tabbed/CameraTab.tsx";
import {MicTab} from "./tabbed/MicTab.tsx";
import {DisplayTab} from "./tabbed/DisplayTab.tsx";

export default function SettingsModal({
  onClose,
  initialTab = "Volume",
}: {
  onClose: () => void;
  initialTab?: TabSection;
}) {
  const {
    muteEveryone,
    toggleAudioMuteEveryone,
    currentMeeting
  } = useZoomContext();
  const [activeTab, setActiveTab] = useState<TabSection>(initialTab);
  const audioTabs: TabSection[] = ["Volume"];
  // const audioTabs: TabSection[] = ["Volume", "Sources"];
  const videoTabs: TabSection[] = ["Display"];
  const meetingTabs: TabSection[] = ["Status", "Camera"];
  // const meetingTabs: TabSection[] = ["Status", "View", "Camera"];
  
  

  return (
    <div className="modal modal-open bg-black/40">
      <div
        id="settings"
        className="modal-box bg-white p-8 w-[1547px] h-[1098px] max-w-full rounded-lg"
      >
        <div className="">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-avit-grey pb-8">
            <h2 className="text-4xl font-semibold">Settings</h2>
            <button onClick={onClose} className="btn-ghost text-2xl font-bold ">
              <Icon
                icon="material-symbols:close-small-outline-rounded"
                width={48}
                height={48}
              ></Icon>
            </button>
          </div>

          <div className="flex mt-4 space-x-6">
            {/* Sidebar */}
            <div className="w-68 space-y-2">
              <Section
                label="Audio"
                tabs={audioTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              {/*<Section*/}
              {/*  label="Video"*/}
              {/*  tabs={videoTabs}*/}
              {/*  activeTab={activeTab}*/}
              {/*  setActiveTab={setActiveTab}*/}
              {/*/>*/}
              <Section
                label="Meeting Controls"
                tabs={meetingTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>

            {/* Content */}
            <div className="w-full space-y-6 flex-col justify-end items-center">
              {activeTab === "Volume" && <MicTab></MicTab>}

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
                  <DisplayTab/>
              )}

              {activeTab === "Status" && (
                <div className="border rounded-lg p-6 space-y-6">
                  {/* Zoom Meeting Status Header */}
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      Zoom Meeting Status
                    </h2>
                  </div>
                  {/* Room Info */}
                  <div className="border rounded-md p-4 bg-white">
                    <div className="font-semibold text-black">
                      {currentMeeting?.meetingName}
                    </div>
                    <div className="text-gray-600">
                      Meeting Number: {currentMeeting?.meetingNumber} &nbsp; •
                      &nbsp;
                    </div>
                  </div>
                  {/* Tabs and Global Tools */}
                  {/* Global actions */}
                  <div className="flex gap-4">
                    {muteEveryone ? (
                      <button
                        onClick={toggleAudioMuteEveryone}
                        className="bg-black text-white px-4 py-2 rounded text-2xl font-semibold"
                      >
                        Unmute all participants
                      </button>
                    ) : (
                      <button
                        onClick={toggleAudioMuteEveryone}
                        className="bg-gray-300 px-4 py-2 rounded text-2xl font-semibold"
                      >
                        Mute all participants
                      </button>
                    )}
                    {/*<button className="bg-gray-300 px-4 py-2 rounded text-sm font-semibold">*/}
                    {/*  Disable video for all*/}
                    {/*</button>*/}
                  </div>
                  {/* Participants list */}
                  {/*<div>*/}
                  {/*  {participants?.map(participant => (*/}
                  {/*      <div key={participant.user_name}>*/}
                  {/*        <div key={participant.is_host}>*/}
                  {/*          <div key={participant.}>*/}
                  {/*          </div>*/}
                  {/*        </div>*/}
                  {/*      </div>*/}
                  {/*      */}
                  {/*  )) ?? <div>No participants</div>}*/}
                  {/*</div>*/}
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

              {activeTab === "Camera" && <CameraTab></CameraTab>}

              <div className="mt-6">
                <div className="bg-blue-100 text-blue-900 p-3 text-xl rounded flex items-center justify-left">
                  <div className="flex items-center">
                    <span className="mr-2">
                      <Icon
                        icon="material-symbols:phone-enabled-outline"
                        width={32}
                        height={32}
                      ></Icon>
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
