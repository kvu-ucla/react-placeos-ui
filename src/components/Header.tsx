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
import { Button } from "./Button";

export function Header() {
  const { active, system } = useControlContext();
  const { wsConnection } = useZoomContext();
  const { modalType, initialTab, showModal, closeModal } = useModalContext();
  const { setIsOpen } = useTour();

  return (
    <header
      className={`first-step relative min-h-32 w-full flex justify-between items-center px-6 py-3 ${active ? "bg-transparent shadow-lg" : ""}`}
    >
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
          <Button variant="ghost" selected={modalType == "survey"} onClick={() => showModal("survey")}>
            <Icon
              icon="material-symbols:quiz-rounded"
              width={48}
              height={48}
            />
            <span className="text-xl font-semibold">Survey</span>
          </Button>
        )}
        {active && (
          <Button variant="ghost" selected={modalType == "none"} onClick={() => showModal("none")}>
            <Icon
              icon="material-symbols:home-outline-rounded"
              width={48}
              height={48}
            />
            <div className="text-xl font-semibold">Home</div>
          </Button>
        )}
        {active && (
          <Button variant="ghost" selected={modalType == "tour"} onClick={() => setIsOpen(true)}>
            <Icon
              icon="material-symbols:explore-outline-rounded"
              width={48}
              height={48}
            />
            <span className="text-xl font-semibold">Tour</span>
          </Button>
        )}
        <Button variant="ghost" selected={modalType == "support"} onClick={() => showModal("support")}>
          <Icon icon="material-symbols:support" width={48} height={48} />
          <span className="text-xl font-semibold">Support</span>
        </Button>
        {active && (
          <Button
            variant="ghost"
            id="settings-btn"
            selected={modalType == "settings"}
            onClick={() => {
              showModal("settings", { tab: "Volume" });
            }}
          >
            <Icon icon="material-symbols:tune-rounded" width={48} height={48} />
            <span className="text-xl font-semibold">Settings</span>
          </Button>
        )}
        {active && (
          <Button variant="ghost" selected={modalType == "shutdown"} onClick={() => showModal("shutdown")}>
            <Icon
              icon="material-symbols:cancel-outline"
              width={48}
              height={48}
            />
            <span className="text-xl font-semibold">End</span>
          </Button>
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
