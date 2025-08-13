import React, {createContext, useContext} from 'react';
import {type ControlState, useControlState} from '../hooks/useControlState';

const ControlContext = createContext<ControlState | null>(null);

interface ControlStateProviderProps {
    systemID: string;
    moduleAlias?: string;
    children: React.ReactNode;
}

export function ControlStateProvider({
                                         systemID,
                                         moduleAlias = 'System',
                                         children,
                                     }: ControlStateProviderProps) {
    const state = useControlState(systemID, moduleAlias);
    return <ControlContext.Provider value={state}>{children}</ControlContext.Provider>;
}

export function useControlContext(): ControlState {
    const context = useContext(ControlContext);
    if (!context) throw new Error('useControlContext must be used within a ControlStateProvider');
    return context;
}
