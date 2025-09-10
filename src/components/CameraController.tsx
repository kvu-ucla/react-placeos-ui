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

  function directionToSpeed(direction: JoystickPan | JoystickTilt): number {
    switch (direction) {
      case JoystickPan.Left:
      case JoystickTilt.Up:
        return -100;
      case JoystickPan.Right:
      case JoystickTilt.Down:
        return 100;
      default:
        return 0;
    }
  }

  const moveCamera = () => {
    if (!activeCamera.current) return;

    if (moveTimeout.current) clearTimeout(moveTimeout.current);

    moveTimeout.current = setTimeout(async () => {
      const { mod, index } = activeCamera.current!;
      const module = getModule(id, mod);
      if (!module) return;

      const pan_speed = directionToSpeed(panRef.current);
      const tilt_speed = directionToSpeed(tiltRef.current);
      const args = [pan_speed, tilt_speed, index ?? 0];

      try {
        await module.execute('joystick', args);
      } catch (e) {
        console.error('Joystick command failed:', e);
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
