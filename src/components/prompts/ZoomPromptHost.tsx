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
import {
  MODAL_PROMPT_PRIORITY,
  PROMPT_CONFIG,
  TOAST_PROMPTS,
  type PromptAction,
  type PromptConfigEntry,
} from "./promptConfig";

export default function ZoomPromptHost() {
  const { prompts } = useZoomContext();

  // Toast-only keys: fire on null→value transitions; stable toastId per key
  // prevents duplicates across re-renders.
  const prevToastValues = useRef<Partial<Record<ZoomPromptKey, unknown>>>({});
  useEffect(() => {
    for (const [key, message] of Object.entries(TOAST_PROMPTS)) {
      const promptKey = key as ZoomPromptKey;
      const value = prompts[promptKey];
      if (value != null && prevToastValues.current[promptKey] == null) {
        toast.info(message, { toastId: promptKey });
      }
      prevToastValues.current[promptKey] = value;
    }
  }, [prompts]);

  const activeKey = MODAL_PROMPT_PRIORITY.find((key) => prompts[key] != null);

  if (!activeKey) return null;
  if (activeKey === "meeting_password_required") return <MeetingPasswordModal />;

  const config = PROMPT_CONFIG[activeKey];
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

  // Esc = the negative/dismiss action, only when dismissable
  const dismissAction =
    config.actions.filter((action) => !action.primary).at(-1) ??
    config.actions[config.actions.length - 1];
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
          {config.title}
        </h3>
        {config.showSpinner && (
          <span
            className="loading loading-spinner loading-lg text-avit-blue"
            aria-hidden="true"
          />
        )}
        <p className="py-4 text-xl">{config.getBody(payload)}</p>
        <div className="flex items-center justify-center w-full gap-4">
          {config.actions.map((action) => (
            <button
              key={action.label}
              ref={action.primary ? primaryRef : undefined}
              disabled={busy}
              onClick={() => runAction(action)}
              className={
                action.primary
                  ? "btn text-3xl min-w-64 min-h-24 text-white rounded-lg bg-avit-blue active:bg-[#011c50] p-4"
                  : "btn text-3xl min-w-64 min-h-24 rounded-lg btn-outline active:bg-gray-100 p-4"
              }
            >
              {action.label}
            </button>
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
