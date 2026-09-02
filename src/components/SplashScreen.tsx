import { ClassInfoCard } from "./ClassInfoCard";
import { useControlContext } from "../hooks/ControlStateContext";
import { useZoomContext } from "../hooks/ZoomContext";

export default function SplashScreen() {
  const { system, togglePower } = useControlContext();
  const { startInstantMeeting, joinMeeting, currentMeeting } = useZoomContext();
  const noMeeting = currentMeeting == null;

  function startScheduled() {
    togglePower();
    if (currentMeeting) {
      joinMeeting(currentMeeting.id);
    }
  }
  function startAdHoc() {
    togglePower();
    startInstantMeeting();
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center text-center overflow-y-auto">
        <div className="flex flex-col">
          {/* Hold the line height until the room name resolves — never flash a fallback */}
          <h1 className="text-4xl font-semibold mt-6 m-6">
            {system.name ? `Welcome to ${system.name}` : " "}
          </h1>
          <main className="flex-1 flex items-center justify-center">
            <ClassInfoCard />
          </main>
          <footer className="p-6">
            <button
                onClick={startAdHoc}
                className="btn bg-avit-blue active:bg-[#011c50] mt-5 mb-5 mr-5 min-w-32 min-h-[5rem] text-white px-6 py-2 rounded-lg text-xl"
            >
              Start Ad-Hoc Session
            </button>
            {/* Always rendered so the row never shifts; disabled both while
                bookings hydrate and when no class is scheduled */}
            <button
                onClick={startScheduled}
                disabled={noMeeting}
                aria-disabled={noMeeting}
                className="btn ui-disabled bg-avit-blue active:bg-[#011c50] mt-5 mb-5 min-w-32 min-h-[5rem] text-white px-6 py-2 rounded-lg text-xl"
            >
              Start Scheduled Class
            </button>

            <p className="max-w-4xl text-xl text-gray-500">
              This will start the <b className="text-avit-blue">Zoom Room</b> for
              this session. Once started, you can{" "}
              <b className="text-avit-blue">
                join wirelessly from your personal device
              </b>{" "}
              to present. Instructions on next screen.
            </p>
          </footer>
        </div>
    </div>
  );
}
