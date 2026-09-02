import Footer from "./Footer";
import SessionControls from "./SessionControls";

export default function MainScreen() {
  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Content */}
      <main className="flex-1 flex flex-col px-6 py-4 gap-4 overflow-y-auto">
        {/* Controls */}
        <SessionControls />
      </main>

      {/* Footer */}
      <div className="shrink-0">
        <Footer />
      </div>
    </div>
  );
}
