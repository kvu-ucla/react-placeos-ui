import * as React from "react";

export default function AppFrame({ children }: { children: React.ReactNode }) {
    const DESIGN_W = 1920;
    const DESIGN_H = 1200;

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

    const dpr = window.devicePixelRatio || 1;

    const effectiveVw = vw * dpr;
    const effectiveVh = vh * dpr;

    const scale = Math.min(effectiveVw / DESIGN_W, effectiveVh / DESIGN_H);
    const scaledW = DESIGN_W * scale;
    const scaledH = DESIGN_H * scale;

    const left = Math.round((effectiveVw - scaledW) / 2) / dpr;
    const top = Math.round((effectiveVh - scaledH) / 2) / dpr;

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