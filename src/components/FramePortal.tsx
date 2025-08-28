// FramePortal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

type Props = { children?: React.ReactNode };

/**
 * Mount the tour into the same DOM container as the app (or the app's scaled wrapper).
 * No transforms, no widths/heights — we avoid double scaling and let Reactour position itself.
 */
const TARGET_SELECTOR = "#app-frame"; // <-- or '#scaled-root' if that’s where your app applies transform

export default function FramePortal({ children }: Props): React.ReactPortal | null {
    const [mount, setMount] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const target = document.querySelector(TARGET_SELECTOR) as HTMLElement | null;
        if (!target) return;

        // Ensure absolute children can anchor properly
        const prevPos = target.style.position;
        if (getComputedStyle(target).position === "static") {
            target.style.position = "relative";
        }

        // Lightweight layer that fills the target; no transforms/sizing here.
        const layer = document.createElement("div");
        layer.id = "tour-layer";
        Object.assign(layer.style, {
            position: "absolute",
            inset: "0",
            margin: "0",
            padding: "0",
            boxSizing: "border-box",
            zIndex: "10000",
            pointerEvents: "none", // let app receive clicks; Reactour will enable on popover
        } as CSSStyleDeclaration);

        // Interactive wrapper so the popover remains clickable
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
