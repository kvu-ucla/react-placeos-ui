// src/components/Header.tsx
import { useEffect, useRef, useState } from "react";
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
  const { connection } = useZoomContext();
  const { modalType, initialTab, initialView, showModal, closeModal } =
    useModalContext();
  const { setIsOpen } = useTour();

  // The panel's OEM webview refuses author box-shadow on the header (on-glass
  // diagnostics: shadow-lg class present, computed shadow none, even with our
  // plain un-layered rule — it acts below the author cascade). Runtime
  // detection: after the shadow-lg class applies, if the COMPUTED shadow is
  // still none, render a static gradient underlay that approximates it. On
  // any engine that honors box-shadow the check reads a real value and the
  // fallback never renders. Double-rAF defers past the mount/active-flip
  // paint so an initial not-yet-styled frame can't false-positive.
  const headerRef = useRef<HTMLElement>(null);
  const [shadowFallback, setShadowFallback] = useState(false);
  useEffect(() => {
    if (!active) {
      setShadowFallback(false);
      return;
    }
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        const el = headerRef.current;
        if (!el) return;
        if (
          el.classList.contains("shadow-lg") &&
          getComputedStyle(el).boxShadow === "none"
        ) {
          setShadowFallback(true);
        }
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <header
      ref={headerRef}
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
        <SettingsModal
          initialTab={initialTab}
          initialView={initialView}
          onClose={() => closeModal()}
        />
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
      {/* Only for a confirmed loss / unreachable backend — never while the
          initial connection is still being established */}
      {connection === "offline" && (
        <OfflineModal />
      )}
      {/* Shadow fallback: static gradient strip on the header's bottom edge
          (inside the shell's z-10 header band, so it sits above the screen
          content without touching header content; static → reduced-motion
          safe) */}
      {shadowFallback && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-full h-3"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0))",
          }}
        />
      )}
    </header>
  );
}
