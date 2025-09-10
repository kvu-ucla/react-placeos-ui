import React from "react";

type ZoomDirection = "tele" | "wide";

interface ZoomControllerProps {
    onZoomStart: (dir: ZoomDirection) => void;
    onZoomStop: () => void;
}

const ZoomController: React.FC<ZoomControllerProps> = ({ onZoomStart, onZoomStop }) => {
    const handleZoom = (dir: ZoomDirection) => (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        onZoomStart(dir);
        // Stop when user releases mouse/touch
        window.addEventListener("mouseup", onZoomStop, { once: true });
        window.addEventListener("touchend", onZoomStop, { once: true });
    };

    return (
        <div className="flex flex-col items-center gap-2 mt-4">
            <button
                onMouseDown={handleZoom("tele")}
                onTouchStart={handleZoom("tele")}
                className="px-4 py-2 bg-green-600 text-white rounded"
            >
                Zoom In
            </button>
            <button
                onMouseDown={handleZoom("wide")}
                onTouchStart={handleZoom("wide")}
                className="px-4 py-2 bg-red-600 text-white rounded"
            >
                Zoom Out
            </button>
        </div>
    );
};

export default ZoomController;
