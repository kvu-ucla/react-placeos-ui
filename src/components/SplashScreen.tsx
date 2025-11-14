import { Header } from "./Header";
import { ClassInfoCard } from "./ClassInfoCard";
import { useControlContext } from "../hooks/ControlStateContext";
import { ModalProvider } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";
import { useState, useEffect } from "react";

export default function SplashScreen() {
  const { system, togglePower } = useControlContext();
  const { joinPmi, joinMeetingId, currentMeeting } = useZoomContext();
  const noMeeting = currentMeeting == null;
  const screen = useScreenInfo();

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

  function useScreenInfo() {
    const [screenInfo, setScreenInfo] = useState({
      // Viewport dimensions
      width: window.innerWidth,
      height: window.innerHeight,

      // Screen dimensions
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,

      // Available screen space (excluding taskbars, etc.)
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,

      // Color/pixel depth
      pixelDepth: window.screen.pixelDepth,
      colorDepth: window.screen.colorDepth,

      // Device pixel ratio (for retina displays)
      devicePixelRatio: window.devicePixelRatio,
    });

    useEffect(() => {
      function handleResize() {
        setScreenInfo({
          width: window.innerWidth,
          height: window.innerHeight,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          pixelDepth: window.screen.pixelDepth,
          colorDepth: window.screen.colorDepth,
          devicePixelRatio: window.devicePixelRatio,
        });
      }

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return screenInfo;
  }

  return (
    <ModalProvider>
      <div className="min-h-screen flex flex-col items-center text-center bg-gray-100">
        <Header />

        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold mt-6 m-6">
            Welcome to {system.name ?? "Unknown Room"}
          </h1>
          <main className="flex-1 flex items-center justify-center px-4">
            <ClassInfoCard />
          </main>
          <footer className="p-6">
            <button
                onClick={startAdHoc}
                className="btn bg-avit-blue mt-5 mb-5 mr-5 min-w-32 min-h-12 text-white px-6 py-2 rounded-lg text-xl"
            >
              Start Ad-Hoc Session
            </button>
            {!noMeeting && (
                <button
                    onClick={startScheduled}
                    className="btn bg-avit-blue mt-5 mb-5 min-w-32 min-h-12 text-white px-6 py-2 rounded-lg text-xl"
                >
                  Start Scheduled Class
                </button>
            )}
            
            <p className="max-w-4xl text-xl text-gray-500">
              This will start the <b className="text-avit-blue">Zoom Room</b> for
              this session. Once started, you can{" "}
              <b className="text-avit-blue">
                join wirelessly from your personal device
              </b>{" "}
              to present. Instructions on next screen.
            </p>

            <div>
              <p>Pixel Depth: {screen.pixelDepth} bits</p>
              <p>Color Depth: {screen.colorDepth} bits</p>
              <p>Resolution: {screen.width} x {screen.height}</p>
            </div>
            
          </footer>
        </div>
      </div>

    </ModalProvider>
  );
}
