import { useRef, useEffect } from "react";
import Joystick, { JoystickDirection } from "./Joystick";
import ZoomController from "./ZoomController";
import { useModuleExecute } from "../hooks/placeos";

interface ActiveCamera {
  mod: string;
  index?: number;
}

type CameraCommand = JoystickDirection | "tele" | "wide" | "stop" | "stop_zoom";

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
  // Track current commands to prevent duplicate calls
  const currentDirectionRef = useRef<JoystickDirection>(JoystickDirection.Stop);
  const currentZoomRef = useRef<"tele" | "wide" | null>(null);
  const activeCamera = useRef<ActiveCamera>(initialCamera);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);

  const execute = useModuleExecute(id);

  useEffect(() => {
    activeCamera.current = initialCamera;
  }, [initialCamera]);

  const executeCommand = async (command: CameraCommand) => {

    if (!activeCamera.current) return;

    const { mod, index } = activeCamera.current;

    try {
      if (command === "stop") {
        await execute(mod, "stop", index !== undefined ? [index] : []);
      } else if (command === "stop_zoom"){
        await execute(mod, "stop_zoom", index !== undefined ? [index] : []);
      } else if (command === "tele" || command === "wide") {
        await execute(mod, "move_all", index !== undefined ? [command, index] : [command]);
      } else if (isJoystickDirection(command)) {
        await execute(mod, "move_all", index !== undefined ? [command, index] : [command]);
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
    // Only send command if it's actually different
    if (newDir !== currentDirectionRef.current) {
      currentDirectionRef.current = newDir;
      currentZoomRef.current = null; // Cancel any zoom
      scheduleCommand(newDir);
    }
  };

  const handleZoomStart = (dir: "tele" | "wide") => {

    // Only send command if it's different from current zoom
    if (dir !== currentZoomRef.current) {
      currentZoomRef.current = dir;
      currentDirectionRef.current = JoystickDirection.Stop; // Cancel direction tracking
      scheduleCommand(dir);
    }
  };

  const handleZoomStop = () => {

    if (currentZoomRef.current !== null) {
      currentZoomRef.current = null;
      scheduleCommand("stop_zoom");
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
          <Joystick onDirectionChange={handleDirectionChange} />
        </div>
      </div>
  );
}

export default CameraController;