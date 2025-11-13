// src/components/SessionControls.tsx
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";

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
  const isSharing =
    sharing?.isDirectPresentationConnected || sharing?.isSharingBlackMagic;
  const isVideoMuted = callStatus?.isCamMuted;
  const isMicAudioMuted = callStatus?.isMicMuted;
  const isJoined = callStatus?.status === "IN_MEETING";

  return (
    <div className="rounded-lg">
      <div className="inline-flex justify-between items-center w-full mb-4">
        <h2 className="font-semibold">Session Controls</h2>
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
          buttonAction={() => toggleAudioMuteAll()}
          buttonState={isMicAudioMuted}
          // detailsButton={() => showModal("settings", { tab: "Volume" })}
        />
        <ControlCard
          id="camera"
          label="Camera: "
          icon={IconType.Camera}
          disabled={recording}
          buttonAction={() => toggleVideoMuteAll()}
          buttonState={isVideoMuted}
          // detailsButton={() => showModal("settings", { tab: "Camera" })}
        />
        <ControlCard
          id="screenshare"
          label="Screen Share: "
          icon={IconType.Share}
          buttonAction={() => toggleSharing()}
          buttonState={!isSharing}
        />
        <ControlCard
          id="gallery"
          label="Gallery: "
          icon={IconType.Gallery}
          buttonAction={() => toggleGallery()}
          buttonState={gallery}
        />
        <ControlCard
          id="meeting-ctrls"
          label="Meeting Controls"
          buttonAction={() => showModal("settings", { tab: "Status" })}
        />
      </div>

      <h2 className="font-semibold mb-4">Join from your device</h2>
      <div id="zoom-join" className="grid grid-cols-2 gap-4">
        <div className="self-start collapse collapse-arrow p-2 bg-gray-200/20 border-base-200/20 backdrop-blur-xl">
          <input type="radio" name="my-accordion-1" />
          <div
            className="collapse-title font-semibold inline-flex after:border-r-4 after:border-b-4 after:border-current
           after:!w-8 after:!h-8 after:!top-12 after:!right-12"
          >
            <img
              src={import.meta.env.BASE_URL + "zoom_logo_white.svg"}
              alt="zoom logo"
              className="h-16"
            />
            <div className="flex flex-col ml-4">
              Join wirelessly
              <div className="text-xl font-normal mt-2">
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

        <div className="self-start collapse collapse-arrow p-2 bg-gray-200/20 border-base-200/20 backdrop-blur-xl">
          <input type="radio" name="my-accordion-1" />
          <div
            className="collapse-title font-semibold inline-flex after:border-r-4 after:border-b-4 after:border-current
           after:!w-8 after:!h-8 after:!top-12 after:!right-12"
          >
            <Icon
              icon="material-symbols:cable-rounded"
              width={64}
              height={64}
            ></Icon>
            <div className="flex flex-col ml-4">
              Connect with USB-C / HDMI
              <div className="text-xl font-normal mt-2">
                Use a physical USB-C or HDMI cable for direct connection.
              </div>
            </div>
          </div>
          <div className="collapse-content text-xl font-normal">
            <ol className="list-decimal list-inside">
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

function ControlCard({
  id,
  label,
  icon,
  disabled,
  buttonAction,
  buttonState,
  detailsButton,
}: {
  id: string;
  label: string;
  icon?: any;
  disabled?: boolean;
  detailsButton?: () => void;
  buttonAction?: () => void;
  buttonState?: boolean;
}) {
  const hasButtonState = buttonState !== undefined && buttonState !== null;

  return (
    <button
      disabled={disabled}
      aria-disabled={disabled}
      onClick={() => {
        if (buttonAction) buttonAction();
      }}
      id={id}
      className={`w-full h-full btn-primary p-0 border-none aria-disabled:!bg-avit-blue aria-disabled:active:!bg-avit-blue rounded-[10px] transition-colors text-white ${buttonState ? 'bg-white border-white active:bg-gray-100' : 'bg-avit-blue active:bg-[#011c50]'}`}
    >
      <div className="px-4 py-4 w-full h-full flex flex-col items-center justify-center relative">
        {!disabled && detailsButton && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent parent button from triggering
              e.preventDefault();
              if (detailsButton) detailsButton();
            }}
            className="btn-ghost bg-transparent active:bg-avit-grey-button active:border-avit-grey absolute bottom-4 right-4 w-16 h-16 flex items-center justify-center text-avit-grey-80"
          >
            <Icon
              icon="material-symbols:more-horiz"
              className="text-avit-grey-80"
              width={64}
              height={64}
            />
          </button>
        )}
        <div className="relative text-xl mb-3.5">
          <div
            aria-disabled={disabled}
            className={`ui-disabled rounded-2xl h-25 w-25 flex justify-center items-center aria-disabled:!bg-avit-blue aria-disabled:!border-[#507AE7] aria-disabled:!border-[3px]
            ${buttonState
                ? 'bg-avit-grey-button border-avit-grey border-[3px]'
                : 'bg-[#3664DA] border-[#3664DA] border-[3px]'
            }`}
          >
            {hasButtonState &&
              (buttonState ? (
                <Icon
                  aria-disabled={disabled}
                  icon={icon.Off}
                  className="aria-disabled:text-white text-error"
                  width={64}
                  height={64}
                />
              ) : (
                <Icon
                  aria-disabled={disabled}
                  icon={icon.On}
                  className="aria-disabled:text-white text-white"
                  width={64}
                  height={64}
                />
              ))}
            {icon == null && (
              <img
                src={import.meta.env.BASE_URL + "zoom_logo.svg"}
                alt="Zoom logo"
                className="h-16 w-16"
              />
            )}
            {disabled && (
              <Icon
                aria-disabled={disabled}
                icon="material-symbols:lock"
                className="aria-disabled:text-white absolute bottom-2 right-2 text-avit-grey-80"
                width={24}
                height={24}
              />
            )}
          </div>
        </div>
        <div
          aria-disabled={disabled}
          className={`aria-disabled:text-white text-xl font-medium ${buttonState ? 'text-avit-grey-80' : 'text-white'}`}
        >
          {label} {hasButtonState && (buttonState ? "Off" : "On")}
        </div>
      </div>
    </button>
  );
}
