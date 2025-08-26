// FramePortal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

export default function FramePortal({ children }: { children?: React.ReactNode }): JSX.Element | null {
    const [el, setEl] = React.useState<HTMLElement | null>(null);
    React.useEffect(() => { setEl(document.getElementById("app-frame")); }, []);
    return el ? (createPortal(<>{children}</>, el) as unknown as JSX.Element) : null;
}
