// src/components/SessionControls.tsx
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { notify } from "../notify";
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
      notify.error("No response from room controls", "control-timeout");
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
        {/* Radio-collapse pair (shared name): opening one closes the other,
            so only one panel's height is ever added and the section can't
            outgrow its flex space */}
        <div className="self-start collapse collapse-arrow p-2 bg-white backdrop-blur-xl">
          <input type="radio" name="zoom-join-accordion" />
          {/* after:! overrides required: daisyUI's .collapse-arrow>.collapse-title:after
              sets width/height/top/inset-inline-end at higher specificity */}
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
          {/* Compact body so an open panel fits the section's flex space */}
          <div className="collapse-content text-base font-normal leading-snug !pb-2">
            <ol className="list-decimal list-inside space-y-1">
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
        <div className="self-start collapse collapse-arrow p-2 bg-white backdrop-blur-xl">
          <input type="radio" name="zoom-join-accordion" />
          {/* after:! overrides required: daisyUI's .collapse-arrow>.collapse-title:after
              sets width/height/top/inset-inline-end at higher specificity */}
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
          {/* Compact body so an open panel fits the section's flex space */}
          <div className="collapse-content text-base font-normal leading-snug !pb-2">
            <ol className="list-decimal list-inside space-y-1">
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
