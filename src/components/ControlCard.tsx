import { Icon } from "@iconify/react";
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
export function ControlCard({
  id,
  label,
  icon,
  disabled,
  buttonAction,
  buttonState,
  detailsButton,
  isLoading = false,
}: {
  id: string;
  label: string;
  icon?: any;
  disabled?: boolean;
  detailsButton?: () => void;
  buttonAction?: () => void;
  buttonState?: boolean;
  isLoading?: boolean; // Add to type definition
}) {
  const hasButtonState = buttonState !== undefined && buttonState !== null;

  return (
    <button
      disabled={disabled || isLoading} // Disable during loading
      aria-disabled={disabled || isLoading}
      onClick={() => {
        if (buttonAction && !isLoading) buttonAction();
      }}
      id={id}
      className={`w-full h-full btn-primary p-0 border-none aria-disabled:!bg-avit-blue aria-disabled:active:!bg-avit-blue rounded-[10px] transition-colors text-white ${buttonState ? "bg-white border-white active:bg-gray-100" : "bg-avit-blue active:bg-[#011c50]"}`}
    >
      <div className="px-4 py-4 w-full h-full flex flex-col items-center justify-center relative">
        {!disabled && detailsButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
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
            ${
              buttonState
                ? "bg-avit-grey-button border-avit-grey border-[3px]"
                : "bg-[#3664DA] border-[#3664DA] border-[3px]"
            }`}
          >
            {/* Show loading spinner when isLoading is true */}
            {isLoading ? (
              <Icon
                icon="svg-spinners:ring-resize"
                className={buttonState ? "text-avit-grey-80" : "text-white"}
                width={64}
                height={64}
              />
            ) : (
              <>
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
                    src={import.meta.env.BASE_URL + "zoom_logo_white.svg"}
                    alt="Zoom logo"
                    className="h-16 w-16"
                  />
                )}
              </>
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
          className={`aria-disabled:text-white text-xl font-medium ${buttonState ? "text-avit-grey-80" : "text-white"}`}
        >
          {label} {hasButtonState && (buttonState ? "Off" : "On")}
        </div>
      </div>
    </button>
  );
}
