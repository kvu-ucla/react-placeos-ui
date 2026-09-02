// src/hooks/useZoomRoom.ts
// Zoom Room state + actions backed by the ZoomZRC driver and the Bookings
// (booking_converter) module.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { connectionState } from "@placeos/ts-client";
import { useBinder, useModuleExecute } from "./placeos";

// Websocket tri-state: "connecting" until the socket first opens (with a grace
// window before declaring the backend unreachable), so a cold load never
// flashes the offline UI while merely connecting.
export type ConnectionState = "connecting" | "online" | "offline";

// How long a never-connected socket may stay "connecting" before we call it
// genuinely unreachable.
const CONNECT_GRACE_MS = 10_000;

export type CallState =
  | "NOT_IN_MEETING"
  | "CONNECTING_MEETING"
  | "IN_MEETING"
  | "LOGGED_OUT"
  | "UNKNOWN";

export interface CallStatus {
  status: CallState;
  isMicMuted?: boolean;
  isCamMuted?: boolean;
}

// PlaceOS calendar event exposed by the Bookings (booking_converter) module
export interface Booking {
  title: string;
  location?: string | null;
  event_start: number; // unix seconds
  event_end: number; // unix seconds
  id: string; // zoom meeting number
  creator?: string | null; // currently always null from converter
}

// Field names confirmed against the live ZRC microservice payload
// (2026-09-01, lab-test room); everything but the id stays optional since the
// driver stores the raw response. Booleans can arrive as null.
export interface ZrcParticipant {
  user_id: number | string;
  user_name?: string;
  is_host?: boolean | null;
  is_cohost?: boolean | null;
  is_myself?: boolean | null;
  is_in_waiting_room?: boolean | null;
  is_raising_hand?: boolean | null;
  is_talking?: boolean | null;
  is_on_hold?: boolean | null;
  audio_status?: { audio_type?: string; is_muted?: boolean | null };
  video_status?: {
    has_source?: boolean | null;
    receiving?: boolean | null;
    sending?: boolean | null;
    can_control?: boolean | null;
  };
  avatar_path?: string;
  parent_user_id?: number;
  [key: string]: unknown;
}

// The driver publishes the whole GET /participants response, an object
// wrapping the array: { room_id, session, result, success, participants: [...], count }.
interface ZrcParticipantsPayload {
  participants?: ZrcParticipant[] | null;
  [key: string]: unknown;
}

// Interactive prompt status keys reflected by the ZoomZRC driver. Full event
// payloads are stored; the driver clears a key back to null once answered.
export type ZoomPromptKey =
  | "meeting_password_required"
  | "consent_prompt"
  | "combined_consent_prompt"
  | "consolidated_customized_consent_prompt"
  | "meeting_reminder"
  | "customized_reminder"
  | "privacy_alert"
  | "inactive_detection"
  | "recording_request"
  | "recording_disclaimer_needed"
  | "ask_unmute_audio"
  | "ask_start_video"
  | "waiting_for_host"
  | "ai_companion_request"
  | "incoming_share";

const PROMPT_KEYS: ZoomPromptKey[] = [
  "meeting_password_required",
  "consent_prompt",
  "combined_consent_prompt",
  "consolidated_customized_consent_prompt",
  "meeting_reminder",
  "customized_reminder",
  "privacy_alert",
  "inactive_detection",
  "recording_request",
  "recording_disclaimer_needed",
  "ask_unmute_audio",
  "ask_start_video",
  "waiting_for_host",
  "ai_companion_request",
  "incoming_share",
];

function toCallState(
  meetingStatus?: string | null,
  meetingActive?: boolean,
): CallState {
  if (meetingActive || meetingStatus === "MeetingStatusInMeeting")
    return "IN_MEETING";
  if (!meetingStatus || meetingStatus === "MeetingStatusNotInMeeting")
    return "NOT_IN_MEETING";
  if (meetingStatus.includes("Connecting")) return "CONNECTING_MEETING";
  if (meetingStatus.includes("LoggedOut")) return "LOGGED_OUT";
  return "UNKNOWN";
}

export function useZoomRoom(systemId: string, mod = "ZoomZRC") {
  const [meetingStatus, setMeetingStatus] = useState<string | null>();
  const [meetingActive, setMeetingActive] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>();
  const [isCamMuted, setIsCamMuted] = useState<boolean>();
  // undefined until the driver reports for the first time, so consumers can
  // distinguish "still loading" from "empty meeting"
  const [participants, setParticipants] = useState<ZrcParticipant[]>();
  const [online, setOnline] = useState<boolean>(false);
  const [zrcConnectionState, setZrcConnectionState] = useState<string | null>();
  const [paired, setPaired] = useState<boolean>();
  const [health, setHealth] = useState<unknown>();
  const [wsConnection, setWsConnection] = useState<boolean>();
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  // Whether the websocket has EVER connected — a false emitted before the
  // first open just means "still dialing", not a real loss.
  const hasConnectedRef = useRef(false);
  const [bookings, setBookings] = useState<Booking[]>();
  const [currentMeeting, setCurrentMeeting] = useState<Booking>();
  const [nextMeeting, setNextMeeting] = useState<Booking>();
  const [prompts, setPrompts] = useState<Partial<Record<ZoomPromptKey, unknown>>>(
    {},
  );
  const [meetingError, setMeetingError] = useState<unknown>();
  const [timeJoined, setTimeJoined] = useState<number>(0);

  useBinder(
    systemId,
    (binder) => {
      // ZoomZRC meeting/connection state
      binder.listen<string | null>(mod, "meeting_status", setMeetingStatus);
      binder.listen<boolean>(mod, "meeting_active", (val) =>
        setMeetingActive(!!val),
      );
      binder.listen<boolean>(mod, "mic_mute", setIsMicMuted);
      binder.listen<boolean>(mod, "camera_mute", setIsCamMuted);
      binder.listen<ZrcParticipant[] | ZrcParticipantsPayload | null>(
        mod,
        "participants",
        (val) => {
          const list = Array.isArray(val) ? val : val?.participants;
          setParticipants(Array.isArray(list) ? list : []);
        },
      );
      binder.listen<boolean>(mod, "online", (val) => setOnline(!!val));
      binder.listen<string | null>(
        mod,
        "connection_state",
        setZrcConnectionState,
      );
      binder.listen<boolean>(mod, "paired", setPaired);
      binder.listen(mod, "health", setHealth);
      binder.listen(mod, "meeting_error", setMeetingError);

      // Interactive prompts — full payloads; driver nulls a key once answered
      for (const key of PROMPT_KEYS) {
        binder.listen(mod, key, (payload) =>
          setPrompts((prev) => ({ ...prev, [key]: payload })),
        );
      }

      // Bookings module (booking_converter)
      binder.listen<Booking[] | null>("Bookings", "bookings", (val) =>
        setBookings(val ?? undefined),
      );
      binder.listen<Booking | null>("Bookings", "current_booking", (val) =>
        setCurrentMeeting(val ?? undefined),
      );
      binder.listen<Booking | null>("Bookings", "next_booking", (val) =>
        setNextMeeting(val ?? undefined),
      );

      // PlaceOS websocket connection state. connectionState() is declared as
      // Observable<[number, number]> in ts-client but actually emits the
      // boolean connection status subject (matches the old integration).
      binder.track(
        connectionState().subscribe((value) => {
          const connected = value as unknown as boolean;
          setWsConnection(connected);
          if (connected) {
            hasConnectedRef.current = true;
            setConnection("online");
          } else if (hasConnectedRef.current) {
            // Real loss — we had a connection and dropped it.
            setConnection("offline");
          }
          // false while never-connected: stay "connecting"; the grace timer
          // below declares "offline" if the socket never opens.
        }),
      );
    },
    [mod],
  );

  // Grace window: armed while "connecting" (i.e. from mount), cleared when the
  // state leaves "connecting" (first connect) or on unmount. The state never
  // re-enters "connecting", so this fires at most once, ~10s from mount.
  useEffect(() => {
    if (connection !== "connecting") return;
    const timer = setTimeout(
      () => setConnection((c) => (c === "connecting" ? "offline" : c)),
      CONNECT_GRACE_MS,
    );
    return () => clearTimeout(timer);
  }, [connection]);

  // Time the room joined the current meeting. Lost on page reload mid-meeting
  // (accepted limitation — the driver does not expose a joined timestamp).
  const wasActive = useRef(false);
  useEffect(() => {
    if (meetingActive && !wasActive.current) setTimeJoined(Date.now());
    if (!meetingActive && wasActive.current) setTimeJoined(0);
    wasActive.current = meetingActive;
  }, [meetingActive]);

  const callStatus = useMemo<CallStatus>(
    () => ({
      status: toCallState(meetingStatus, meetingActive),
      isMicMuted,
      isCamMuted,
    }),
    [meetingStatus, meetingActive, isMicMuted, isCamMuted],
  );

  const activeBooking =
    callStatus.status === "IN_MEETING" && currentMeeting
      ? currentMeeting
      : undefined;

  const execute = useModuleExecute(systemId);

  // Latest-value refs so the mute toggles stay referentially stable instead of
  // being recreated on every mute-state echo.
  const isMicMutedRef = useRef(isMicMuted);
  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const isCamMutedRef = useRef(isCamMuted);
  useEffect(() => {
    isCamMutedRef.current = isCamMuted;
  }, [isCamMuted]);

  const exitMeeting = useCallback(async () => {
    await execute(mod, "exit_meeting");
  }, [execute, mod]);

  const startInstantMeeting = useCallback(async () => {
    await execute(mod, "start_instant_meeting");
  }, [execute, mod]);

  const joinMeeting = useCallback(
    async (meetingNumber: string) => {
      await execute(mod, "join_meeting", [meetingNumber]);
    },
    [execute, mod],
  );

  const toggleMicMute = useCallback(async () => {
    await execute(mod, "mute_audio", [!isMicMutedRef.current]);
  }, [execute, mod]);

  const toggleCameraMute = useCallback(async () => {
    await execute(mod, "mute_video", [!isCamMutedRef.current]);
  }, [execute, mod]);

  const answerPrompt = useCallback(
    async (key: ZoomPromptKey, agree = true) => {
      await execute(mod, "confirm_prompt", [key, agree]);
    },
    [execute, mod],
  );

  const sendMeetingPassword = useCallback(
    async (password: string) => {
      await execute(mod, "send_meeting_password", [password]);
    },
    [execute, mod],
  );

  return useMemo(
    () => ({
      wsConnection,
      connection,
      zoomOnline: online,
      zrcConnectionState,
      paired,
      health,
      callStatus,
      participants,
      bookings,
      currentMeeting,
      nextMeeting,
      activeBooking,
      timeJoined,
      prompts,
      meetingError,
      exitMeeting,
      startInstantMeeting,
      joinMeeting,
      toggleMicMute,
      toggleCameraMute,
      answerPrompt,
      sendMeetingPassword,
    }),
    [
      wsConnection,
      connection,
      online,
      zrcConnectionState,
      paired,
      health,
      callStatus,
      participants,
      bookings,
      currentMeeting,
      nextMeeting,
      activeBooking,
      timeJoined,
      prompts,
      meetingError,
      exitMeeting,
      startInstantMeeting,
      joinMeeting,
      toggleMicMute,
      toggleCameraMute,
      answerPrompt,
      sendMeetingPassword,
    ],
  );
}
