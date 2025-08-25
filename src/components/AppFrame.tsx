// AppFrame.tsx
import { useEffect, useState, useMemo, type PropsWithChildren } from "react";

export default function AppFrame({ children }: PropsWithChildren) {
    const [vw, setVw] = useState(window.innerWidth);
    const [vh, setVh] = useState(window.innerHeight);

    useEffect(() => {
        const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const DESIGN_W = 1920, DESIGN_H = 1200;
    const scale = useMemo(() => Math.min(vw / DESIGN_W, vh / DESIGN_H), [vw, vh]);

    const style: React.CSSProperties = {
        width: DESIGN_W, height: DESIGN_H,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        position: "fixed", inset: 0, margin: "auto",
        overflow: "hidden", background: "black"
    };

    return <div id="app-frame" style={style}>{children}</div>;
}
