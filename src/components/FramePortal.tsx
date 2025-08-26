// src/components/FramePortal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

export default function FramePortal({
                                        children,
                                    }: {
    children?: React.ReactNode; // <- optional to match ComponentType<{}>
}): JSX.Element | null {
    const [target, setTarget] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        setTarget(document.getElementById("app-frame"));
    }, []);

    if (!target) return null;

    // createPortal returns ReactPortal; cast to JSX.Element to satisfy FC/ComponentType
    return createPortal(<>{children}</>, target) as unknown as JSX.Element;
}
