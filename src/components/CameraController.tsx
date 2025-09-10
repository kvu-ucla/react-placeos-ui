import { useRef, useState, useEffect } from "react";
import Joystick, { JoystickDirection } from "./Joystick";
import ZoomController from "./ZoomController";
import { getModule } from "@placeos/ts-client";

interface ActiveCamera {
  mod: string;
  index?: number;
}

function CameraController({
                            id,
                            activeCamera: initialCamera,
                          }: {
  id: string;
  activeCamera: ActiveCamera;
}) {
  const [direction, setDirection] = useState<JoystickDirection>(JoystickDirection.Stop);
  const directionRef = useRef<JoystickDirection>(direction);
  const zoomRef = useRef<"tele" | "wide" | null>(null);

  const activeCamera = useRef<ActiveCamera>(initialCamera);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    activeCamera.current = initialCamera;
  }, [initialCamera]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const moveCamera = (command: JoystickDirection | "tele" | "wide" | "stop") => {
    if (!activeCamera.current) return;

    if (moveTimeout.current) clearTimeout(moveTimeout.current);

    moveTimeout.current = setTimeout(async () => {
      const { mod, index } = activeCamera.current!;
      const module = getModule(id, mod);
      if (!module) return;

      const args = index !== undefined ? [index] : [];

      // Stop first
      await module.execute("stop", args);

      if (command === "stop") return;

      const moveArgs = index !== undefined ? [command, index] : [command];
      await module.execute("move_all", moveArgs);
    }, 50);
  };

  const handleDirectionChange = (newDir: JoystickDirection) => {
    setDirection(newDir);
    moveCamera(newDir);
  };

  const handleZoomStart = (dir: "tele" | "wide") => {
    zoomRef.current = dir;
    moveCamera(dir);
  };

  const handleZoomStop = () => {
    zoomRef.current = null;
    moveCamera("stop");
  };

  return (
      <div className="flex flex-col items-center gap-4">
        <Joystick onDirectionChange={handleDirectionChange} />
        <ZoomController onZoomStart={handleZoomStart} onZoomStop={handleZoomStop} />
      </div>
  );
}

export default CameraController;
