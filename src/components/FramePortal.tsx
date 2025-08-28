// FramePortal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

type Props = { children?: React.ReactNode };

const TARGET_SELECTOR = "#app-frame";

export default function FramePortal({ children }: Props): React.ReactPortal | null {
    const [mount, setMount] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const target = document.querySelector(TARGET_SELECTOR) as HTMLElement | null;
        if (!target) return;

        // Layer lives on document.body and is positioned to the target's rect
        const layer = document.createElement("div");
        layer.id = "tour-layer";
        Object.assign(layer.style, {
            position: "fixed",
            left: "0px",
            top: "0px",
            width: "0px",
            height: "0px",
            margin: "0",
            padding: "0",
            boxSizing: "border-box",
            zIndex: "10000",
            pointerEvents: "none",
        } as CSSStyleDeclaration);

        const interactive = document.createElement("div");
        Object.assign(interactive.style, {
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
        } as CSSStyleDeclaration);

        layer.appendChild(interactive);
        document.body.appendChild(layer);

        const positionToRect = () => {
            const r = target.getBoundingClientRect();
            layer.style.left = `${Math.round(r.left)}px`;
            layer.style.top = `${Math.round(r.top)}px`;
            layer.style.width = `${Math.round(r.width)}px`;
            layer.style.height = `${Math.round(r.height)}px`;
        };

        // Keep in sync with resizes/scroll
        positionToRect();
        const ro = "ResizeObserver" in window ? new ResizeObserver(positionToRect) : null;
        if (ro) ro.observe(target);
        window.addEventListener("resize", positionToRect, { passive: true });
        window.addEventListener("scroll", positionToRect, { passive: true });

        setMount(interactive);

        return () => {
            if (ro) ro.disconnect();
            window.removeEventListener("resize", positionToRect);
            window.removeEventListener("scroll", positionToRect);
            try { document.body.removeChild(layer); } catch {}
        };
    }, []);

    return mount ? createPortal(children as React.ReactNode, mount) : null;
}
