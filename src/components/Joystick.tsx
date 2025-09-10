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

    const angle =
      (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;

    const newTilt: JoystickTilt =
      angle >= 150 || angle <= -150 || (angle > -30 && angle < 30)
        ? JoystickTilt.Stop
        : angle > 0
          ? JoystickTilt.Down
          : JoystickTilt.Up;

    const newPan: JoystickPan =
      (angle >= 60 && angle <= 120) || (angle <= -60 && angle >= -120)
        ? JoystickPan.Stop
        : angle > 90 || angle < -90
          ? JoystickPan.Left
          : JoystickPan.Right;

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
      className="relative h-48 w-48 rounded-full bg-base-300 text-white"
    >
      <div className="absolute inset-0 flex items-center text-5xl">
        <span style={{ transform: "translateX(-.5rem)" }}>◀</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-end text-5xl">
        <span style={{ transform: "translateX(.5rem)" }}>▶</span>
      </div>
      <div className="absolute inset-0 flex justify-center text-5xl">
        <span style={{ transform: "translateY(-.5rem)" }}>▲</span>
      </div>
      <div className="absolute inset-0 flex items-end justify-center text-5xl">
        <span style={{ transform: "translateY(.5rem)" }}>▼</span>
      </div>
      <div className="absolute bottom-12 left-12 right-12 top-12 flex items-center justify-center rounded-full bg-base-100">
        <div
          className="h-12 w-12 rounded-full bg-neutral"
          style={{ transform: thumbTransform() }}
        />
      </div>
    </div>
  );
}
