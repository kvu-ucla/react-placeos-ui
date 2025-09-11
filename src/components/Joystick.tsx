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
  const joystickRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<JoystickDirection>(JoystickDirection.Stop);

  const handleInput = (event: MouseEvent | TouchEvent) => {
    const box = joystickRef.current?.getBoundingClientRect();
    if (!box) return;

    const point = eventToPoint(event);
    const center = {
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    };

    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const threshold = 5;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const horizontal = absDx > threshold ? (dx < 0 ? "left" : "right") : "";
    const vertical = absDy > threshold ? (dy < 0 ? "up" : "down") : "";

    const combined = vertical + horizontal;

    const newDirection: JoystickDirection =
        (JoystickDirection as any)[combined] ??
        (JoystickDirection as any)[horizontal || vertical] ??
        JoystickDirection.Stop;

    if (newDirection !== direction) {
      setDirection(newDirection);
      onDirectionChange?.(newDirection);
    }
  };

  const stopInput = () => {
    setDirection(JoystickDirection.Stop);
    onDirectionChange?.(JoystickDirection.Stop);
  };

  const startInput = (event: React.MouseEvent | React.TouchEvent) => {
    handleInput(event.nativeEvent);

    const moveEvent = "touches" in event.nativeEvent ? "touchmove" : "mousemove";
    const endEvent = "touches" in event.nativeEvent ? "touchend" : "mouseup";

    const moveListener = (e: Event) => handleInput(e as MouseEvent | TouchEvent);
    const endListener = () => {
      window.removeEventListener(moveEvent, moveListener);
      window.removeEventListener(endEvent, endListener);
      stopInput();
    };

    window.addEventListener(moveEvent, moveListener);
    window.addEventListener(endEvent, endListener);
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
          ref={joystickRef}
          onMouseDown={startInput}
          onTouchStart={startInput}
          onContextMenu={(e) => e.preventDefault()}
          className="relative h-64 w-64 rounded-full bg-base-300 text-white touch-none select-none"
          style={{ touchAction: "none" }}
      >
        {/* Directional arrows */}
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

        {/* Thumb movement zone */}
        <div className="absolute bottom-16 left-16 right-16 top-16 flex items-center justify-center rounded-full bg-base-100">
          <div className="relative w-full h-full">
            <div
                className="absolute left-1/2 top-1/2 h-16 w-16 rounded-full bg-neutral transition-transform duration-75"
                style={{ transform: thumbTransform() }}
            />
          </div>
        </div>
      </div>
  );
}
