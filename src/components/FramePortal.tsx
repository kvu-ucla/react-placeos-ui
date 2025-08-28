// FramePortal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

type Props = { children?: React.ReactNode };

/**
 * Mount the tour inside the same container as the app.
 * No transforms/sizing here — Reactour will handle positioning.
 */
const TARGET_SELECTOR = "#app-frame"; // change if your app root is different

export default function FramePortal({ children }: Props): React.ReactPortal | null {
    const [mount, setMount] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const target = document.querySelector(TARGET_SELECTOR) as HTMLElement | null;
        if (!target) return;

        // Ensure absolutely-positioned children have a positioning context
        const prevPos = target.style.position;
        if (getComputedStyle(target).position === "static") {
            target.style.position = "relative";
        }

        // Full-cover layer (no transform!)
        const layer = document.createElement("div");
        layer.id = "tour-layer";
        Object.assign(layer.style, {
            position: "absolute",
            inset: "0",           // top/right/bottom/left: 0
            margin: "0",
            padding: "0",
            boxSizing: "border-box",
            zIndex: "10000",
            pointerEvents: "none", // let app receive clicks; popover will be re-enabled
        } as CSSStyleDeclaration);

        // Re-enable interactivity for Reactour's popover subtree
        const interactive = document.createElement("div");
        Object.assign(interactive.style, {
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
        } as CSSStyleDeclaration);

        layer.appendChild(interactive);
        target.appendChild(layer);
        setMount(interactive);

        return () => {
            try { target.removeChild(layer); } catch {}
            target.style.position = prevPos;
        };
    }, []);

    return mount ? createPortal(children as React.ReactNode, mount) : null;
}
