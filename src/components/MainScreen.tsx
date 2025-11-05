import { Header } from "./Header";
import SessionDetails from "./SessionDetails";
import Footer from "./Footer";
import SessionControls from "./SessionControls";

export default function MainScreen() {
  return (
    <div className="first-step relative isolate bg-avit-bg overflow-hidden">
      <div className="flex flex-col w-full h-screen">
        {/* Header */}
        <div className="z-10 shrink-0">
          <Header />
        </div>

        {/* Content */}
        <main className="z-0 flex-1 flex flex-col px-6 py-4 gap-4 overflow-y-auto">
          {/* Top section */}
          <SessionDetails />
          {/* Controls */}
          <SessionControls />
        </main>

        {/* Footer */}
        <div className="shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
}
