import {Header} from "./Header";
import SessionDetails from "./SessionDetails";
import Footer from "./Footer";
import SessionControls from "./SessionControls";

export default function MainScreen() {

    return (
            <div className="first-step flex flex-col min-h-screen bg-avit-bg">
                {/* Header with logo, system name, nav buttons */}
                <Header/>

                {/* Content body */}
                <main className="flex-1 mx-12 my-8 space-y-4">
                    {/* Top section with progress bar and class info */}
                    <SessionDetails/>

                    {/* Control panel for mic, camera, zoom, etc. */}
                    <SessionControls/>
                </main>

                {/* Footer with volume and session feedback */}
                <Footer/>
            </div>
    );
}
