import { ClassInfoCard } from "./ClassInfoCard";
import { useControlContext } from "../hooks/ControlStateContext";
import { useZoomContext } from "../hooks/ZoomContext";
import { Button } from "./Button";

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
          {/* Hold the line height until the room name resolves — never flash a
              fallback (the RoomStatusModal covers the cold load anyway) */}
          <h1 className="text-4xl font-semibold mt-6 m-6">
            {system.name ? `Welcome to ${system.name}` : " "}
          </h1>
          <main className="flex-1 flex items-center justify-center">
            <ClassInfoCard />
          </main>
          <footer className="p-6">
            <Button
                variant="primary"
                onClick={startAdHoc}
                className="mt-5 mb-5 mr-5 min-w-32 min-h-[5rem] px-6 py-2 text-xl"
            >
              Start Ad-Hoc Session
            </Button>
            {/* Always rendered so the row never shifts; disabled both while
                bookings hydrate and when no class is scheduled */}
            <Button
                variant="primary"
                onClick={startScheduled}
                disabled={noMeeting}
                className="mt-5 mb-5 min-w-32 min-h-[5rem] px-6 py-2 text-xl"
            >
              Start Scheduled Class
            </Button>

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
