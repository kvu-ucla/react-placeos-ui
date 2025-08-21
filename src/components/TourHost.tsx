import {TourProvider, type StepType } from '@reactour/tour';
import App from '../App';
import { useModalContext } from '../hooks/ModalContext';
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

    // @ts-ignore
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

    // const steps = useMemo<StepType[]>(
    //     () => [
    //         {
    //             content: () => (
    //                 <div>
    //                     <h1 className="font-semibold">Welcome to your new classroom! Let’s take a tour.</h1>
    //                     <div>We’ll walk you through the most important features to get started.</div>
    //                 </div>
    //             ),
    //             position: 'center',
    //         },
    //         { selector: '#details', content: () => (<div>…</div>) },
    //         { selector: '#microphone', content: () => (<div>…</div>) },
    //         { selector: '#camera', content: () => (<div>…</div>) },
    //         { selector: '#screenshare', content: () => (<div>…</div>) },
    //         { selector: '#meeting-ctrls', content: () => (<div>…</div>) },
    //         {
    //             selector: '#zoom-join',
    //             content: () => (<div>…</div>),
    //         },
    //         {
    //             selector: '#settings',
    //             // Option A: open when entering this step
    //             action: () => showModal('settings'),
    //
    //             // Option B: also provide a button inside the popover
    //             content: ({ setIsOpen }) => (
    //                 <div>
    //                     <h1 className="font-semibold">Settings</h1>
    //                     <p>Manage audio levels, displays, and other controls.</p>
    //                     <button
    //                         className="mt-3 px-4 py-2 rounded bg-blue-600 text-white"
    //                         onClick={() => {
    //                             showModal('settings');
    //                             setIsOpen(false); // optional: close tour to avoid focus traps
    //                         }}
    //                     >
    //                         Open Settings
    //                     </button>
    //                 </div>
    //             ),
    //         },
    //     ],
    //     [showModal]
    // );

    return (
        <TourProvider steps={steps} className="rounded-lg" styles={{
            // Popover (the card)
            popover: (base) => ({
                ...base,
                maxWidth: 660,         // wider card
                padding: 32,           // more inner space
                borderRadius: 16,      // bigger rounding
            }),
            // Controls row (prev/next + dots)
            controls: (base) => ({ ...base, gap: 12 }),
            // Prev/Next buttons
            button: (base) => ({
                ...base,
                fontSize: '1.125rem',  // ~ text-lg
                padding: '0.75rem 1rem',
                borderRadius: 12,
            }),
            // Close “X”
            close: (base) => ({ ...base, width: 56, height: 56 }),
            // Step arrows (the little chevrons inside buttons)
            arrow: (base) => ({ ...base, width: 48, height: 48 }),
            // Dots under the content
            dot: (base, state) => ({
                ...base,
                width: state?.showNumber ? base.width : 16,
                height: 16,
                transform: 'scale(1.15)',
            }),
            // Step badge (1/8)
            badge: (base) => ({
                ...base,
                width: 48,
                height: 48,
                fontSize: '1.5rem',
                
            }),
        }}>
            <App />
        </TourProvider>
    );
}