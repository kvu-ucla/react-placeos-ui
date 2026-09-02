import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  useZoomRoom,
  type Booking,
  type CallStatus,
  type ConnectionState,
  type ZoomPromptKey,
  type ZrcParticipant,
} from "./useZoomRoom";
import {
  useAvControls,
  type CameraMap,
  type InputMap,
  type MicsMap,
  type OutputMap,
} from "./useAvControls";
import { useModuleExecute } from "./placeos";

export interface ZoomContextValue {
  system_id: string;
  /** Module alias of the ZoomZRC driver instance */
  zoomMod: string;

  // Zoom Room (ZoomZRC + Bookings)
  /** Raw last-emitted websocket boolean; prefer `connection` for UI gating */
  wsConnection?: boolean;
  /** Tri-state websocket status — "connecting" during cold-load grace window */
  connection: ConnectionState;
  zoomOnline: boolean;
  callStatus: CallStatus;
  /** undefined until the driver first reports; [] means a confirmed-empty meeting */
  participants?: ZrcParticipant[];
  bookings?: Booking[];
  currentMeeting?: Booking;
  nextMeeting?: Booking;
  activeBooking?: Booking;
  timeJoined: number;
  prompts: Partial<Record<ZoomPromptKey, unknown>>;
  meetingError?: unknown;
  exitMeeting: () => Promise<void>;
  startInstantMeeting: () => Promise<void>;
  joinMeeting: (meetingNumber: string) => Promise<void>;
  toggleMicMute: () => Promise<void>;
  toggleCameraMute: () => Promise<void>;
  answerPrompt: (key: ZoomPromptKey, agree?: boolean) => Promise<void>;
  sendMeetingPassword: (password: string) => Promise<void>;

  // Local AV (System / Mixer / Recording)
  volume?: number;
  volumeMute?: boolean;
  recording: boolean;
  gallery: boolean;
  mics: MicsMap;
  cams: CameraMap;
  outputs: OutputMap;
  inputs: InputMap;
  selectedCamera?: string;
  getFeatures?: string[];
  toggleGallery: () => Promise<void>;
  adjustMasterVolume: (value: number) => void;
  toggleMasterMute: () => void;
  setMasterMute: (state: boolean) => void;
  adjustDspVolume: (value: number, id: string) => void;
  toggleDspMute: (id: string) => void;

  // Escape hatch for one-off module commands
  execute: <T = unknown>(
    moduleAlias: string,
    method: string,
    args?: unknown[],
  ) => Promise<T>;
}

const ZoomContext = createContext<ZoomContextValue | null>(null);

export interface ZoomProviderProps {
  systemId: string;
  mod?: string;
  children: ReactNode;
}

export function ZoomProvider({
  systemId,
  mod = "ZoomZRC",
  children,
}: ZoomProviderProps) {
  const zoom = useZoomRoom(systemId, mod);
  const av = useAvControls(systemId);
  const execute = useModuleExecute(systemId);

  const value = useMemo<ZoomContextValue>(
    () => ({
      system_id: systemId,
      zoomMod: mod,
      wsConnection: zoom.wsConnection,
      connection: zoom.connection,
      zoomOnline: zoom.zoomOnline,
      callStatus: zoom.callStatus,
      participants: zoom.participants,
      bookings: zoom.bookings,
      currentMeeting: zoom.currentMeeting,
      nextMeeting: zoom.nextMeeting,
      activeBooking: zoom.activeBooking,
      timeJoined: zoom.timeJoined,
      prompts: zoom.prompts,
      meetingError: zoom.meetingError,
      exitMeeting: zoom.exitMeeting,
      startInstantMeeting: zoom.startInstantMeeting,
      joinMeeting: zoom.joinMeeting,
      toggleMicMute: zoom.toggleMicMute,
      toggleCameraMute: zoom.toggleCameraMute,
      answerPrompt: zoom.answerPrompt,
      sendMeetingPassword: zoom.sendMeetingPassword,
      volume: av.volume,
      volumeMute: av.volumeMute,
      recording: av.recording,
      gallery: av.gallery,
      mics: av.mics,
      cams: av.cams,
      outputs: av.outputs,
      inputs: av.inputs,
      selectedCamera: av.selectedCamera,
      getFeatures: av.getFeatures,
      toggleGallery: av.toggleGallery,
      adjustMasterVolume: av.adjustMasterVolume,
      toggleMasterMute: av.toggleMasterMute,
      setMasterMute: av.setMasterMute,
      adjustDspVolume: av.adjustDspVolume,
      toggleDspMute: av.toggleDspMute,
      execute,
    }),
    [systemId, mod, zoom, av, execute],
  );

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}

export function useZoomContext(): ZoomContextValue {
  const ctx = useContext(ZoomContext);
  if (!ctx) {
    throw new Error(
      "useZoom() must be used within a <ZoomProvider>. Wrap your component tree in ZoomProvider.",
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
  const { exitMeeting, startInstantMeeting, joinMeeting, toggleMicMute, toggleCameraMute } =
    useZoomContext();
  return { exitMeeting, startInstantMeeting, joinMeeting, toggleMicMute, toggleCameraMute };
}
