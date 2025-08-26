// TourHost.tsx
import * as React from "react";
import { TourProvider, type StepType } from "@reactour/tour";
import App from "../App";
import { useModalContext } from "../hooks/ModalContext";
import { useFrameMetrics } from "../hooks/useFrameMetrics";

export default function TourHost() {
    const { showModal } = useModalContext();

    // your existing steps (unchanged)
    const steps: StepType[] = [
        {
            selector: '#settings',
            content: () => (
                <div className="flex flex-col">
                    <h1 className="font-semibold">Welcome to your new classroom! Let’s take a tour.</h1>
                    <div>We’ll walk you through each of the most important features you’ll need to get started.</div>
                    <div>Come back to any time to remind yourself what features are available for you to run your classes smoothly.</div>
                </div>
            ),
            position: "center"
        },
        {
            selector: "#details",
            content: () => (
                <div >
                    <h1 className="font-semibold">Session progress + upcoming session</h1>
                    <div>Keep track of the clock and make sure your class ends on time.
                        We’ll let you know if there’s another class booked, or if the room is free once your session is over.</div>
                </div>
            )
        },
        {
            selector: '#microphone',
            content: () => (
                <div >
                    <h1 className="font-semibold">Mic + camera controls</h1>
                    <div>Mics and cameras are auto-locked on for BruinCasted sessions.
                        If you aren’t in a formally scheduled class, you’ll be able to turn your microphone and camera on and off.</div>
                </div>
            )
        },
        {
            selector: '#camera',
            content: () => (
                <div >
                    <h1 className="font-semibold">Mic + camera controls</h1>
                    <div>Mics and cameras are auto-locked on for BruinCasted sessions.
                        If you aren’t in a formally scheduled class, you’ll be able to turn your microphone and camera on and off.</div>
                </div>
            )
        },
        {
            selector: '#screenshare',
            content: () => (
                <div >
                    <h1 className="font-semibold">Screen share + meeting controls</h1>
                    <div>Make any changes to Zoom’s room settings here. Screen share is on by default,
                        but if you don’t need it, you can tap it off here.</div>
                </div>
            )
        },
        {
            selector: '#meeting-ctrls',
            content: () => (
                <div >
                    <h1 className="font-semibold">Screen share + meeting controls</h1>
                    <div>Make any changes to Zoom’s room settings here. Screen share is on by default,
                        but if you don’t need it, you can tap it off here.</div>
                </div>
            )
        },
        {
            selector: '#zoom-join',
            content: () => (
                <div >
                    <h1 className="font-semibold">Join the Zoom Room</h1>
                    <div>The classroom is the host of the Zoom Room, and creates the Zoom meeting that you can then join and present from.
                        Connect wirelessly or with a USB-C cable to share content from your device.</div>
                </div>
            )
        },
        {
            selector: '#settings-btn',
            content: () => (
                <div >
                    <h1 className="font-semibold">Settings</h1>
                    <div>To bring up other settings, you can click here.</div>
                </div>
            ),
            actionAfter: async () => {
                showModal('settings');
                await waitForSelector("#settings");
            }
        },
        {
            selector: '#settings',
            content: () => (
                <div >
                    <h1 className="font-semibold">Settings</h1>
                    <div>Click on the settings icon at any time to manage controls like your audio input and output levels,
                        your displays, and other meeting controls.</div>
                </div>
            ),
            actionAfter: () => showModal('none')
        },


    ]

    function waitForSelector(sel: string, timeout = 5000) {
        return new Promise<HTMLElement>((resolve, reject) => {
            const found = document.querySelector<HTMLElement>(sel);
            if (found) return resolve(found);

            const obs = new MutationObserver(() => {
                const el = document.querySelector<HTMLElement>(sel);
                if (el) {
                    obs.disconnect();
                    resolve(el);
                }
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });

            setTimeout(() => {
                obs.disconnect();
                reject(new Error(`Timeout waiting for ${sel}`));
            }, timeout);
        });
    }
    
    const M = useFrameMetrics(1920, 1200);

    // Optional tiny manual nudge if panel is still a few px off:
    const [nudge, setNudge] = React.useState({ x: 0, y: 0 }); // change on panel if needed

    // Live diag shown on panel (toggle with a long-press or leave visible while testing)
    const Diag = () => (
        <div
            style={{
                position: "fixed", left: M.left, top: M.top, zIndex: 100000,
                background: "rgba(0,0,0,.6)", color: "#0f0", fontFamily: "monospace",
                fontSize: 12, padding: "6px 8px", borderRadius: 8,
            }}
        >
            <div>frame: {Math.round(M.left)},{Math.round(M.top)} · {Math.round(M.width)}×{Math.round(M.height)}</div>
            <div>scale: {M.SCALE.toFixed(3)} (w {M.scaleW.toFixed(3)}, h {M.scaleH.toFixed(3)})</div>
            <div>nudge: {nudge.x},{nudge.y}</div>
            <button onClick={() => setNudge(s => ({...s, y: s.y + 1}))}>↓</button>
            <button onClick={() => setNudge(s => ({...s, y: s.y - 1}))}>↑</button>
            <button onClick={() => setNudge(s => ({...s, x: s.x - 1}))}>←</button>
            <button onClick={() => setNudge(s => ({...s, x: s.x + 1}))}>→</button>
        </div>
    );

    return (
        <TourProvider
            steps={steps}
            scrollSmooth={false}
            // Key: rebase everything into the frame box using offsets ONLY.
            styles={{
                // 1) put the overlay exactly over the frame box
                maskWrapper: (base) => ({
                    ...base,
                    position: "fixed",
                    left: M.left + nudge.x,
                    top:  M.top  + nudge.y,
                    width: M.width,
                    height: M.height,
                    transform: "none",
                    zIndex: 10000,
                }),
                // 2) ensure internal rects use the same box size
                maskRect:  (b) => ({ ...b, width: M.width, height: M.height }),
                clickArea: (b) => ({ ...b, width: M.width, height: M.height }),

                // 3) rebase the spotlight from viewport coords to frame-local coords
                highlightedArea: (b, a) => ({
                    ...b,
                    x: a?.x - (M.left + nudge.x),
                    y: a?.y - (M.top  + nudge.y),
                    width: a?.width,
                    height: a?.height,
                }),

                // 4) shift popover into the frame (no extra scale)
                popover: (base) => ({
                    ...base,
                    position: "fixed",
                    transform: `translate(${- (M.left + nudge.x)}px, ${- (M.top + nudge.y)}px)`,
                    transformOrigin: "top left",
                    zIndex: 10001,
                    maxWidth: 660, padding: 32, borderRadius: 16,
                }),
            }}
        >
            {/* keep this visible while testing; remove later */}
            <Diag />
            <App />
        </TourProvider>
    );
}
