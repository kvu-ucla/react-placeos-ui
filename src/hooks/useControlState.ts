// src/hooks/useControlState.ts
import { useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';
import {getModule, querySystems, showSystem} from '@placeos/ts-client';

export interface SystemState {
    name?: string;
    power?: boolean;
    active?: boolean;
    connected?: boolean;
    selected_tab?: string;
    selected_input?: string;
    mute?: boolean;
    volume?: number;
}

export interface ControlState {
    power: boolean;
    volume: number;
    muted: boolean;
    active: boolean;
    system: SystemState;
    togglePower: () => void;
    setVolume: (val: number) => void;
    toggleMute: () => void;
}

export function useControlState(systemID: string, moduleAlias = 'System'): ControlState {
    const [power, setPower] = useState(false);
    const [active, setActive] = useState(false);
    const [volume, setVolumeState] = useState(0);
    const [muted, setMuted] = useState(false);
    const [system, setSystem] = useState<SystemState>({});

    const powerRef = useRef(false);
    const activeRef = useRef(false);
    const volumeRef = useRef(0);
    const mutedRef = useRef(false);
    const subs = useRef<Subscription[]>([]);

    useEffect(() => {

        querySystems({ limit: 10 }).toPromise().then((res) => {
            console.log(res!.data);
        });
        
        showSystem(systemID).subscribe( sys => {
            console.log("System object: ", sys);
        });
        
        const camMod = getModule(systemID, "Display_2");
        
        
        const camBinding = camMod.binding('connected');
        const camSub = camBinding.listen().subscribe( val => {
            console.log("camera 1 state", val);
        })
        subs.current.push(camSub);
        const camUnbind = camBinding.bind();
        subs.current.push(new Subscription(camUnbind));
        
        const mod = getModule(systemID, moduleAlias);
        
        const bind = (name: keyof SystemState, onChange: (val: any) => void) => {
            const binding = mod.binding(name);
            const sub = binding.listen().subscribe((val) => {
                setSystem((prev) => ({ ...prev, [name]: val }));
                onChange(val);
            });
            subs.current.push(sub);

            // Call bind but don't push to subs, since unbind is not a Subscription
            const unbind = binding.bind();
            subs.current.push(new Subscription(unbind));
        };

        bind('power', (val) => {
            if (typeof val === 'boolean') {
                powerRef.current = val;
                setPower(val);
            }
        });

        bind('active', (val) => {
            if (typeof val === 'boolean') {
                activeRef.current = val;
                setActive(val);
            }
        });
        
        bind('volume', (val) => {
            if (typeof val === 'number') {
                volumeRef.current = val;
                setVolumeState(val);
            }
        });

        bind('mute', (val) => {
            if (typeof val === 'boolean') {
                mutedRef.current = val;
                setMuted(val);
            }
        });

        bind('name', () => {});
        bind('connected', () => {});
        bind('selected_input', () => {});
        bind('selected_tab', () => {});

        return () => {
            subs.current.forEach((s) => s.unsubscribe());
            subs.current = [];
        };
    }, [systemID, moduleAlias]);

    const togglePower = async () => {
        const mod = getModule(systemID, moduleAlias);
        await mod.execute('power', [!activeRef.current]);
        
        console.log('activeRef State', activeRef.current);
    };

    const setVolume = async (val: number) => {
        const mod = getModule(systemID, moduleAlias);
        await mod.execute('volume', [val]);
    };

    const toggleMute = async () => {
        const mod = getModule(systemID, moduleAlias);
        await mod.execute('mute', [!mutedRef.current]);
    };

    return {
        power,
        active,
        volume,
        muted,
        system,
        togglePower,
        setVolume,
        toggleMute,
    };
}
