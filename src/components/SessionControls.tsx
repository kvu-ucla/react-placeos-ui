// src/components/SessionControls.tsx
import { HdmiPort } from "lucide-react";
import { useZoomModule } from "../hooks/useZoomModule.ts";
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext.tsx";

export const IconType = {
  Mic: {
    On: "material-symbols:mic-outline-rounded",
    Off: "material-symbols:mic-off-outline-rounded",
  },
  Camera: {
    On: "material-symbols:video-camera-front-outline-rounded",
    Off: "material-symbols:video-camera-front-off-outline-rounded",
  },
  Share: {
    On: "material-symbols:screen-share-outline-rounded",
    Off: "material-symbols:stop-screen-share-outline-rounded",
  }
};

export default function SessionControls() {
  const {
    recording,
    sharing,
    toggleSharing,
    videoMuted,
    audioMuted,
    toggleAudioMuteAll,
    toggleVideoMuteAll,
    isJoined,
  } = useZoomModule();
  const { showModal } = useModalContext();

  console.log('SessionControls recording =', recording);

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
      </div>

      <div className="flex justify-between items-center mb-4">
        <ControlCard
          label="Microphone: "
          icon={IconType.Mic}
          disabled={recording}
          buttonAction={() => toggleAudioMuteAll()}
          buttonState={audioMuted}
          detailsButton={() => showModal("settings", { tab: "Volume" })}
        />
        <ControlCard
          label="Camera: "
          icon={IconType.Camera}
          disabled={recording}
          buttonAction={() => toggleVideoMuteAll()}
          buttonState={videoMuted}
          detailsButton={() => showModal("settings", { tab: "Camera" })}
        />
        <ControlCard
          label="Screen Share: "
          icon={IconType.Share}
          buttonAction={() => toggleSharing()}
          buttonState={sharing}
        />
        <ControlCard
          label="Meeting Controls"
          buttonAction={() => showModal("settings", { tab: "Status" })}
        />
      </div>

      <h2 className="font-semibold mb-4">Join from your device</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="collapse collapse-arrow p-2 bg-gray-200/20 border-base-200/20 backdrop-blur-xl">
          <input type="checkbox" name="my-accordion-1" defaultChecked />
          <div className="collapse-title font-semibold inline-flex">
            <img
              src="/assets/zoom_logo_white.svg"
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
            <HdmiPort className="h-16 w-16"></HdmiPort>
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
  label,
  icon,
  disabled,
  buttonAction,
  buttonState,
  detailsButton,
}: {
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
      className="btn btn-primary bg-white active:bg-gray-100 p-0 border-none h-[206px] w-[404px] rounded-lg text-avit-grey-80 "
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
            className="ui-disabled shadow-lg bg-avit-grey-button border-avit-grey rounded-2xl h-25 w-25 flex justify-center items-center"
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
                src="/assets/zoom_logo.svg"
                alt="Logo"
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


