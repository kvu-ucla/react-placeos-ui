import React, { useRef, useState } from "react";

export const JoystickTilt = {
  Down: "down",
  Up: "up",
  Stop: "stop",
} as const;

export const JoystickPan = {
  Left: "left",
  Right: "right",
  Stop: "stop",
} as const;

export type JoystickTilt = (typeof JoystickTilt)[keyof typeof JoystickTilt];
export type JoystickPan = (typeof JoystickPan)[keyof typeof JoystickPan];

interface Point {
  x: number;
  y: number;
}

interface JoystickProps {
  onPanChange?: (pan: JoystickPan) => void;
  onTiltChange?: (tilt: JoystickTilt) => void;
}

const eventToPoint = (event: MouseEvent | TouchEvent): Point => {
  if ("touches" in event) {
    return event.touches.length
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : { x: -1, y: -1 };
  }
  return { x: event.clientX, y: event.clientY };
};

export default function Joystick({ onPanChange, onTiltChange }: JoystickProps) {
  const panningRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<JoystickPan>(JoystickPan.Stop);
  const [tilt, setTilt] = useState<JoystickTilt>(JoystickTilt.Stop);

  const handlePan = (event: MouseEvent | TouchEvent) => {
    const box = panningRef.current?.getBoundingClientRect();
    if (!box) return;

    const point = eventToPoint(event);
    const center = {
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    };

    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let newPan: JoystickPan = JoystickPan.Stop;
    let newTilt: JoystickTilt = JoystickTilt.Stop;

    if (absDx > absDy) {
      newPan = dx < 0 ? JoystickPan.Left : JoystickPan.Right;
    } else if (absDy > absDx) {
      newTilt = dy < 0 ? JoystickTilt.Up : JoystickTilt.Down;
    }

    if (newTilt !== tilt) {
      setTilt(newTilt);
      onTiltChange?.(newTilt);
    }

    if (newPan !== pan) {
      setPan(newPan);
      onPanChange?.(newPan);
    }
  };

  const startPanMouse = (event: React.MouseEvent<HTMLDivElement>) => {
    handlePan(event.nativeEvent);
    startListeners("mouse");
  };

  const startPanTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    handlePan(event.nativeEvent);
    startListeners("touch");
  };

  const startListeners = (type: "mouse" | "touch") => {
    const moveEvent = type === "mouse" ? "mousemove" : "touchmove";
    const endEvent = type === "mouse" ? "mouseup" : "touchend";

    const handleMove = (e: Event) => handlePan(e as MouseEvent | TouchEvent);
    const handleEnd = () => {
      window.removeEventListener(moveEvent, handleMove);
      window.removeEventListener(endEvent, handleEnd);
      stopPan();
    };

    window.addEventListener(moveEvent, handleMove);
    window.addEventListener(endEvent, handleEnd);
  };

  const stopPan = () => {
    setPan(JoystickPan.Stop);
    setTilt(JoystickTilt.Stop);
    onPanChange?.(JoystickPan.Stop);
    onTiltChange?.(JoystickTilt.Stop);
  };

  const thumbTransform = () => {
    const x =
        pan === JoystickPan.Stop
            ? "0"
            : pan === JoystickPan.Left
                ? "-50%"
                : "50%";
    const y =
        tilt === JoystickTilt.Stop
            ? "0"
            : tilt === JoystickTilt.Up
                ? "-50%"
                : "50%";
    return `translate(${x}, ${y})`;
  };

  return (
      <div
          ref={panningRef}
          onMouseDown={startPanMouse}
          onTouchStart={startPanTouch}
          onContextMenu={(e) => e.preventDefault()}
          onClick={stopPan}
          className="relative h-64 w-64 rounded-full bg-base-300 text-white"
      >
        <div className="absolute inset-0 flex items-center text-6xl">
          <span style={{ transform: "translateX(-.5rem)" }}>◀</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-end text-6xl">
          <span style={{ transform: "translateX(.5rem)" }}>▶</span>
        </div>
        <div className="absolute inset-0 flex justify-center text-6xl">
          <span style={{ transform: "translateY(-.5rem)" }}>▲</span>
        </div>
        <div className="absolute inset-0 flex items-end justify-center text-6xl">
          <span style={{ transform: "translateY(.5rem)" }}>▼</span>
        </div>
        <div className="absolute bottom-16 left-16 right-16 top-16 flex items-center justify-center rounded-full bg-base-100">
          <div
              className="h-16 w-16 rounded-full bg-neutral"
              style={{ transform: thumbTransform() }}
          />
        </div>
      </div>
  );
}
