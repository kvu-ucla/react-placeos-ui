import { useRef, useState, useEffect } from "react";
import Joystick, { JoystickDirection } from "./Joystick";
import ZoomController from "./ZoomController";
import { getModule } from "@placeos/ts-client";

interface ActiveCamera {
  mod: string;
  index?: number;
}

type CameraCommand = JoystickDirection | "tele" | "wide" | "stop";

const isJoystickDirection = (value: CameraCommand): value is JoystickDirection => {
  return Object.values(JoystickDirection).includes(value as JoystickDirection);
};

function CameraController({
                            id,
                            activeCamera: initialCamera,
                          }: {
  id: string;
  activeCamera: ActiveCamera;
}) {
  const [direction, setDirection] = useState<JoystickDirection>(JoystickDirection.Stop);

  // Track current commands to prevent duplicate calls
  const currentDirectionRef = useRef<JoystickDirection>(JoystickDirection.Stop);
  const currentZoomRef = useRef<"tele" | "wide" | null>(null);
  const activeCamera = useRef<ActiveCamera>(initialCamera);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    activeCamera.current = initialCamera;
  }, [initialCamera]);

  const executeCommand = async (command: CameraCommand) => {
    console.log("[executeCommand] Executing:", command);

    if (!activeCamera.current) {
      console.warn("[executeCommand] No active camera");
      return;
    }

    const { mod, index } = activeCamera.current;
    const module = getModule(id, mod);

    if (!module) {
      console.warn("[executeCommand] No module found for:", { id, mod });
      return;
    }

    try {
      if (command === "stop") {
        console.log("[executeCommand] Stopping camera");
        await module.execute("stop", index !== undefined ? [index] : []);
      } else if (command === "tele" || command === "wide") {
        console.log("[executeCommand] Zoom command:", command);
        await module.execute("move_all", index !== undefined ? [command, index] : [command]);
      } else if (isJoystickDirection(command)) {
        console.log("[executeCommand] Direction command:", command);
        await module.execute("move_all", index !== undefined ? [command, index] : [command]);
      }
    } catch (error) {
      console.error("[executeCommand] Error executing command:", error);
    }
  };

  const scheduleCommand = (command: CameraCommand) => {
    // Clear any pending command
    if (moveTimeout.current) {
      clearTimeout(moveTimeout.current);
    }

    moveTimeout.current = setTimeout(() => {
      executeCommand(command);
    }, 50);
  };

  const handleDirectionChange = (newDir: JoystickDirection) => {
    console.log("[handleDirectionChange] Direction changed:", newDir);

    setDirection(newDir);

    // Only send command if it's actually different
    if (newDir !== currentDirectionRef.current) {
      currentDirectionRef.current = newDir;
      currentZoomRef.current = null; // Cancel any zoom
      scheduleCommand(newDir);
    }
  };

  const handleZoomStart = (dir: "tele" | "wide") => {
    console.log("[handleZoomStart] Zoom started:", dir);

    // Only send command if it's different from current zoom
    if (dir !== currentZoomRef.current) {
      currentZoomRef.current = dir;
      currentDirectionRef.current = JoystickDirection.Stop; // Cancel direction tracking
      // DON'T call setDirection here - let joystick maintain its visual state
      scheduleCommand(dir);
    }
  };

  const handleZoomStop = () => {
    console.log("[handleZoomStop] Zoom stopped");

    if (currentZoomRef.current !== null) {
      currentZoomRef.current = null;
      scheduleCommand("stop");
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (moveTimeout.current) {
        clearTimeout(moveTimeout.current);
      }
    };
  }, []);

  return (
      <div className="flex items-center gap-8 p-8">
        {/* Zoom Controller - positioned left like Sony UI */}
        <ZoomController
            onZoomStart={handleZoomStart}
            onZoomStop={handleZoomStop}
        />

        {/* Main Control Area */}
        <div className="flex flex-col items-center gap-6">
          <div className="text-base text-gray-600 font-mono">
            Camera: {activeCamera.current.mod}
            {activeCamera.current.index !== undefined && ` [${activeCamera.current.index}]`}
          </div>

          <Joystick onDirectionChange={handleDirectionChange} />

          <div className="text-sm text-gray-500 font-mono">
            Direction: {direction} | Zoom: {currentZoomRef.current || "none"}
          </div>
        </div>
      </div>
  );
}

export default CameraController;