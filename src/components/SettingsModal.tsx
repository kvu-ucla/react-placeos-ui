import { useState } from "react";
import type { TabSection } from "../models/Modal";
import { Icon } from "@iconify/react";
import { CameraTab } from "./tabbed/CameraTab.tsx";
import { MicTab } from "./tabbed/MicTab.tsx";
import { DisplayTab } from "./tabbed/DisplayTab.tsx";
import { StatusTab } from "./tabbed/StatusTab.tsx";
import { useControlContext } from "../hooks/ControlStateContext.tsx";
import { useEscapeKey } from "../hooks/useEscapeKey";

export default function SettingsModal({
  onClose,
  initialTab = "Volume",
  initialView,
}: {
  onClose: () => void;
  initialTab?: TabSection;
  initialView?: "participants";
}) {
  const [activeTab, setActiveTab] = useState<TabSection>(initialTab);
  useEscapeKey(onClose);
  const { supportPhone, supportPhoneDisplay } = useControlContext();
  const audioTabs: TabSection[] = ["Volume"];
  const videoTabs: TabSection[] = ["Display"];
  const meetingTabs: TabSection[] = ["Status", "Camera"];

  return (
    <div className="modal modal-open modal-fade bg-black/40">
      <div
        id="settings"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="modal-box modal-pop bg-white p-8 max-w-full max-h-[90vh] overflow-y-auto rounded-lg"
      >
        <div className="">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-avit-grey pb-8">
            <h2 className="text-4xl font-semibold">Settings</h2>
            <div
              role="button"
              tabIndex={0}
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClose();
                }
              }}
              aria-label="Close"
              className="nav-btn btn-ghost text-2xl font-bold "
            >
              <Icon
                icon="material-symbols:close-small-outline-rounded"
                width={48}
                height={48}
              ></Icon>
            </div>
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
              {/* Keyed so a tab switch remounts with a light entrance fade */}
              <div key={activeTab} className="tab-fade">
                {activeTab === "Volume" && <MicTab></MicTab>}

                {activeTab === "Display" && <DisplayTab />}

                {activeTab === "Status" && (
                  <StatusTab initialView={initialView} />
                )}

                {activeTab === "Camera" && <CameraTab></CameraTab>}
              </div>

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
                  {supportPhone && (
                    <a
                      href={`tel:${supportPhone}`}
                      className="ml-2 font-bold hover:underline"
                    >
                      {supportPhoneDisplay}
                    </a>
                  )}
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
            className={`block w-full text-left px-4 py-4 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300"
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
