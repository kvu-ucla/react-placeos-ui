// AppFrame.tsx
import * as React from "react";

export default function AppFrame({ children }: { children: React.ReactNode }) {
    // Update design dimensions to match your hardware
    const DESIGN_W = 1280;
    const DESIGN_H = 800;

    const [vw, setVw] = React.useState(window.innerWidth);
    const [vh, setVh] = React.useState(window.innerHeight);

    React.useEffect(() => {
        const onResize = () => {
            setVw(window.innerWidth);
            setVh(window.innerHeight);
        };
        window.addEventListener("resize", onResize);
        window.visualViewport?.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            window.visualViewport?.removeEventListener("resize", onResize);
        };
    }, []);

    // Account for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const actualVw = vw * dpr;
    const actualVh = vh * dpr;

    const scale = Math.min(actualVw / DESIGN_W, actualVh / DESIGN_H);
    const scaledW = DESIGN_W * scale;
    const scaledH = DESIGN_H * scale;
    const left = Math.round((actualVw - scaledW) / 2) / dpr;
    const top = Math.round((actualVh - scaledH) / 2) / dpr;

    return (
        <div
            id="app-frame"
            style={{
                position: "fixed",
                left,
                top,
                width: DESIGN_W,
                height: DESIGN_H,
                transform: `scale(${scale / dpr})`,
                transformOrigin: "top left",
                background: "black",
                overflow: "hidden",
            }}
        >
            {children}
        </div>
    );
}