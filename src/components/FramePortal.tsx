// FramePortal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1200;

// Change this to the element you scale your app on (if any).
// Fallback is #app-frame itself.
const MIRROR_SELECTOR = "#scaled-root";

type Props = { children?: React.ReactNode };

export default function FramePortal({ children }: Props): React.ReactPortal | null {
    const [mountEl, setMountEl] = React.useState<Element | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const frame = document.getElementById("app-frame") as HTMLElement | null;
        if (!frame) return;

        // Ensure absolute children can anchor
        const prevPos = frame.style.position;
        if (getComputedStyle(frame).position === "static") frame.style.position = "relative";

        // Root layer that fills the frame (no transform here)
        const layer = document.createElement("div");
        Object.assign(layer.style, {
            position: "absolute",
            inset: "0",
            margin: "0",
            padding: "0",
            boxSizing: "border-box",
            zIndex: "10000",
            pointerEvents: "none",
        } as CSSStyleDeclaration);

        // Canvas that MAY mirror the app's transform (or stay identity)
        const canvas = document.createElement("div");
        Object.assign(canvas.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: `${DESIGN_WIDTH}px`,
            height: `${DESIGN_HEIGHT}px`,
            transformOrigin: "top left",
            willChange: "transform",
            pointerEvents: "none",
        } as CSSStyleDeclaration);

        // Actual mount (re-enable interactions for the popover)
        const interactive = document.createElement("div");
        Object.assign(interactive.style, {
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
        } as CSSStyleDeclaration);

        canvas.appendChild(interactive);
        layer.appendChild(canvas);
        frame.appendChild(layer);

        // Helper: parse matrix(a,b,c,d,tx,ty) to get scaleX/scaleY and translate
        const readTransform = (el: Element) => {
            const t = getComputedStyle(el).transform;
            if (!t || t === "none") return { isIdentity: true, value: "" };

            // matrix(a, b, c, d, tx, ty) or matrix3d(...)
            if (t.startsWith("matrix3d(")) {
                // For 2D app scaling, matrix3d is rare; still mirror exactly.
                return { isIdentity: false, value: t };
            }
            // matrix(a, b, c, d, tx, ty)
            const m = t.match(/matrix\(([-\d.eE ,]+)\)/);
            if (!m) return { isIdentity: true, value: "" };
            const [a, , , d, tx, ty] = m[1].split(",").map((s) => parseFloat(s.trim()));
            const scaleX = a;
            const scaleY = d;
            const near = (x: number, y: number) => Math.abs(x - y) < 0.001;
            const isIdentity = near(scaleX, 1) && near(scaleY, 1) && near(tx, 0) && near(ty, 0);
            return { isIdentity, value: t };
        };

        const applyTransform = () => {
            // Prefer an explicit "scaled root" if your app uses one
            const mirror =
                (document.querySelector(MIRROR_SELECTOR) as HTMLElement | null) ?? frame;

            const t = readTransform(mirror);

            if (t.isIdentity) {
                // No app transform: render tour in identity space sized to the frame
                // (Reactour will position things correctly at 1280×800)
                const w = frame.clientWidth;
                const h = frame.clientHeight;
                canvas.style.width = `${w}px`;
                canvas.style.height = `${h}px`;
                canvas.style.transform = ""; // identity
            } else {
                // App is transformed: copy its transform so our overlay stays in lockstep
                // Keep design-sized canvas so the transform math matches the app’s.
                canvas.style.width = `${DESIGN_WIDTH}px`;
                canvas.style.height = `${DESIGN_HEIGHT}px`;
                canvas.style.transform = t.value;
            }
        };

        // Observe size/transform changes
        let cleanup: () => void = () => {};
        const ro = "ResizeObserver" in window ? new ResizeObserver(applyTransform) : null;
        if (ro) {
            ro.observe(frame);
            const mirror =
                (document.querySelector(MIRROR_SELECTOR) as HTMLElement | null) ?? frame;
            ro.observe(mirror);
            cleanup = () => ro.disconnect();
        } else {
            window.addEventListener("resize", applyTransform);
            cleanup = () => window.removeEventListener("resize", applyTransform);
        }

        // Initial layout
        applyTransform();
        setMountEl(interactive);

        return () => {
            cleanup();
            try {
                frame.removeChild(layer);
            } catch {/* no-op */}
            frame.style.position = prevPos;
        };
    }, []);

    return mountEl ? createPortal(children as React.ReactNode, mountEl) : null;
}
