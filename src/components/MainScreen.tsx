import {Header} from "./Header";
import SessionDetails from "./SessionDetails";
import Footer from "./Footer";
import SessionControls from "./SessionControls";

export default function MainScreen() {

    return (
            <div className="first-step relative w-[1920px] h-[1200px] bg-avit-bg overflow-hidden">
                <div className="flex flex-col w-full h-full">
                    {/* Header */}
                    <div className="z-10 shrink-0">
                        <Header />
                    </div>

                    {/* Content body (fills remaining height) */}
                    <main className="z-0 grow flex flex-col px-12 py-8 gap-4">
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
