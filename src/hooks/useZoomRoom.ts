// src/hooks/useZoomRoom.ts
// Zoom Room state + actions backed by the ZoomZRC driver and the Bookings
// (booking_converter) module.
import { useEffect, useMemo, useRef, useState } from "react";
import { connectionState } from "@placeos/ts-client";
import { useBinder, useModuleExecute } from "./placeos";

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

// The ZoomZRC driver stores the raw GET /participants response, so keep this
// tolerant: only an id is assumed; names overlapping the old CSAPI shape are
// kept for the UI. The wrapper has been seen using `name` for display names.
export interface ZrcParticipant {
  user_id: number | string;
  name?: string;
  user_name?: string;
  audio_state?: string;
  video_is_sending?: boolean;
  is_host?: boolean;
  isCohost?: boolean;
  is_in_waiting_room?: boolean;
  hand_status?: {
    is_raise_hand?: boolean;
    is_valid?: string;
    time_stamp?: string;
  };
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
  const [participants, setParticipants] = useState<ZrcParticipant[]>([]);
  const [online, setOnline] = useState<boolean>(false);
  const [zrcConnectionState, setZrcConnectionState] = useState<string | null>();
  const [paired, setPaired] = useState<boolean>();
  const [health, setHealth] = useState<unknown>();
  const [wsConnection, setWsConnection] = useState<boolean>();
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
      binder.listen<ZrcParticipant[] | null>(mod, "participants", (val) =>
        setParticipants(Array.isArray(val) ? val : []),
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
        connectionState().subscribe((value) =>
          setWsConnection(value as unknown as boolean),
        ),
      );
    },
    [mod],
  );

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

  const exitMeeting = async () => {
    await execute(mod, "exit_meeting");
  };

  const startInstantMeeting = async () => {
    await execute(mod, "start_instant_meeting");
  };

  const joinMeeting = async (meetingNumber: string) => {
    await execute(mod, "join_meeting", [meetingNumber]);
  };

  const toggleMicMute = async () => {
    await execute(mod, "mute_audio", [!isMicMuted]);
  };

  const toggleCameraMute = async () => {
    await execute(mod, "mute_video", [!isCamMuted]);
  };

  const answerPrompt = async (key: ZoomPromptKey, agree = true) => {
    await execute(mod, "confirm_prompt", [key, agree]);
  };

  const sendMeetingPassword = async (password: string) => {
    await execute(mod, "send_meeting_password", [password]);
  };

  return {
    wsConnection,
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
  };
}
