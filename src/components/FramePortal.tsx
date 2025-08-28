// FramePortal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1200;

type Props = { children?: React.ReactNode };

/**
 * Portals the Reactour DOM into #app-frame, and scales a 1920x1200 "canvas"
 * to fit the frame. Reactour controls positions; we only scale an ancestor.
 */
export default function FramePortal({ children }: Props): React.ReactPortal | null {
    const [mount, setMount] = React.useState<Element | null>(null);

    React.useEffect(() => {
        // SSR / non-browser guard
        if (typeof window === "undefined" || typeof document === "undefined") return;

        const frame = document.getElementById("app-frame") as HTMLElement | null;
        if (!frame) {
            if (process.env.NODE_ENV !== "production") {
                // eslint-disable-next-line no-console
                console.warn('[FramePortal] Couldn’t find element with id="app-frame".');
            }
            return;
        }

        // Ensure the frame can position absolute children
        const computedPos = getComputedStyle(frame).position;
        const prevPosInline = frame.style.position;
        if (computedPos === "static") frame.style.position = "relative";

        // Root layer that fills the frame
        const layer = document.createElement("div");
        layer.id = "tour-layer";
        Object.assign(layer.style, {
            position: "absolute",
            inset: "0",
            margin: "0",
            padding: "0",
            boxSizing: "border-box",
            zIndex: "10000",
            pointerEvents: "none", // let app receive clicks by default
        } as CSSStyleDeclaration);

        // Inner canvas in design pixels; we apply translate+scale here
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

        // Interactive wrapper re-enables pointer events for the popover content
        const interactive = document.createElement("div");
        Object.assign(interactive.style, {
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
        } as CSSStyleDeclaration);

        canvas.appendChild(interactive);
        layer.appendChild(canvas);
        frame.appendChild(layer);

        const applyTransform = () => {
            // Use clientWidth/Height to ignore transforms on ancestors
            const w = frame.clientWidth || frame.getBoundingClientRect().width;
            const h = frame.clientHeight || frame.getBoundingClientRect().height;
            if (!w || !h) return;

            const scale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
            const scaledW = DESIGN_WIDTH * scale;
            const scaledH = DESIGN_HEIGHT * scale;
            const offsetX = (w - scaledW) / 2;
            const offsetY = (h - scaledH) / 2;

            canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        };

        // Observe size changes of the frame (guard if ResizeObserver missing)
        let ro: ResizeObserver | null = null;

        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(applyTransform);
            ro.observe(frame);
        } else {
            // ✅ TS now knows window is still Window
            window.addEventListener("resize", applyTransform, { passive: true });
        }

        // Initial layout
        applyTransform();
        setMount(interactive);

        return () => {
            if (ro) ro.disconnect();
            else window.removeEventListener("resize", applyTransform);
            try {
                frame.removeChild(layer);
            } catch {
                /* no-op if already removed */
            }
            // restore inline style only (don’t clobber a non-inline computed style)
            frame.style.position = prevPosInline;
        };
    }, []);

    return mount ? createPortal(children as React.ReactNode, mount) : null;
}
