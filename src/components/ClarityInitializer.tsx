import {useEffect, useRef, useState} from 'react';
import clarity from '@microsoft/clarity';
import { useControlContext } from '../hooks/ControlStateContext';

const ClarityInitializer = () => {
    const { system } = useControlContext();
    const clarityInitialized = useRef(false);
    const [clarityReady, setClarityReady] = useState(false);

    useEffect(() => {
        // Wait for name from ControlContext before initializing Clarity
        if (clarityInitialized.current) return;
        
        clarity.init('u8pdrnj0yn');
        clarityInitialized.current = true;

        // Wait for Clarity to be ready
        setTimeout(() => {
            setClarityReady(true);
            console.log("✅ Clarity ready!");
        }, 1000);
    }, []);

    useEffect(() => {
        if (!clarityReady || !system.name) return;

        clarity.setTag("location", system.name);
        console.log("✅ Clarity location set as:", system.name);
    }, [clarityReady, system.name]);

    return null;
};

export default ClarityInitializer;