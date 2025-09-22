import { Header } from "./Header";
import { ClassInfoCard } from "./ClassInfoCard";
import { useControlContext } from "../hooks/ControlStateContext";
import { ModalProvider } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";

export default function SplashScreen() {
  const { system, togglePower } = useControlContext();
  const { joinPmi, joinMeetingId, currentMeeting } = useZoomContext();
  const noMeeting = currentMeeting == null;

  function startScheduled() {
    togglePower();
    if (currentMeeting) {
      joinMeetingId(currentMeeting.meetingNumber);
    }
  }
  function startAdHoc() {
    togglePower();
    joinPmi();
  }

  return (
    <ModalProvider>
      <div className="min-h-screen flex flex-col items-center text-center bg-gray-100 pb-32">
        <Header />

        <div className="flex flex-col">
          <h1 className="text-6xl font-semibold mt-12 mb-12">
            Welcome to {system.name ?? "Unknown Room"}
          </h1>
          <main className="flex-1 flex items-center justify-center px-4">
            <ClassInfoCard />
          </main>
          <footer className="p-6">
            <button
                onClick={startAdHoc}
                className="btn bg-avit-blue min-w-64 min-h-24 mt-9 mb-9 mr-9 text-white px-6 py-2 rounded-lg text-3xl"
            >
              Start Ad-Hoc Session
            </button>
            {!noMeeting && (
                <button
                    onClick={startScheduled}
                    className="btn bg-avit-blue min-w-64 min-h-24 mt-9 mb-9 text-white px-6 py-2 rounded-lg text-3xl"
                >
                  Start Scheduled Class
                </button>
            )}
            
            <p className="max-w-6xl text-3xl text-gray-500">
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

    </ModalProvider>
  );
}
