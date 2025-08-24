// src/components/SessionControls.tsx
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext";
import {useZoomContext} from "../hooks/ZoomContext";

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
  }
};

export default function SessionControls() {
  const {
    callStatus,
    recording,
    sharing,
    toggleSharing,
    toggleAudioMuteAll,
    toggleVideoMuteAll,
  } = useZoomContext();
  const { showModal } = useModalContext();
  const isSharing = sharing?.isDirectPresentationConnected || sharing?.isSharingBlackMagic
  const isVideoMuted = callStatus?.isCamMuted;
  const isMicAudioMuted = callStatus?.isMicMuted;
  const isJoined = callStatus?.status === "IN_MEETING";

  console.log('SessionControls recording =', recording);
  console.log("Call Status =", callStatus);

  return (
    <div className="bg-gradient-to-r from-[#0331A9] to-[#2F69FF] rounded-lg px-13 py-7.5 shadow text-white">
      <div className="inline-flex justify-between items-center w-full mb-4">
        <h2 className="font-semibold">Session Controls</h2>
        {isJoined && (
          <div className="inline-flex justify-evenly items-center bg-avit-blue rounded-lg py-4 px-8">
            <div className="relative mr-4">
              <div className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></div>
              <div className="relative h-4 w-4 bg-green-400 rounded-full"></div>
            </div>
            <span className="font-semibold">In Meeting</span>
          </div>
        )}
        {!isJoined && (
            <div className="inline-flex justify-evenly items-center bg-avit-blue rounded-lg py-4 px-8">
              <div className="relative mr-4">
                <div className="absolute inline-flex h-4 w-4 rounded-full bg-gray-400 opacity-75"></div>
                <div className="relative h-4 w-4 bg-gray-400 rounded-full"></div>
              </div>
              <span className="font-semibold">Not Joined</span>
            </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <ControlCard 
            id="microphone"
          label="Microphone: "
          icon={IconType.Mic}
          disabled={recording}
          buttonAction={() => toggleAudioMuteAll()}
          buttonState={isMicAudioMuted}
          detailsButton={() => showModal("settings", { tab: "Volume" })}
        />
        <ControlCard
            id="camera"
          label="Camera: "
          icon={IconType.Camera}
          disabled={recording}
          buttonAction={() => toggleVideoMuteAll()}
          buttonState={isVideoMuted}
          detailsButton={() => showModal("settings", { tab: "Camera" })}
        />
        <ControlCard
            id="screenshare"
          label="Screen Share: "
          icon={IconType.Share}
          buttonAction={() => toggleSharing()}
          buttonState={!isSharing}
        />
        <ControlCard
            id="meeting-ctrls"
          label="Meeting Controls"
          buttonAction={() => showModal("settings", { tab: "Status" })}
        />
      </div>

      <h2 className="font-semibold mb-4">Join from your device</h2>
      <div id="zoom-join" className="grid grid-cols-2 gap-4">
        <div className="collapse collapse-arrow p-2 bg-gray-200/20 border-base-200/20 backdrop-blur-xl">
          <input type="checkbox" name="my-accordion-1" defaultChecked />
          <div className="collapse-title font-semibold inline-flex">
            <img
              src={import.meta.env.BASE_URL + "zoom_logo_white.svg"}
              alt="zoom logo"
              className="h-16"
            />
            <div className="flex flex-col ml-4">
              Join wirelessly
              <div className="text-2xl font-extralight mt-2">
                Connect via Zoom to share your screen.
              </div>
            </div>
          </div>
          <div className="collapse-content text-xl font-light">
            <ol className="list-decimal list-inside">
              <li>
                Open the Zoom client application on the device you wish to
                present.
              </li>
              <li>
                Tap "Share Screen" and input [Sharing Key], if applicable.
              </li>
            </ol>
          </div>
        </div>

        <div className="collapse collapse-arrow p-2 bg-gray-200/20 border-base-200/20 backdrop-blur-xl">
          <input type="checkbox" name="my-accordion-1" defaultChecked />
          <div className="collapse-title font-semibold inline-flex">
            <Icon icon="material-symbols:cable-rounded" width={64} height={64}></Icon>
            <div className="flex flex-col ml-4">
              Connect with USB-C / HDMI
              <div className="text-2xl font-extralight mt-2">
                Use a physical USB-C or HDMI cable for direct connection.
              </div>
            </div>
          </div>
          <div className="collapse-content text-xl font-light">
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
      onClick={() => {
        if (buttonAction) buttonAction();
      }}
      id={id} className="btn btn-primary bg-white active:bg-gray-100 p-0 border-none h-[206px] w-[404px] rounded-lg text-avit-grey-80 "
    >
      <div className="px-8 py-6 w-full h-full flex flex-col items-center justify-center relative">
        {!disabled && detailsButton && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent parent button from triggering
              e.preventDefault();
              if (detailsButton) detailsButton();
            }}
            className="btn-ghost rounded-full active:bg-avit-grey-button active:border-avit-grey absolute bottom-4 right-4 w-16 h-16 flex items-center justify-center text-avit-grey-80"
          >
            <Icon
              icon="material-symbols:more-horiz"
              className="text-avit-grey-80"
              width={64}
              height={64}
            />
          </button>
        )}
        <div className="relative text-3xl mb-3.5">
          <div
            aria-disabled={disabled}
            className="ui-disabled bg-avit-grey-button border-avit-grey rounded-2xl h-25 w-25 flex justify-center items-center"
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
                  className="aria-disabled:text-white text-avit-grey-80"
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
          className="aria-disabled:text-white text-xl font-medium"
        >
          {label} {hasButtonState && (buttonState ? "Off" : "On")}
        </div>
      </div>
    </button>
  );
}


