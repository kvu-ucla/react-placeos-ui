// src/components/SessionControls.tsx
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useModalContext } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";
import {ControlCard } from "./ControlCard.tsx";
import { IconType } from "./icons";

export default function SessionControls() {
  const {
    callStatus,
    recording,
    gallery,
    toggleGallery,
    toggleMicMute,
    toggleCameraMute,
  } = useZoomContext();
  const { showModal } = useModalContext();

  // Loading states for each control
  const [loadingStates, setLoadingStates] = useState({
    mic: false,
    camera: false,
    gallery: false,
  });

  // If backend state never flips, clear the spinner after this long
  const LOADING_TIMEOUT_MS = 10000;
  const loadingTimeouts = useRef<
    Record<keyof typeof loadingStates, ReturnType<typeof setTimeout> | null>
  >({ mic: null, camera: null, gallery: null });

  const clearLoadingTimeout = useCallback(
    (key: keyof typeof loadingStates) => {
      const timeout = loadingTimeouts.current[key];
      if (timeout) {
        clearTimeout(timeout);
        loadingTimeouts.current[key] = null;
      }
    },
    [],
  );

  const startLoading = (key: keyof typeof loadingStates) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
    clearLoadingTimeout(key);
    loadingTimeouts.current[key] = setTimeout(() => {
      loadingTimeouts.current[key] = null;
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
      toast.error("No response from room controls", {
        toastId: "control-timeout",
      });
    }, LOADING_TIMEOUT_MS);
  };

  const stopLoading = useCallback(
    (key: keyof typeof loadingStates) => {
      clearLoadingTimeout(key);
      setLoadingStates((prev) => ({ ...prev, [key]: false }));
    },
    [clearLoadingTimeout],
  );

  // Clear any pending timeouts on unmount
  useEffect(() => {
    const timeouts = loadingTimeouts.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Track previous states to detect changes
  const prevStates = useRef({
    isMicMuted: callStatus?.isMicMuted,
    isCamMuted: callStatus?.isCamMuted,
    gallery: gallery,
  });

  const isVideoMuted = callStatus?.isCamMuted;
  const isMicAudioMuted = callStatus?.isMicMuted;
  const isJoined = callStatus?.status === "IN_MEETING";

  // Watch for state changes and clear loading when detected
  useEffect(() => {
    if (prevStates.current.isMicMuted !== isMicAudioMuted) {
      stopLoading("mic");
      prevStates.current.isMicMuted = isMicAudioMuted;
    }
  }, [isMicAudioMuted, stopLoading]);

  useEffect(() => {
    if (prevStates.current.isCamMuted !== isVideoMuted) {
      stopLoading("camera");
      prevStates.current.isCamMuted = isVideoMuted;
    }
  }, [isVideoMuted, stopLoading]);

  useEffect(() => {
    if (prevStates.current.gallery !== gallery) {
      stopLoading("gallery");
      prevStates.current.gallery = gallery;
    }
  }, [gallery, stopLoading]);
  
  //accordion logic
  const [openAccordion, setOpenAccordion] = useState<'wireless' | 'local' | null>(null);
  const wirelessRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);
  // Cancels a scroll-after-transition wait still pending from a previous open
  const cancelAccordionScroll = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelAccordionScroll.current?.(), []);

  const handleAccordionClick = (accordionName: 'wireless' | 'local') => {
    cancelAccordionScroll.current?.();
    if (openAccordion === accordionName) {
      setOpenAccordion(null); // Close if already open
      return;
    }
    setOpenAccordion(accordionName); // Open and close others

    // Scroll once the daisyUI collapse transition finishes instead of after a
    // fixed delay; safety timeout in case no transition event ever fires.
    const element =
      accordionName === 'wireless' ? wirelessRef.current : localRef.current;
    if (!element) return;
    const scroll = () => {
      cancelAccordionScroll.current?.();
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const onTransitionEnd = (ev: TransitionEvent) => {
      // only the expand transition matters, not e.g. the arrow rotation
      if (!/height|grid-template-rows/.test(ev.propertyName)) return;
      scroll();
    };
    const fallback = setTimeout(scroll, 350);
    element.addEventListener('transitionend', onTransitionEnd);
    cancelAccordionScroll.current = () => {
      element.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallback);
      cancelAccordionScroll.current = null;
    };
  };

  // Wrapper functions that handle loading states
  const handleToggleMic = async () => {
    startLoading("mic");
    try {
      await toggleMicMute();
      // Note: loading will be cleared by useEffect when state changes
    } catch (error) {
      console.error("Failed to toggle mic:", error);
      stopLoading("mic"); // Clear on error
    }
  };

  const handleToggleCamera = async () => {
    startLoading("camera");
    try {
      await toggleCameraMute();
      // Note: loading will be cleared by useEffect when state changes
    } catch (error) {
      console.error("Failed to toggle camera:", error);
      stopLoading("camera"); // Clear on error
    }
  };

  const handleToggleGallery = async () => {
    startLoading("gallery");
    try {
      await toggleGallery();
      // Note: loading will be cleared by useEffect when state changes
    } catch (error) {
      console.error("Failed to toggle gallery:", error);
      stopLoading("gallery"); // Clear on error
    }
  };

  return (
    <div className="rounded-lg">
      <div className="inline-flex justify-between items-center w-full mb-4">
        <h2 className="font-semibold text-2xl">Session Controls</h2>
        {isJoined && (
          <div className="inline-flex justify-evenly items-center bg-avit-blue rounded-lg px-4 py-2">
            <div className="relative mr-4">
              <div className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>
              <div className="relative h-4 w-4 bg-green-400 rounded-full"></div>
            </div>
            <span className="font-semibold text-xl text-white">In Meeting</span>
          </div>
        )}
        {!isJoined && (
          <div className="inline-flex justify-evenly items-center bg-avit-blue rounded-lg px-4 py-2">
            <div className="relative mr-4">
              <div className="absolute inline-flex h-4 w-4 rounded-full bg-gray-400 opacity-75"></div>
              <div className="relative h-4 w-4 bg-gray-400 rounded-full"></div>
            </div>
            <span className="font-semibold text-xl text-white">Not Joined</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 items-stretch mb-4">
        <ControlCard
          id="microphone"
          label="Microphone: "
          icon={IconType.Mic}
          disabled={!isJoined || recording}
          buttonAction={handleToggleMic}
          buttonState={isMicAudioMuted}
          isLoading={loadingStates.mic}
          // detailsButton={() => showModal("settings", { tab: "Volume" })}
        />
        <ControlCard
          id="camera"
          label="Camera: "
          icon={IconType.Camera}
          disabled={!isJoined || recording}
          buttonAction={handleToggleCamera}
          buttonState={isVideoMuted}
          isLoading={loadingStates.camera}
          // detailsButton={() => showModal("settings", { tab: "Camera" })}
        />
        <ControlCard
          id="gallery"
          label="Gallery: "
          icon={IconType.Gallery}
          disabled={!isJoined || recording}
          buttonAction={handleToggleGallery}
          buttonState={gallery}
          isLoading={loadingStates.gallery}
        />
        <ControlCard
          id="meeting-ctrls"
          label="Meeting Controls"
          buttonAction={() => showModal("settings", { tab: "Status" })}
        />
      </div>

      <h2 className="font-semibold text-2xl mb-4">Join from your device</h2>
      <div id="zoom-join" className="grid grid-cols-2 gap-4">
        {/*Share Wirelessly*/}
        <div ref={wirelessRef} className="self-start collapse collapse-arrow p-2 bg-white backdrop-blur-xl">
          <input
            type="checkbox"
            checked={openAccordion === 'wireless'}
            onChange={() => handleAccordionClick('wireless')}
          />
          <div
            className="collapse-title font-semibold inline-flex after:border-r-3 after:border-b-3 after:border-current
     after:!w-6 after:!h-6 after:!top-10 after:!right-10"
          >
            <img
              src={import.meta.env.BASE_URL + "zoom_logo.svg"}
              alt="zoom logo"
              className="h-16"
            />
            <div className="flex flex-col text-xl font-semibold text-[#3664DA] ml-4">
              Join wirelessly
              <div className="text-xl text-avit-grey-80 font-normal mt-2">
                Connect via Zoom to share your screen.
              </div>
            </div>
          </div>
          <div className="collapse-content text-xl font-normal">
            <ol className="list-decimal list-inside">
              <li>
                Open the Zoom client application on the device you wish to
                present.
              </li>
              <li>
                Tap "Share Screen" and input the{" "}
                <span className="font-semibold">sharing key shown on the room display</span>.
              </li>
            </ol>
          </div>
        </div>

        {/*Share Local*/}
        <div ref={localRef} className="self-start collapse collapse-arrow p-2 bg-white backdrop-blur-xl">
          <input
            type="checkbox"
            checked={openAccordion === 'local'}
            onChange={() => handleAccordionClick('local')}
          />
          <div
            className="collapse-title font-semibold inline-flex after:border-r-3 after:border-b-3 after:border-current
     after:!w-6 after:!h-6 after:!top-10 after:!right-10"
          >
            <Icon
              className="text-[#3664DA]"
              icon="material-symbols:cable-rounded"
              width={64}
              height={64}
            ></Icon>
            <div className="flex flex-col text-xl font-semibold text-[#3664DA] ml-4">
              Connect with USB-C
              <div className="text-xl text-avit-grey-80 font-normal mt-2">
                Use a physical USB-C cable for direct connection.
              </div>
            </div>
          </div>
          <div className="collapse-content text-xl font-normal">
            <ol className="list-decimal list-inside ">
              <li>
                Connect one end of the USB-C or HDMI cable into your laptop.
              </li>
              <li>
                The system will detect your device and switch the display
                automatically
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
