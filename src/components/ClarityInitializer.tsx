import { useEffect, useRef } from 'react';
import clarity from '@microsoft/clarity';
import { useControlContext } from '../hooks/ControlStateContext';

const ClarityInitializer = () => {
    const { system } = useControlContext();
    const clarityInitialized = useRef(false);

    useEffect(() => {
        // Wait for name from ControlContext before initializing Clarity
        if (!system.name || clarityInitialized.current) return;

        clarity.init('u8pdrnj0yn');
        clarity.identify(system.name, undefined, undefined, system.name);
        clarityInitialized.current = true;

        console.log("✅ Clarity initialized for:", system.name);
    }, [system.name]);

    return null;
};

export default ClarityInitializer;