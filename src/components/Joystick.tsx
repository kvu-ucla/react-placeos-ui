import React, { useRef, useState } from "react";

// ✅ Full runtime-safe enum object
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
    const threshold = 20; // Increased threshold for better UX

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let newDirection: JoystickDirection = JoystickDirection.Stop;

    // More robust direction calculation
    if (absDx > threshold || absDy > threshold) {
      const horizontal = absDx > threshold ? (dx < 0 ? "left" : "right") : "";
      const vertical = absDy > threshold ? (dy < 0 ? "up" : "down") : "";

      // Fixed direction mapping
      if (vertical && horizontal) {
        const combined = vertical + horizontal;
        switch (combined) {
          case "upleft":
            newDirection = JoystickDirection.UpLeft;
            break;
          case "upright":
            newDirection = JoystickDirection.UpRight;
            break;
          case "downleft":
            newDirection = JoystickDirection.DownLeft;
            break;
          case "downright":
            newDirection = JoystickDirection.DownRight;
            break;
        }
      } else if (vertical) {
        newDirection = vertical === "up" ? JoystickDirection.Up : JoystickDirection.Down;
      } else if (horizontal) {
        newDirection = horizontal === "left" ? JoystickDirection.Left : JoystickDirection.Right;
      }
    }

    console.log("[handleInput]", {
      pointer: [clientX, clientY],
      dx,
      dy,
      threshold,
      newDirection,
    });

    if (newDirection !== direction) {
      setDirection(newDirection);
      console.log("[emit] onDirectionChange:", newDirection);
      onDirectionChange?.(newDirection);

      // ✅ BONUS LOG
      if (newDirection === JoystickDirection.Stop) {
        console.log("✅ RELEASE WORKING!");
      }
    }
  };

  const stopInput = () => {
    console.log("[stopInput] Pointer released. Emitting stop.");
    setDirection(JoystickDirection.Stop);
    onDirectionChange?.(JoystickDirection.Stop);
    console.log("✅ RELEASE WORKING!");
  };

  const startInput = (event: React.PointerEvent<HTMLDivElement>) => {
    console.log("[startInput] Pointer down:", {
      x: event.clientX,
      y: event.clientY,
    });

    // ✅ Key line to retain pointer tracking even outside bounds
    event.currentTarget.setPointerCapture(event.pointerId);

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
      [JoystickDirection.Stop]: "translate(-50%, -50%)",
      [JoystickDirection.Up]: "translate(-50%, -75%)",
      [JoystickDirection.Down]: "translate(-50%, -25%)",
      [JoystickDirection.Left]: "translate(-75%, -50%)",
      [JoystickDirection.Right]: "translate(-25%, -50%)",
      [JoystickDirection.UpLeft]: "translate(-75%, -75%)",
      [JoystickDirection.UpRight]: "translate(-25%, -75%)",
      [JoystickDirection.DownLeft]: "translate(-75%, -25%)",
      [JoystickDirection.DownRight]: "translate(-25%, -25%)",
    };
    return map[direction];
  };

  return (
      <div className="flex flex-col items-center gap-4 p-8">
        <div
            ref={joystickRef}
            onPointerDown={startInput}
            onContextMenu={(e) => e.preventDefault()}
            className="relative h-64 w-64 rounded-full bg-gray-700 text-white select-none cursor-pointer shadow-lg"
            style={{ touchAction: "none", userSelect: "none" }}
        >
          {/* Directional arrows */}
          <div className="absolute inset-0 flex items-center text-5xl opacity-50">
            <span style={{ transform: "translateX(0.5rem)" }}>◀</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-end text-5xl opacity-50">
            <span style={{ transform: "translateX(-0.5rem)" }}>▶</span>
          </div>
          <div className="absolute inset-0 flex justify-center text-5xl opacity-50">
            <span style={{ transform: "translateY(0.5rem)" }}>▲</span>
          </div>
          <div className="absolute inset-0 flex items-end justify-center text-5xl opacity-50">
            <span style={{ transform: "translateY(-0.5rem)" }}>▼</span>
          </div>

          {/* Thumb movement zone */}
          <div className="absolute inset-16 flex items-center justify-center rounded-full bg-gray-100">
            <div className="relative w-full h-full">
              <div
                  className="absolute left-1/2 top-1/2 h-16 w-16 rounded-full bg-gray-500 transition-transform duration-75"
                  style={{ transform: thumbTransform() }}
              />
            </div>
          </div>
        </div>

        {/* Direction indicator */}
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg font-mono text-sm">
          Direction: <span className="text-blue-400">{direction}</span>
        </div>
      </div>
  );
}