// src/components/prompts/promptConfig.ts
// Declarative config for Zoom Room prompt handling. Each ZoomZRC prompt status
// key holds the FULL event payload; the driver clears the key to null when the
// prompt is answered, so the UI renders purely from the key's value.
import type { ZoomPromptKey } from "../../hooks/useZoomRoom";

export interface PromptActionContext {
  payload: unknown;
  zoomMod: string;
  answerPrompt: (key: ZoomPromptKey, agree?: boolean) => Promise<void>;
  execute: <T = unknown>(
    moduleAlias: string,
    method: string,
    args?: unknown[],
  ) => Promise<T>;
}

export interface PromptAction {
  label: string;
  /** Focused on open and styled as the main action */
  primary?: boolean;
  run: (ctx: PromptActionContext) => Promise<void>;
}

export interface PromptConfigEntry {
  title: string;
  /** Payload-driven title override; falls back to `title` when it returns nothing */
  getTitle?: (payload: unknown) => string | undefined;
  getBody: (payload: unknown) => string;
  actions: PromptAction[];
  /** Payload-driven actions (e.g. Zoom-supplied button text); `actions` is the fallback */
  getActions?: (payload: unknown) => PromptAction[];
  /** When true, Esc/backdrop runs the dismiss (last non-primary) action */
  dismissable: boolean;
  /** Show an indeterminate spinner above the body (waiting_for_host) */
  showSpinner?: boolean;
}

/** Modal prompt keys, highest priority first. */
export const MODAL_PROMPT_PRIORITY: ZoomPromptKey[] = [
  "meeting_password_required",
  "waiting_for_host",
  "consent_prompt",
  "combined_consent_prompt",
  "consolidated_customized_consent_prompt",
  "recording_request",
  "ask_unmute_audio",
  "ask_start_video",
  "meeting_reminder",
  "customized_reminder",
  "privacy_alert",
  "inactive_detection",
  "ai_companion_request",
];

/** Non-modal keys surfaced as informational toasts on null→value transitions. */
export const TOAST_PROMPTS: Partial<Record<ZoomPromptKey, string>> = {
  incoming_share: "A participant is sharing content to this room.",
  recording_disclaimer_needed:
    "Recording needs a disclaimer acknowledgement on the Zoom Room.",
};

// --- defensive payload readers (payloads are unknown; never render raw JSON) ---

const dig = (payload: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (acc, key) =>
      acc && typeof acc === "object"
        ? (acc as Record<string, unknown>)[key]
        : undefined,
    payload,
  );

const firstString = (
  payload: unknown,
  paths: string[][],
): string | undefined => {
  for (const path of paths) {
    const value = dig(payload, path);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const firstScalar = (
  payload: unknown,
  paths: string[][],
): string | number | undefined => {
  for (const path of paths) {
    const value = dig(payload, path);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return value;
  }
  return undefined;
};

const GENERIC_TEXT_PATHS: string[][] = [
  ["message"],
  ["content"],
  ["description"],
  ["title"],
  ["info", "message"],
  ["info", "content"],
  ["info", "description"],
];

const bodyFrom =
  (fallback: string, extraPaths: string[][] = []) =>
  (payload: unknown): string =>
    firstString(payload, [...extraPaths, ...GENERIC_TEXT_PATHS]) ?? fallback;

// --- privacy alert close-action mapping (see zoom_zrc.cr handle_privacy_alert:
// SHOW/SHOW_DISCLAIMER are display transitions; only close actions dismiss.
// Numeric SDK enum: 0 NONE, 1 SHOW, 2 CLOSE, 3 SHOW_DISCLAIMER, 4 CLOSE_DISCLAIMER) ---

const privacyCloseAction = (action: string | number): string | number => {
  if (typeof action === "number") return action === 3 ? 4 : 2;
  return action.includes("DISCLAIMER")
    ? "PRIVACY_ALERT_ACTION_CLOSE_DISCLAIMER"
    : "PRIVACY_ALERT_ACTION_CLOSE";
};

// Zoom-supplied button text can be arbitrarily long; cap it so a verbose
// label can't break the two-button row. firstString already trims.
const MAX_ACTION_LABEL = 24;
const actionLabel = (
  payload: unknown,
  paths: string[][],
  fallback: string,
): string => {
  const raw = firstString(payload, paths);
  if (!raw) return fallback;
  return raw.length > MAX_ACTION_LABEL
    ? raw.slice(0, MAX_ACTION_LABEL - 1).trimEnd() + "…"
    : raw;
};

// Reminder shape detection: any payload carrying a reminderContent or
// customizedContent object is an OnMeetingReminderNotification /
// OnCustomizedReminderNotification-shaped event, regardless of which status
// key the driver surfaced it on. ZoomPromptHost routes such payloads through
// reminderEntry so Zoom-supplied text always wins over a key's generic entry.
export type ReminderContentKey = "reminderContent" | "customizedContent";

export const reminderContentKey = (
  payload: unknown,
): ReminderContentKey | null => {
  if (payload && typeof payload === "object") {
    for (const key of ["reminderContent", "customizedContent"] as const) {
      const value = (payload as Record<string, unknown>)[key];
      if (value && typeof value === "object") return key;
    }
  }
  return null;
};

/** Whether a reminder-shaped payload carries any usable title or message */
export const reminderHasText = (
  payload: unknown,
  contentKey: ReminderContentKey,
): boolean =>
  firstString(payload, [
    [contentKey, "title"],
    ["title"],
    [contentKey, "message"],
    ["message"],
  ]) !== undefined;

// Live meeting_reminder payload (smoke-tested on a real room, 2026-09-02):
// { event: "OnMeetingReminderNotification", reminderContent: { title,
//   message, positiveActionText, negativeActionText, linkText, linkUrl,
//   privacyMessage, ... }, isShowing, reminderType }, and the driver clears
// the key to null after answering (observed). customized_reminder's
// customizedContent is assumed to mirror this shape, so both build from the
// same factory — every read stays defensive for older/divergent payloads,
// including SDK variants that flatten title/message to the top level.
export const reminderEntry = (
  key: ZoomPromptKey,
  contentKey: string,
): PromptConfigEntry => ({
  title: "Meeting reminder",
  getTitle: (payload) =>
    firstString(payload, [[contentKey, "title"], ["title"]]),
  getBody: (payload) => {
    const body =
      firstString(payload, [
        [contentKey, "message"],
        [contentKey, "content"],
        [contentKey, "description"],
        [contentKey, "title"],
        ...GENERIC_TEXT_PATHS,
      ]) ?? "This meeting has a reminder that needs a response.";
    // Link rendered as plain appended text, never a hyperlink — a kiosk
    // shouldn't open external URLs; showing the URL lets people follow it
    // on their own device.
    const linkText = firstString(payload, [[contentKey, "linkText"]]);
    const linkUrl = firstString(payload, [[contentKey, "linkUrl"]]);
    return linkText && linkUrl ? `${body} (${linkText}: ${linkUrl})` : body;
  },
  dismissable: true,
  actions: agreeDismiss(key),
  getActions: (payload) => [
    {
      label: actionLabel(
        payload,
        [[contentKey, "positiveActionText"]],
        "Agree",
      ),
      primary: true,
      run: ({ answerPrompt }) => answerPrompt(key, true),
    },
    {
      label: actionLabel(
        payload,
        [[contentKey, "negativeActionText"]],
        "Dismiss",
      ),
      run: ({ answerPrompt }) => answerPrompt(key, false),
    },
  ],
});

const agreeDismiss = (key: ZoomPromptKey): PromptAction[] => [
  {
    label: "Agree",
    primary: true,
    run: ({ answerPrompt }) => answerPrompt(key, true),
  },
  {
    label: "Dismiss",
    run: ({ answerPrompt }) => answerPrompt(key, false),
  },
];

export const PROMPT_CONFIG: Partial<Record<ZoomPromptKey, PromptConfigEntry>> =
  {
    waiting_for_host: {
      title: "Waiting for host",
      getBody: () => "Waiting for the host to start this meeting",
      dismissable: false,
      showSpinner: true,
      actions: [
        {
          label: "Stop waiting",
          primary: true,
          run: ({ answerPrompt }) => answerPrompt("waiting_for_host", false),
        },
      ],
    },
    consent_prompt: {
      title: "Meeting consent required",
      getBody: bodyFrom(
        "This meeting requires your consent to continue (for example to being recorded).",
        [["info", "description"], ["info", "title"]],
      ),
      dismissable: true,
      actions: agreeDismiss("consent_prompt"),
    },
    combined_consent_prompt: {
      title: "Meeting consent required",
      getBody: bodyFrom(
        "This meeting requires your consent to continue.",
        [["combinedConsent", "description"], ["combinedConsent", "title"]],
      ),
      dismissable: true,
      actions: agreeDismiss("combined_consent_prompt"),
    },
    consolidated_customized_consent_prompt: {
      title: "Meeting consent required",
      getBody: bodyFrom(
        "This meeting has consent disclaimers that must be acknowledged to continue.",
      ),
      dismissable: true,
      actions: agreeDismiss("consolidated_customized_consent_prompt"),
    },
    recording_request: {
      title: "Recording request",
      getBody: bodyFrom(
        "A participant has asked to record this meeting.",
      ),
      dismissable: true,
      actions: [
        {
          label: "OK, continue",
          primary: true,
          run: ({ answerPrompt }) => answerPrompt("recording_request", true),
        },
        {
          label: "Decline",
          run: ({ answerPrompt }) => answerPrompt("recording_request", false),
        },
      ],
    },
    ask_unmute_audio: {
      title: "Unmute request",
      getBody: bodyFrom("The host has asked this room to unmute."),
      dismissable: true,
      actions: [
        {
          label: "Unmute",
          primary: true,
          run: ({ answerPrompt }) => answerPrompt("ask_unmute_audio", true),
        },
        {
          label: "Stay muted",
          run: ({ answerPrompt }) => answerPrompt("ask_unmute_audio", false),
        },
      ],
    },
    ask_start_video: {
      title: "Video request",
      getBody: bodyFrom("The host has asked this room to start its video."),
      dismissable: true,
      actions: [
        {
          label: "Start video",
          primary: true,
          run: ({ answerPrompt }) => answerPrompt("ask_start_video", true),
        },
        {
          label: "Keep video off",
          run: ({ answerPrompt }) => answerPrompt("ask_start_video", false),
        },
      ],
    },
    meeting_reminder: reminderEntry("meeting_reminder", "reminderContent"),
    customized_reminder: reminderEntry(
      "customized_reminder",
      "customizedContent",
    ),
    privacy_alert: {
      title: "Privacy notice",
      getBody: bodyFrom(
        "A meeting feature with privacy implications (such as live captioning) is active.",
      ),
      dismissable: true,
      actions: [
        {
          label: "OK",
          primary: true,
          run: async ({ payload, answerPrompt, execute, zoomMod }) => {
            // Field names per zoom_zrc_models.cr / OnPrivacyAlertNotification
            const action = firstScalar(payload, [
              ["action"],
              ["privacyAlertAction"],
              ["info", "action"],
              ["info", "privacyAlertAction"],
            ]);
            const type = firstScalar(payload, [
              ["type"],
              ["privacyAlertType"],
              ["info", "type"],
              ["info", "privacyAlertType"],
            ]);
            if (action !== undefined && type !== undefined) {
              await execute(zoomMod, "handle_privacy_alert", [
                privacyCloseAction(action),
                type,
              ]);
            } else {
              await answerPrompt("privacy_alert", true);
            }
          },
        },
      ],
    },
    inactive_detection: {
      title: "Are you still there?",
      getBody: bodyFrom(
        "The room has been inactive. Confirm you are still here to keep the meeting running.",
      ),
      dismissable: false,
      actions: [
        {
          label: "Yes, I'm still here",
          primary: true,
          run: ({ answerPrompt }) => answerPrompt("inactive_detection", true),
        },
      ],
    },
    ai_companion_request: {
      title: "AI Companion request",
      getBody: bodyFrom(
        "A participant has asked to change AI Companion for this meeting.",
      ),
      dismissable: true,
      actions: agreeDismiss("ai_companion_request"),
    },
  };
