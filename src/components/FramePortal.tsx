// FramePortal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

export default function FramePortal({ children }: { children?: React.ReactNode }) {
    const [mount, setMount] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        const frame = document.getElementById("app-frame");
        if (!frame) return;

        // Create a dedicated layer that fills the frame (no padding/margins)
        const layer = document.createElement("div");
        layer.id = "tour-layer";
        Object.assign(layer.style, {
            position: "absolute",
            inset: "0",           // top:0 right:0 bottom:0 left:0
            width: "100%",
            height: "100%",
            margin: "0",
            padding: "0",
            boxSizing: "border-box",
            zIndex: "10000",
        });
        frame.appendChild(layer);
        setMount(layer);

        return () => {
            frame.removeChild(layer);
        };
    }, []);

    return mount ? (createPortal(<>{children}</>, mount) as unknown as JSX.Element) : null;
}
