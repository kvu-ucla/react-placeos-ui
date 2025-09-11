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
  return [
    "up", "down", "left", "right",
    "upleft", "upright", "downleft", "downright",
  ].includes(value);
};

function CameraController({
                            id,
                            activeCamera: initialCamera,
                          }: {
  id: string;
  activeCamera: ActiveCamera;
}) {
  const [direction, setDirection] = useState<JoystickDirection>(JoystickDirection.Stop);

  // 👇 Separate refs for direction and zoom
  const directionRef = useRef<JoystickDirection>(JoystickDirection.Stop);
  const zoomRef = useRef<"tele" | "wide" | null>(null);
  const activeCamera = useRef<ActiveCamera>(initialCamera);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    activeCamera.current = initialCamera;
  }, [initialCamera]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const moveCamera = (command: CameraCommand) => {
    if (!activeCamera.current) return;

    if (moveTimeout.current) clearTimeout(moveTimeout.current);

    moveTimeout.current = setTimeout(async () => {
      const { mod, index } = activeCamera.current!;
      const module = getModule(id, mod);
      if (!module) return;

      const args = index !== undefined ? [index] : [];

      // Prevent resending same command
      const lastCommand = directionRef.current;
      if (command === lastCommand) return;

      // Stop
      if (command === "stop") {
        await module.execute("stop", args);
        directionRef.current = JoystickDirection.Stop;
        return;
      }

      // Move
      await module.execute("move_all", index !== undefined ? [command, index] : [command]);

      // Only track direction if it's a joystick movement
      if (isJoystickDirection(command)) {
        directionRef.current = command;
      }
    }, 50);
  };

  const handleDirectionChange = (newDir: JoystickDirection) => {
    setDirection(newDir);
    zoomRef.current = null; // cancel zoom
    moveCamera(newDir);
  };

  const handleZoomStart = (dir: "tele" | "wide") => {
    zoomRef.current = dir;
    setDirection(JoystickDirection.Stop); // cancel directional movement
    directionRef.current = JoystickDirection.Stop;
    moveCamera(dir);
  };

  const handleZoomStop = () => {
    zoomRef.current = null;
    moveCamera("stop");
  };

  return (
      <div className="flex flex-col items-center gap-4">
        <Joystick onDirectionChange={handleDirectionChange} />
        <ZoomController
            onZoomStart={handleZoomStart}
            onZoomStop={handleZoomStop}
        />
      </div>
  );
}

export default CameraController;












// import { useRef, useState, useEffect } from "react";
// import Joystick, { JoystickPan, JoystickTilt } from "./Joystick";
// import { getModule } from "@placeos/ts-client";
//
// interface ActiveCamera {
//   mod: string;
//   index?: number;
// }
//
// function CameraController({
//                             id,
//                             activeCamera: initialCamera,
//                           }: {
//   id: string;
//   activeCamera: ActiveCamera;
// }) {
//   const [pan, setPan] = useState<JoystickPan>(JoystickPan.Stop);
//   const [tilt, setTilt] = useState<JoystickTilt>(JoystickTilt.Stop);
//
//   const panRef = useRef<JoystickPan>(pan);
//   const tiltRef = useRef<JoystickTilt>(tilt);
//   const activeCamera = useRef<ActiveCamera>(initialCamera);
//   const moveTimeout = useRef<NodeJS.Timeout | null>(null);
//
//   useEffect(() => {
//     activeCamera.current = initialCamera;
//   }, [initialCamera]);
//
//   useEffect(() => {
//     panRef.current = pan;
//   }, [pan]);
//
//   useEffect(() => {
//     tiltRef.current = tilt;
//   }, [tilt]);
//
//   useEffect(() => {
//     tiltRef.current = tilt;
//   }, [tilt]);
//
//   const moveCamera = () => {
//     if (!activeCamera.current) return;
//
//     if (moveTimeout.current) clearTimeout(moveTimeout.current);
//
//     moveTimeout.current = setTimeout(async () => {
//       const { mod, index } = activeCamera.current!;
//       const module = getModule(id, mod);
//       if (!module) return;
//
//       await module.execute("stop", index !== undefined ? [index] : []);
//
//       if (tiltRef.current !== JoystickTilt.Stop) {
//         await module.execute(
//             "move",
//             index !== undefined ? [tiltRef.current, index] : [tiltRef.current],
//         );
//       }
//
//       if (panRef.current !== JoystickPan.Stop) {
//         await module.execute(
//             "move",
//             index !== undefined ? [panRef.current, index] : [panRef.current],
//         );
//       }
//     }, 50);
//   };
//
//   return (
//       <Joystick
//           onPanChange={(newPan) => {
//             setPan(newPan);
//             moveCamera();
//           }}
//           onTiltChange={(newTilt) => {
//             setTilt(newTilt);
//             moveCamera();
//           }}
//       />
//   );
// }
//
// export default CameraController;
