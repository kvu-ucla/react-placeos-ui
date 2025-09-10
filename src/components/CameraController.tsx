import { useRef, useState, useEffect } from "react";
import Joystick, { JoystickPan, JoystickTilt } from "./Joystick";
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
  const [pan, setPan] = useState<JoystickPan>(JoystickPan.Stop);
  const [tilt, setTilt] = useState<JoystickTilt>(JoystickTilt.Stop);

  const panRef = useRef<JoystickPan>(pan);
  const tiltRef = useRef<JoystickTilt>(tilt);
  const activeCamera = useRef<ActiveCamera>(initialCamera);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync refs when state changes
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    tiltRef.current = tilt;
  }, [tilt]);

  const moveCamera = () => {
    if (!activeCamera.current) return;

    if (moveTimeout.current) clearTimeout(moveTimeout.current);

    moveTimeout.current = setTimeout(async () => {
      const { mod, index } = activeCamera.current!;
      const module = getModule(id, mod);
      if (!module) return;

      await module.execute("stop", index !== undefined ? [index] : []);

      if (tiltRef.current !== JoystickTilt.Stop) {
        await module.execute(
          "tilt",
          index !== undefined ? [tiltRef.current, index] : [tiltRef.current],
        );
      }

      if (panRef.current !== JoystickPan.Stop) {
        await module.execute(
          "pan",
          index !== undefined ? [panRef.current, index] : [panRef.current],
        );
      }
    }, 50);
  };

  return (
    <Joystick
      onPanChange={(newPan) => {
        setPan(newPan);
        moveCamera();
      }}
      onTiltChange={(newTilt) => {
        setTilt(newTilt);
        moveCamera();
      }}
    />
  );
}

export default CameraController;
