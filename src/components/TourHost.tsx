import {TourProvider, type StepType } from '@reactour/tour';
import App from '../App';
import { useModalContext } from '../hooks/ModalContext';
import React from "react";

function useFrameMetrics(designW = 1920, designH = 1200) {
    const [m, setM] = React.useState({ left: 0, top: 0, width: 0, height: 0, SCALE: 1 });

    React.useEffect(() => {
        const update = () => {
            const el = document.getElementById("app-frame");
            if (!el) return;
            const r = el.getBoundingClientRect();
            const scaleW = r.width / designW;
            const scaleH = r.height / designH;
            const SCALE = Math.min(scaleW, scaleH);
            setM({ left: r.left, top: r.top, width: r.width, height: r.height, SCALE });
        };
        update();
        window.addEventListener("resize", update);
        window.visualViewport?.addEventListener("resize", update);
        return () => {
            window.removeEventListener("resize", update);
            window.visualViewport?.removeEventListener("resize", update);
        };
    }, [designW, designH]);

    return m;
}

export default function TourHost() {
    const { showModal } = useModalContext();

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

    const M = useFrameMetrics(1920, 1200);

    return (
        <TourProvider
            steps={steps}
            // Optional: keep Wrapper if you want, but it's not required with these styles
            // Wrapper={FramePortal}
            scrollSmooth={false}
            className="rounded-lg"
            styles={{
                // Constrain + align the overlay to the scaled frame box
                maskWrapper: (base) => ({
                    ...base,
                    position: "fixed",
                    left: M.left,
                    top: M.top,
                    width: M.width,
                    height: M.height,
                    transform: `scale(${M.SCALE})`,
                    transformOrigin: "top left",
                    zIndex: 10000,
                }),
                // Popover needs the same transform & offset so it points at the right place
                popover: (base) => ({
                    ...base,
                    maxWidth: 660,
                    padding: 32,
                    borderRadius: 16,
                    position: "fixed",
                    transform: `translate(${M.left}px, ${M.top}px) scale(${M.SCALE})`,
                    transformOrigin: "top left",
                    zIndex: 10001,
                }),
                // Controls/badge/dots live inside popover; no extra transform needed
                controls: (base) => ({ ...base, gap: 12 }),
                button: (base) => ({ ...base, fontSize: "1.125rem", padding: "0.75rem 1rem", borderRadius: 12 }),
                close: (base) => ({ ...base, width: 56, height: 56 }),
                arrow: (base) => ({ ...base, width: 48, height: 48 }),
                dot: (base, state) => ({ ...base, width: state?.showNumber ? base.width : 16, height: 16, transform: "scale(1.15)" }),
                badge: (base) => ({ ...base, width: 48, height: 48, fontSize: "1.5rem" }),
            }}
        >
            <App />
        </TourProvider>
    );
}