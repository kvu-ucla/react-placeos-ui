// src/components/prompts/ZoomPromptHost.tsx
// Renders the highest-priority active Zoom Room prompt as a modal (nothing when
// no prompt is active) and surfaces the toast-only keys. State lives entirely
// in the driver's status keys — answering a prompt clears its key, which
// unmounts the modal.
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useZoomContext } from "../../hooks/ZoomContext";
import type { ZoomPromptKey } from "../../hooks/useZoomRoom";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import MeetingPasswordModal from "./MeetingPasswordModal";
import { Button } from "../Button";
import {
  MODAL_PROMPT_PRIORITY,
  PROMPT_CONFIG,
  SHAPE_ROUTE_EXCLUDED,
  TOAST_PROMPTS,
  reminderContentKey,
  reminderEntry,
  reminderHasText,
  type PromptAction,
  type PromptConfigEntry,
} from "./promptConfig";

export default function ZoomPromptHost() {
  const { prompts } = useZoomContext();

  const activeKey = MODAL_PROMPT_PRIORITY.find((key) => prompts[key] != null);
  const activePayload = activeKey ? prompts[activeKey] : undefined;
  // Shape-based routing: a payload passing the strict reminder
  // discriminators gets the payload-driven reminder presentation WHATEVER
  // key it arrived on (answerPrompt still targets the actual key) — except
  // keys with specialized actions, which keep their own config regardless.
  const activeReminderShape =
    activeKey && !SHAPE_ROUTE_EXCLUDED.has(activeKey)
      ? reminderContentKey(activePayload)
      : null;
  const reminderActive =
    activeReminderShape !== null ||
    prompts.meeting_reminder != null ||
    prompts.customized_reminder != null;

  // Toast-only keys: fire on null→value transitions; stable toastId per key
  // prevents duplicates across re-renders. The recording_disclaimer_needed
  // flag is informational — while an actionable reminder modal is up it is
  // redundant, so it's suppressed (and dismissed below if already shown).
  const prevToastValues = useRef<Partial<Record<ZoomPromptKey, unknown>>>({});
  useEffect(() => {
    for (const [key, message] of Object.entries(TOAST_PROMPTS)) {
      const promptKey = key as ZoomPromptKey;
      const value = prompts[promptKey];
      const suppressed =
        promptKey === "recording_disclaimer_needed" && reminderActive;
      if (
        value != null &&
        prevToastValues.current[promptKey] == null &&
        !suppressed
      ) {
        toast.info(message, { toastId: promptKey });
      }
      prevToastValues.current[promptKey] = value;
    }
  }, [prompts, reminderActive]);

  useEffect(() => {
    if (reminderActive) toast.dismiss("recording_disclaimer_needed");
  }, [reminderActive]);

  // Dev aid: make future payload-shape drift visible instead of silently
  // rendering generic fallbacks
  useEffect(() => {
    if (!activeKey || !activeReminderShape) return;
    if (!reminderHasText(activePayload, activeReminderShape)) {
      console.warn(
        `Zoom reminder payload on "${activeKey}" carried no title or message; showing generic fallbacks`,
      );
    }
  }, [activeKey, activeReminderShape, activePayload]);

  if (!activeKey) return null;
  if (activeKey === "meeting_password_required") return <MeetingPasswordModal />;

  const config = activeReminderShape
    ? reminderEntry(activeKey, activeReminderShape)
    : PROMPT_CONFIG[activeKey];
  if (!config) return null;

  return <PromptModal promptKey={activeKey} config={config} />;
}

function PromptModal({
  promptKey,
  config,
}: {
  promptKey: ZoomPromptKey;
  config: PromptConfigEntry;
}) {
  const { prompts, answerPrompt, execute, zoomMod } = useZoomContext();
  const payload = prompts[promptKey];

  const [busy, setBusy] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);

  // New prompt (or updated payload) → re-enable actions
  useEffect(() => {
    setBusy(false);
  }, [promptKey, payload]);

  // Focus the primary action when the prompt opens/changes
  useEffect(() => {
    primaryRef.current?.focus();
  }, [promptKey]);

  const runAction = async (action: PromptAction) => {
    if (busy) return;
    setBusy(true);
    try {
      await action.run({ payload, zoomMod, answerPrompt, execute });
      // Success: the driver clears the status key, unmounting this modal.
    } catch {
      // useModuleExecute already surfaced a toast
      setBusy(false);
    }
  };

  // Payload-driven title/actions when the config provides them (reminders
  // carry Zoom-supplied button text); static config otherwise.
  const title = config.getTitle?.(payload) ?? config.title;
  const actions = config.getActions?.(payload) ?? config.actions;

  // Esc = the negative/dismiss action, only when dismissable
  const dismissAction =
    actions.filter((action) => !action.primary).at(-1) ??
    actions[actions.length - 1];
  useEscapeKey(() => {
    if (config.dismissable && !busy) runAction(dismissAction);
  });

  return (
    <div className="modal modal-open modal-fade bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="zoom-prompt-title"
        className="modal-box modal-pop max-h-[90vh] overflow-y-auto max-w-none w-[min(90vw,48rem)] rounded-lg bg-white p-8"
      >
        <h3 id="zoom-prompt-title" className="font-bold text-3xl mb-4">
          {title}
        </h3>
        {config.showSpinner && (
          <span
            className="loading loading-spinner loading-lg text-avit-blue"
            aria-hidden="true"
          />
        )}
        <p className="py-4 text-xl">{config.getBody(payload)}</p>
        <div className="flex items-center justify-center w-full gap-4">
          {actions.map((action, index) => (
            <Button
              key={`${index}-${action.label}`}
              ref={action.primary ? primaryRef : undefined}
              variant={action.primary ? "primary" : "outline"}
              disabled={busy}
              onClick={() => runAction(action)}
              className="text-3xl min-w-64 min-h-24 p-4"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
      {config.dismissable ? (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!busy) runAction(dismissAction);
          }}
        />
      ) : (
        <div className="modal-backdrop" />
      )}
    </div>
  );
}
