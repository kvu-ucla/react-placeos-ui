import * as React from "react";

function useKioskPadding() {
    const [vw, setVw] = React.useState(window.innerWidth);
    const [vh, setVh] = React.useState(window.innerHeight);

    React.useEffect(() => {
        const onResize = () => {
            setVw(window.innerWidth);
            setVh(window.innerHeight);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const DESIGN_W = 1920, DESIGN_H = 1200;
    const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    const scaledW = DESIGN_W * scale;
    const scaledH = DESIGN_H * scale;

    const horizontalPadding = Math.max(0, (vw - scaledW) / 2);
    const verticalPadding = Math.max(0, (vh - scaledH) / 2);

    const designHorizontalPadding = horizontalPadding / scale;
    const designVerticalPadding = verticalPadding / scale;

    return {
        paddingTop: designVerticalPadding,
        paddingBottom: designVerticalPadding,
        paddingLeft: designHorizontalPadding,
        paddingRight: designHorizontalPadding,
        isKioskMode: vw === 1280 && vh === 800
    };
}

export function KioskContentWrapper({ children }: { children: React.ReactNode }) {
    const padding = useKioskPadding();

    return (
        <div
            style={{
                paddingTop: padding.paddingTop,
                paddingBottom: padding.paddingBottom,
                paddingLeft: padding.paddingLeft,
                paddingRight: padding.paddingRight,
                minHeight: padding.isKioskMode ? '100vh' : 'auto',
                boxSizing: 'border-box'
            }}
        >
            {children}
        </div>
    );
}

export function KioskContentWrapperCSS({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                padding: 'max(0px, calc((100vh - 75vw) / 2)) max(0px, calc((100vw - 133.33vh) / 2))',
                minHeight: '100vh',
                boxSizing: 'border-box'
            }}
        >
            {children}
        </div>
    );
}