import React, { useRef, useState } from "react";

// Unified 8-way + stop enum
export const JoystickDirection = {
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
  UpLeft: "upleft",
  UpRight: "upright",
  DownLeft: "downleft",
  DownRight: "downright",
  Stop: "stop",
} as const;

export type JoystickDirection =
    (typeof JoystickDirection)[keyof typeof JoystickDirection];

interface Point {
  x: number;
  y: number;
}

interface JoystickProps {
  onDirectionChange?: (dir: JoystickDirection) => void;
}

const eventToPoint = (event: MouseEvent | TouchEvent): Point => {
  if ("touches" in event) {
    return event.touches.length
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : { x: -1, y: -1 };
  }
  return { x: event.clientX, y: event.clientY };
};

export default function Joystick({ onDirectionChange }: JoystickProps) {
  const panningRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<JoystickDirection>(
      JoystickDirection.Stop
  );

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

    const threshold = 10;
    let newDirection: JoystickDirection = JoystickDirection.Stop;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const horizontal =
        absDx > threshold ? (dx < 0 ? "left" : "right") : "";
    const vertical =
        absDy > threshold ? (dy < 0 ? "up" : "down") : "";

    const combined = vertical + horizontal; // e.g. "up" + "left" = "upleft"

    newDirection =
        (JoystickDirection as any)[combined] ??
        (JoystickDirection as any)[horizontal || vertical] ??
        JoystickDirection.Stop;

    if (newDirection !== direction) {
      setDirection(newDirection);
      onDirectionChange?.(newDirection);
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
    setDirection(JoystickDirection.Stop);
    onDirectionChange?.(JoystickDirection.Stop);
  };

  const thumbTransform = () => {
    const map: Record<JoystickDirection, string> = {
      stop: "translate(0, 0)",
      up: "translate(0, -50%)",
      down: "translate(0, 50%)",
      left: "translate(-50%, 0)",
      right: "translate(50%, 0)",
      upleft: "translate(-50%, -50%)",
      upright: "translate(50%, -50%)",
      downleft: "translate(-50%, 50%)",
      downright: "translate(50%, 50%)",
    };
    return map[direction];
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
