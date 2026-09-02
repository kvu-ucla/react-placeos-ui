// src/components/EndMeetingModal.tsx
import { useZoomContext } from "../hooks/ZoomContext";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { Button } from "./Button";

export default function EndMeetingModal({ onClose }: { onClose: () => void }) {
  const { exitMeeting } = useZoomContext();
  useEscapeKey(onClose);

  const endMeeting = () => {
    exitMeeting();
    onClose();
  };
  return (
    <div className="modal modal-open modal-fade bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="End class session"
        className="modal-box modal-pop max-h-none overflow-visible max-w-none w-[min(90vw,48rem)] rounded-lg bg-white p-8"
      >
        <h3 className="font-bold text-3xl mb-4">End class session?</h3>
        <p className="py-4">
          This will end any in-progress Zoom meetings. Continue?
        </p>
        <div className="flex items-center justify-center w-full gap-4">
          <Button
            variant="outline"
            className="text-3xl min-w-64 min-h-24 p-4"
            onClick={() => onClose()}
          >
            Go back
          </Button>
          <Button
            variant="primary"
            className="text-3xl min-w-64 min-h-24 p-4"
            onClick={endMeeting}
          >
            End class
          </Button>
        </div>
      </div>
      {/* Optional: backdrop click closes modal */}
      <div className="modal-backdrop" onClick={() => onClose()} />
    </div>
  );
}
