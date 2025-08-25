// AppFrame.tsx
import React from "react";

export default function AppFrame({ children }: {children: React.ReactNode}) {
    const DESIGN_W = 1920;
    const DESIGN_H = 1200;

    const [vw, setVw] = React.useState(window.visualViewport?.width ?? window.innerWidth);
    const [vh, setVh] = React.useState(window.visualViewport?.height ?? window.innerHeight);
    const [correctionY, setCorrectionY] = React.useState(0);
    const ref = React.useRef<HTMLDivElement>(null);

    // Track viewport changes (resize, soft keyboard, etc.)
    React.useEffect(() => {
        const onResize = () => {
            setVw(window.visualViewport?.width ?? window.innerWidth);
            setVh(window.visualViewport?.height ?? window.innerHeight);
        };
        window.addEventListener("resize", onResize);
        window.visualViewport?.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            window.visualViewport?.removeEventListener("resize", onResize);
        };
    }, []);

    // Scale to fit (never exceed viewport)
    const scale = React.useMemo(() => Math.min(vw / DESIGN_W, vh / DESIGN_H), [vw, vh]);

    // Pixel-perfect offsets (centered)
    const scaledW = DESIGN_W * scale;
    const scaledH = DESIGN_H * scale;
    const left = Math.round((vw - scaledW) / 2);
    const top  = Math.round((vh - scaledH) / 2);

    // Optional: auto-correct any tiny vertical drift after paint
    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect(); // returns *scaled* box
        const idealTop = Math.round((vh - r.height) / 2);
        const delta = Math.round(idealTop - r.top);
        if (delta !== 0) setCorrectionY(delta);
    }, [vw, vh, scale]);
    

    return (
        <div
            id="app-frame"
            ref={ref}
            style={{
                width: DESIGN_W,
                height: DESIGN_H,
                position: "fixed",
                left,                                     // explicit pixel placement
                top: top + correctionY,                   // corrected pixel placement
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                overflow: "hidden",
                background: "black",
                // Optional: helps GPU compositing
                willChange: "transform, top, left",
            }}
        >
            {children}
        </div>
    );
}

export function DebugOverlay() {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 9999,
                border: "4px solid #00E5FF", // cyan border = expected design edge
                backgroundImage:
                    "linear-gradient(to right, rgba(0,229,255,.15) 1px, transparent 1px),"+
                    "linear-gradient(to bottom, rgba(0,229,255,.15) 1px, transparent 1px)",
                backgroundSize: "100px 100px",
            }}
        />
    );
}
