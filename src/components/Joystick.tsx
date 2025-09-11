import React, { useRef, useState } from "react";

// ✅ Fully defined object (not just a type!) — REQUIRED for runtime lookup
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

interface JoystickProps {
  onDirectionChange?: (dir: JoystickDirection) => void;
}

export default function Joystick({ onDirectionChange }: JoystickProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<JoystickDirection>(JoystickDirection.Stop);

  const handleInput = (event: React.PointerEvent | PointerEvent) => {
    const clientX = 'clientX' in event ? event.clientX : 0;
    const clientY = 'clientY' in event ? event.clientY : 0;

    const box = joystickRef.current?.getBoundingClientRect();
    if (!box) return;

    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
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

    console.log("[handleInput]", {
      pointer: [clientX, clientY],
      dx,
      dy,
      horizontal,
      vertical,
      combined,
      newDirection,
    });

    if (newDirection !== direction) {
      setDirection(newDirection);
      console.log("[emit] onDirectionChange:", newDirection);
      onDirectionChange?.(newDirection);
    }
  };

  const stopInput = () => {
    if (direction !== JoystickDirection.Stop) {
      console.log("[stopInput] Pointer released. Emitting stop.");
      setDirection(JoystickDirection.Stop);
      onDirectionChange?.(JoystickDirection.Stop);
    }
  };

  const startInput = (event: React.PointerEvent<HTMLDivElement>) => {
    console.log("[startInput] Pointer down:", {
      x: event.clientX,
      y: event.clientY,
    });

    handleInput(event);

    const moveListener = (e: PointerEvent) => handleInput(e);
    const endListener = () => {
      window.removeEventListener("pointermove", moveListener);
      window.removeEventListener("pointerup", endListener);
      stopInput();
    };

    window.addEventListener("pointermove", moveListener);
    window.addEventListener("pointerup", endListener);
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
          onPointerDown={startInput}
          onContextMenu={(e) => e.preventDefault()}
          className="relative h-64 w-64 rounded-full bg-base-300 text-white select-none"
          style={{ touchAction: "none", userSelect: "none" }}
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
        <div className="absolute inset-16 flex items-center justify-center rounded-full bg-base-100">
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
