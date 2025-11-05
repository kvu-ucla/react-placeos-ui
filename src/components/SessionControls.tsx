// src/components/SessionControls.tsx
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import { useModalContext } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";
import {ControlCard } from "./ControlCard.tsx";

export const IconType = {
  Mic: {
    On: "material-symbols:mic-outline-rounded",
    Off: "material-symbols:mic-off-outline-rounded",
  },
  Camera: {
    On: "material-symbols:videocam-outline-rounded",
    Off: "material-symbols:videocam-off-outline-rounded",
  },
  Share: {
    On: "material-symbols:present-to-all-outline-rounded",
    Off: "material-symbols:cancel-presentation-outline-rounded",
  },
  Gallery: {
    On: "material-symbols:person-outline-rounded",
    Off: "material-symbols:person-off-outline-rounded",
  },
};

export default function SessionControls() {
  const {
    callStatus,
    recording,
    sharing,
    gallery,
    toggleGallery,
    toggleSharing,
    toggleAudioMuteAll,
    toggleVideoMuteAll,
  } = useZoomContext();
  const { showModal } = useModalContext();

  // Loading states for each control
  const [loadingStates, setLoadingStates] = useState({
    mic: false,
    camera: false,
    share: false,
    gallery: false,
  });

  // Track previous states to detect changes
  const prevStates = useRef({
    isMicMuted: callStatus?.isMicMuted,
    isCamMuted: callStatus?.isCamMuted,
    isSharing:
      sharing?.isDirectPresentationConnected || sharing?.isSharingBlackMagic,
    gallery: gallery,
  });

  const isSharing =
    sharing?.isDirectPresentationConnected || sharing?.isSharingBlackMagic;
  const isVideoMuted = callStatus?.isCamMuted;
  const isMicAudioMuted = callStatus?.isMicMuted;
  const isJoined = callStatus?.status === "IN_MEETING";

  // Watch for state changes and clear loading when detected
  useEffect(() => {
    if (prevStates.current.isMicMuted !== isMicAudioMuted) {
      setLoadingStates((prev) => ({ ...prev, mic: false }));
      prevStates.current.isMicMuted = isMicAudioMuted;
    }
  }, [isMicAudioMuted]);

  useEffect(() => {
    if (prevStates.current.isCamMuted !== isVideoMuted) {
      setLoadingStates((prev) => ({ ...prev, camera: false }));
      prevStates.current.isCamMuted = isVideoMuted;
    }
  }, [isVideoMuted]);

  useEffect(() => {
    if (prevStates.current.isSharing !== isSharing) {
      setLoadingStates((prev) => ({ ...prev, share: false }));
      prevStates.current.isSharing = isSharing;
    }
  }, [isSharing]);

  useEffect(() => {
    if (prevStates.current.gallery !== gallery) {
      setLoadingStates((prev) => ({ ...prev, gallery: false }));
      prevStates.current.gallery = gallery;
    }
  }, [gallery]);
  
  //accordion logic
  const [openAccordion, setOpenAccordion] = useState<'wireless' | 'local' | null>(null);

  const handleAccordionClick = (accordionName: 'wireless' | 'local', element: HTMLElement | null) => {
    if (openAccordion === accordionName) {
      setOpenAccordion(null); // Close if already open
    } else {
      setOpenAccordion(accordionName); // Open and close others
      setTimeout(() => {
        element?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 100);
    }
  };

  // Wrapper functions that handle loading states
  const handleToggleMic = async () => {
    setLoadingStates((prev) => ({ ...prev, mic: true }));
    try {
      await toggleAudioMuteAll();
      // Note: loading will be cleared by useEffect when state changes
    } catch (error) {
      console.error("Failed to toggle mic:", error);
      setLoadingStates((prev) => ({ ...prev, mic: false })); // Clear on error
    }
  };

  const handleToggleCamera = async () => {
    setLoadingStates((prev) => ({ ...prev, camera: true }));
    try {
      await toggleVideoMuteAll();
      // Note: loading will be cleared by useEffect when state changes
    } catch (error) {
      console.error("Failed to toggle camera:", error);
      setLoadingStates((prev) => ({ ...prev, camera: false })); // Clear on error
    }
  };

  const handleToggleSharing = async () => {
    setLoadingStates((prev) => ({ ...prev, share: true }));
    try {
      await toggleSharing();
      // Note: loading will be cleared by useEffect when state changes
    } catch (error) {
      console.error("Failed to toggle sharing:", error);
      setLoadingStates((prev) => ({ ...prev, share: false })); // Clear on error
    }
  };

  const handleToggleGallery = async () => {
    setLoadingStates((prev) => ({ ...prev, gallery: true }));
    try {
      await toggleGallery();
      // Note: loading will be cleared by useEffect when state changes
    } catch (error) {
      console.error("Failed to toggle gallery:", error);
      setLoadingStates((prev) => ({ ...prev, gallery: false })); // Clear on error
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

      <div className="grid grid-cols-5 gap-2 items-stretch mb-4">
        <ControlCard
          id="microphone"
          label="Microphone: "
          icon={IconType.Mic}
          disabled={recording}
          buttonAction={handleToggleMic}
          buttonState={isMicAudioMuted}
          isLoading={loadingStates.mic}
          // detailsButton={() => showModal("settings", { tab: "Volume" })}
        />
        <ControlCard
          id="camera"
          label="Camera: "
          icon={IconType.Camera}
          disabled={recording}
          buttonAction={handleToggleCamera}
          buttonState={isVideoMuted}
          isLoading={loadingStates.camera}
          // detailsButton={() => showModal("settings", { tab: "Camera" })}
        />
        <ControlCard
          id="screenshare"
          label="Screen Share: "
          icon={IconType.Share}
          buttonAction={handleToggleSharing}
          buttonState={!isSharing}
          isLoading={loadingStates.share}
        />
        <ControlCard
          id="gallery"
          label="Gallery: "
          icon={IconType.Gallery}
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
        <div className="self-start collapse collapse-arrow p-2 bg-white backdrop-blur-xl">
          <input
            type="checkbox"
            checked={openAccordion === 'wireless'}
            onChange={(e) => handleAccordionClick('wireless', e.target.closest('.collapse'))}
          />
          <div
            className="collapse-title font-semibold inline-flex after:border-r-3 after: after:border-b-3 after:border-current
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
                Tap "Share Screen" and input Sharing key:{" "}
                <span className="font-semibold">
            {sharing?.directPresentationSharingKey}
          </span>
              </li>
            </ol>
          </div>
        </div>

        {/*Share Local*/}
        <div className="self-start collapse collapse-arrow p-2 bg-white backdrop-blur-xl">
          <input
            type="checkbox"
            checked={openAccordion === 'local'}
            onChange={(e) => handleAccordionClick('local', e.target.closest('.collapse'))}
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
