import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useZoomModule}  from "./useZoomModule.ts";

export type ZoomContextValue = ReturnType<typeof useZoomModule>;

const ZoomContext = createContext<ZoomContextValue | null>(null);

export interface ZoomProviderProps {

    systemId: string;
    mod?: string;
    children: ReactNode;
}

export function ZoomProvider({ systemId, mod = "ZoomCSAPI", children }: ZoomProviderProps) {
    const zoom = useZoomModule(systemId, mod);
    
    const value = useMemo(() => zoom, [zoom]);

    return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}

export function useZoomContext(): ZoomContextValue {
    const ctx = useContext(ZoomContext);
    if (!ctx) {
        throw new Error(
            "useZoom() must be used within a <ZoomProvider>. Wrap your component tree in ZoomProvider."
        );
    }
    return ctx;
}

export function useCurrentMeeting() {
    return useZoomContext().currentMeeting;
}

export function useNextMeeting() {
    return useZoomContext().nextMeeting;
}

export function useRecordingActive() {
    return useZoomContext().recording;
}

export function useCallStatus() {
    return useZoomContext().callStatus;
}

export function useZoomActions() {
    const { leave, toggleAudioMuteAll, toggleVideoMuteAll, toggleSharing } = useZoomContext();
    return { leave, toggleAudioMuteAll, toggleVideoMuteAll, toggleSharing };
}
