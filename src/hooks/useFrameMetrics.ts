// useFrameMetrics.ts
import * as React from "react";

export type FrameMetrics = {
    left: number; top: number; width: number; height: number;
    scaleW: number; scaleH: number; SCALE: number;
};

export function useFrameMetrics(designW = 1920, designH = 1200): FrameMetrics {
    const read = (): FrameMetrics => {
        const el = document.getElementById("app-frame");
        if (!el) {
            const w = window.innerWidth, h = window.innerHeight;
            return { left: 0, top: 0, width: w, height: h, scaleW: 1, scaleH: 1, SCALE: 1 };
        }
        const r = el.getBoundingClientRect();
        const scaleW = r.width / designW;
        const scaleH = r.height / designH;
        return { left: r.left, top: r.top, width: r.width, height: r.height, scaleW, scaleH, SCALE: Math.min(scaleW, scaleH) };
    };

    const [m, setM] = React.useState<FrameMetrics>(read);

    React.useEffect(() => {
        const onResize = () => setM(read());
        onResize();
        window.addEventListener("resize", onResize);
        window.visualViewport?.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            window.visualViewport?.removeEventListener("resize", onResize);
        };
    }, [designW, designH]);

    return m;
}
