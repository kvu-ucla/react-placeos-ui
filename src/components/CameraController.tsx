import {useRef, useState} from 'react';
import Joystick, { JoystickPan, JoystickTilt } from './Joystick';
import { getModule } from '@placeos/ts-client'; // adjust as needed

interface ActiveCamera {
    mod: string;
    index?: number;
}

function CameraController({ id, activeCamera: initialCamera }: { id: string, activeCamera: ActiveCamera; }) {
    
    const [pan, setPan] = useState<JoystickPan>(JoystickPan.Stop);
    const [tilt, setTilt] = useState<JoystickTilt>(JoystickTilt.Stop);

    const activeCamera = useRef<ActiveCamera>(initialCamera);
    const moveTimeout = useRef<NodeJS.Timeout | null>(null);

    const moveCamera = () => {
        if (!activeCamera.current) return;

        if (moveTimeout.current) clearTimeout(moveTimeout.current);

        moveTimeout.current = setTimeout(async () => {
            const { mod, index } = activeCamera.current!;
            const module = getModule(id, mod);
            if (!module) return;

            await module.execute('stop', index !== undefined ? [index] : []);

            if (tilt !== JoystickTilt.Stop) {
                await module.execute(
                    'tilt',
                    index !== undefined ? [tilt, index] : [tilt]
                );
            }

            if (pan !== JoystickPan.Stop) {
                await module.execute(
                    'pan',
                    index !== undefined ? [pan, index] : [pan]
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