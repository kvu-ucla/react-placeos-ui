// TourHost.tsx
import { TourProvider, useTour, type StepType } from "@reactour/tour";
import { Icon } from "@iconify/react";
import { Button } from "./Button";
import App from "../App";

// Reactour's stock controls are mouse-sized native <button>s (tiny arrows,
// 8px tappable dots, ~14px close X) — bad touch targets, and native buttons
// get skinned by the panel webview. These replace them wholesale; reactour
// keeps doing mask/positioning/step logic.
function TourNavigation() {
  const { currentStep, setCurrentStep, steps, setIsOpen } = useTour();
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  return (
    <div className="flex flex-col gap-5 mt-6">
      {/* Progress dots: indicators only, deliberately not tappable */}
      <div className="flex justify-center gap-2" aria-hidden="true">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${
              i === currentStep ? "bg-avit-blue" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          className={`min-h-14 min-w-32 px-8 text-xl ${isFirst ? "invisible" : ""}`}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            isLast
              ? setIsOpen(false)
              : setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
          }
          className="min-h-14 min-w-32 px-8 text-xl"
        >
          {isLast ? "Done" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function TourClose() {
  const { setIsOpen } = useTour();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Close tour"
      onClick={() => setIsOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(false);
        }
      }}
      className="absolute top-3 right-3 flex h-12 w-12 cursor-pointer select-none items-center justify-center text-gray-500"
    >
      <Icon
        icon="material-symbols:close-small-outline-rounded"
        width={40}
        height={40}
      />
    </div>
  );
}

export default function TourHost() {
  const steps: StepType[] = [
    {
      selector: "#settings",
      content: () => (
        <div className="flex flex-col">
          <h1 className="font-semibold">
            Welcome to your new classroom! Let’s take a tour.
          </h1>
          <div>
            We’ll walk you through each of the most important features you’ll
            need to get started.
          </div>
          <div>
            Come back to any time to remind yourself what features are available
            for you to run your classes smoothly.
          </div>
        </div>
      ),
      position: "center",
    },
    {
      selector: "#details",
      content: () => (
        <div>
          <h1 className="font-semibold">Session progress + upcoming session</h1>
          <div>
            Keep track of the clock and make sure your class ends on time. We’ll
            let you know if there’s another class booked, or if the room is free
            once your session is over.
          </div>
        </div>
      ),
    },
    {
      selector: "#microphone",
      content: () => (
        <div>
          <h1 className="font-semibold">Mic + camera controls</h1>
          <div>
            Mics and cameras are auto-locked on for BruinCasted sessions. If you
            aren’t in a formally scheduled class, you’ll be able to turn your
            microphone and camera on and off.
          </div>
        </div>
      ),
    },
    {
      selector: "#camera",
      content: () => (
        <div>
          <h1 className="font-semibold">Mic + camera controls</h1>
          <div>
            Mics and cameras are auto-locked on for BruinCasted sessions. If you
            aren’t in a formally scheduled class, you’ll be able to turn your
            microphone and camera on and off.
          </div>
        </div>
      ),
    },
    {
      selector: "#screenshare",
      content: () => (
        <div>
          <h1 className="font-semibold">Screen share + meeting controls</h1>
          <div>
            Make any changes to Zoom’s room settings here. Screen share is on by
            default, but if you don’t need it, you can tap it off here.
          </div>
        </div>
      ),
    },
    {
      selector: "#meeting-ctrls",
      content: () => (
        <div>
          <h1 className="font-semibold">Screen share + meeting controls</h1>
          <div>
            Make any changes to Zoom’s room settings here. Screen share is on by
            default, but if you don’t need it, you can tap it off here.
          </div>
        </div>
      ),
    },
    {
      selector: "#zoom-join",
      content: () => (
        <div>
          <h1 className="font-semibold">Join the Zoom Room</h1>
          <div>
            The classroom is the host of the Zoom Room, and creates the Zoom
            meeting that you can then join and present from. Connect wirelessly
            or with a USB-C cable to share content from your device.
          </div>
        </div>
      ),
    },
    {
      selector: "#settings-btn",
      content: () => (
        <div>
          <h1 className="font-semibold">Settings</h1>
          <div>To bring up other settings, you can click here.</div>
        </div>
      ),
    },
  ];

  return (
    <TourProvider
      steps={steps}
      scrollSmooth={false}
      disableDotsNavigation
      components={{ Navigation: TourNavigation, Close: TourClose }}
      styles={{
        maskWrapper: (base) => ({
          ...base,
          position: "absolute", // relative to our fixed layer
          inset: 0,
          zIndex: 10000,
        }),
        popover: (base) => ({
          ...base,
          zIndex: 10001,
          maxWidth: 660,
          padding: 32,
          borderRadius: 16,
        }),
      }}
    >
      <App />
    </TourProvider>
  );
}
