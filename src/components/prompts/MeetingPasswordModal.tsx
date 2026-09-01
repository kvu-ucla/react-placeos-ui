// src/components/prompts/MeetingPasswordModal.tsx
// Shown while the driver reports meeting_password_required. Join is blocked on
// it, so this modal is not dismissable via Esc/backdrop — Cancel exits the join.
import { useEffect, useState } from "react";
import { useZoomContext } from "../../hooks/ZoomContext";

const dig = (payload: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (acc, key) =>
      acc && typeof acc === "object"
        ? (acc as Record<string, unknown>)[key]
        : undefined,
    payload,
  );

export default function MeetingPasswordModal() {
  const { prompts, sendMeetingPassword, exitMeeting, meetingError } =
    useZoomContext();

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [typedSinceError, setTypedSinceError] = useState(false);

  const payload = prompts.meeting_password_required;
  const wrongAndRetry = dig(payload, ["wrongAndRetry"]) === true;

  // Surface a fresh error until the user starts correcting the password
  useEffect(() => {
    setTypedSinceError(false);
  }, [meetingError, payload]);

  const errorText =
    !typedSinceError && (wrongAndRetry || meetingError != null)
      ? wrongAndRetry
        ? "That password was incorrect — try again."
        : "The meeting could not be joined. Check the password and try again."
      : null;

  const submit = async () => {
    const value = password.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    try {
      await sendMeetingPassword(value);
      // On success the driver clears meeting_password_required and this
      // modal unmounts; on a wrong password a new prompt payload arrives.
    } catch {
      // useModuleExecute already surfaced a toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-password-title"
        className="modal-box max-h-none overflow-visible max-w-none w-[min(90vw,48rem)] rounded-lg bg-white p-8"
      >
        <h3 id="meeting-password-title" className="font-bold text-3xl mb-4">
          Meeting password required
        </h3>
        <p className="py-4 text-xl">
          Enter the password for this meeting to continue joining.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setTypedSinceError(true);
            }}
            placeholder="Meeting password"
            aria-label="Meeting password"
            className="input input-bordered w-full h-16 text-2xl mb-2"
          />
          {errorText && (
            <p className="text-error text-xl mb-2" role="alert">
              {errorText}
            </p>
          )}
          <div className="flex items-center justify-center w-full gap-4 mt-4">
            <button
              type="button"
              className="btn text-3xl min-w-64 min-h-24 rounded-lg btn-outline p-4"
              onClick={() => exitMeeting()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !password.trim()}
              className="btn text-3xl min-w-64 min-h-24 text-white rounded-lg bg-avit-blue p-4"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
      {/* No backdrop click handler — join is blocked until answered or cancelled */}
      <div className="modal-backdrop" />
    </div>
  );
}
