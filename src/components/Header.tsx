// src/components/Header.tsx
import Clock from "./Clock";
import { useControlContext } from "../hooks/ControlStateContext";

import SupportModal from "../components/SupportModal";
import SettingsModal from "./SettingsModal";
import ShutdownModal from "./ShutdownModal";
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext";
import EndMeetingModal from "./EndMeetingModal";
import SurveyModal from "./SurveyModal";
import { useTour } from "@reactour/tour";
import { useZoomContext } from "../hooks/ZoomContext.tsx";
import OfflineModal from "./OfflineModal.tsx";

export function Header() {
  const { active, system } = useControlContext();
  const { wsConnection } = useZoomContext();
  const { modalType, initialTab, showModal, closeModal } = useModalContext();
  const { setIsOpen } = useTour();

  return (
    <header
      className={`first-step relative min-h-32 w-full flex justify-between items-center px-6 py-3 ${active ? "bg-avit-grey shadow-lg" : ""}`}
    >
      <div className="pointer-events-none absolute inset-2 overflow-hidden rounded bg-base-200 opacity-0">
        <div className="h-full w-full"></div>
      </div>
      <div className="flex items-center space-x-6">
        <img
          src={import.meta.env.BASE_URL + "logo_dts.svg"}
          alt="UCLA Digital Technology Solutions logo"
          className="h-16"
        />
      </div>
      <div className={`flex flex-col justify-center items-center ${active ? " " : "absolute left-1/2 transform -translate-x-1/2 flex flex-col"} `} >
        <Clock format="12h" />
        <div className="space-x-2 text-2xl font-bold text-gray-500">
          <span>{system.name}</span>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        {active && (
          <button
            onClick={() => showModal("survey")}
            className={`btn-primary btn-ghost flex flex-col justify-center items-center w-20 h-20 ${modalType == "survey" ? "btn-active rounded-2xl bg-blue-600 text-white" : ""}`}
          >
            <Icon
              icon="material-symbols:quiz-rounded"
              width={48}
              height={48}
            />
            <span className="text-xl font-semibold">Survey</span>
          </button>
        )}
        {active && (
          <button
            onClick={() => showModal("none")}
            className={`btn-primary flex flex-col justify-center items-center w-20 h-20 ${modalType == "none" ? "btn-active rounded-2xl bg-blue-600 text-white text-white" : ""}`}
          >
            <Icon
              icon="material-symbols:home-outline-rounded"
              width={48}
              height={48}
            />
            <div className="text-xl font-semibold">Home</div>
          </button>
        )}
        {active && (
          <button
            onClick={() => setIsOpen(true)}
            className={`btn-primary flex flex-col justify-center items-center w-20 h-20 ${modalType == "tour" ? "btn-active rounded-2xl bg-blue-600 text-white" : ""}`}
          >
            <Icon
              icon="material-symbols:explore-outline-rounded"
              width={48}
              height={48}
            />
            <span className="text-xl font-semibold">Tour</span>
          </button>
        )}
        <button
          onClick={() => showModal("support")}
          className={`btn-primary flex flex-col justify-center items-center w-20 h-20 ${modalType == "support" ? "btn-active rounded-2xl bg-blue-600 text-white" : ""}`}
        >
          <Icon icon="material-symbols:support" width={48} height={48} />
          <span className="text-xl font-semibold">Support</span>
        </button>
        {active && (
          <button
            id="settings-btn"
            onClick={() => {
              showModal("settings", { tab: "Volume" });
            }}
            className={`btn-primary btn-ghost flex flex-col justify-center items-center w-20 h-20 ${modalType == "settings" ? "btn-active rounded-2xl bg-blue-600 text-white" : ""}`}
          >
            <Icon icon="material-symbols:tune-rounded" width={48} height={48} />
            <span className="text-xl font-semibold">Settings</span>
          </button>
        )}
        {active && (
          <button
            onClick={() => showModal("shutdown")}
            className={`btn-primary btn-ghost flex flex-col justify-center items-center w-20 h-20 ${modalType == "shutdown" ? "btn-active rounded-2xl bg-blue-600 text-white" : ""}`}
          >
            <Icon
              icon="material-symbols:cancel-outline"
              width={48}
              height={48}
            />
            <span className="text-xl font-semibold">End</span>
          </button>
        )}
      </div>
      {modalType == "support" && <SupportModal onClose={() => closeModal()} />}
      {modalType == "settings" && (
        <SettingsModal initialTab={initialTab} onClose={() => closeModal()} />
      )}
      {modalType == "shutdown" && (
        <ShutdownModal onClose={() => closeModal()} />
      )}
      {modalType == "end-meeting" && (
        <EndMeetingModal onClose={() => closeModal()} />
      )}
      {modalType == "survey" && (
          <SurveyModal onClose={() => closeModal()} />
      )}
      {wsConnection == false && (
        <OfflineModal />
      )}
    </header>
  );
}
