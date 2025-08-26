// AppFrame.tsx
import * as React from "react";

export default function AppFrame({ children }: { children: React.ReactNode }) {
    const DESIGN_W = 1920, DESIGN_H = 1200;
    const [vw, setVw] = React.useState(window.innerWidth);
    const [vh, setVh] = React.useState(window.innerHeight);

    React.useEffect(() => {
        const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
        window.addEventListener("resize", onResize);
        window.visualViewport?.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            window.visualViewport?.removeEventListener("resize", onResize);
        };
    }, []);

    const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    const scaledW = DESIGN_W * scale;
    const scaledH = DESIGN_H * scale;
    const left = Math.round((vw - scaledW) / 2);
    const top  = Math.round((vh - scaledH) / 2);

    return (
        <div
            id="app-frame"
            style={{
                // key: positioned container so Reactour can use absolute/inset:0 inside
                position: "fixed",
                left, top,
                width: DESIGN_W,
                height: DESIGN_H,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                background: "black",
                overflow: "hidden",
            }}
        >
            {children}
        </div>
    );
}
