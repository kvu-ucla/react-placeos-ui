// src/components/ShutdownModal.tsx

import { useControlContext } from "../hooks/ControlStateContext";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { Button } from "./Button";

export default function ShutdownModal({ onClose }: { onClose: () => void }) {
  const { togglePower } = useControlContext();
  useEscapeKey(onClose);

  const systemOff = () => {
    togglePower();
    onClose();
  };

  return (
    <div className="modal modal-open modal-fade bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shut down system"
        className="modal-box modal-pop rounded-lg bg-white p-8"
      >
        <h3 className="font-bold text-3xl mb-4">
          Are you sure you want to shut the system down?
        </h3>
        <div className="flex flex-col">
          {/* rounded-lg via Button normalizes a radius drift vs the other
              confirm modals' buttons (they all carry rounded-lg) */}
          <Button
            variant="primary"
            className="text-3xl min-w-64 min-h-24 mb-4 p-4"
            onClick={systemOff}
          >
            Yes, I'm sure
          </Button>
          <Button
            variant="outline"
            className="text-3xl min-w-64 min-h-24 p-4"
            onClick={() => onClose()}
          >
            No, go back
          </Button>
        </div>
      </div>
      {/* Optional: backdrop click closes modal */}
      <div className="modal-backdrop" onClick={() => onClose()} />
    </div>
  );
}
