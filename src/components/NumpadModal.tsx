import { useState } from "react";
import { Icon } from "@iconify/react";

interface NumpadModalProps {
  title?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

const DIGIT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function NumpadModal({
  title = "Enter Code",
  onClose,
  onConfirm,
}: NumpadModalProps) {
  const [input, setInput] = useState("");

  const handleDigit = (d: string) => setInput((prev) => prev + d);
  const handleBackspace = () => setInput((prev) => prev.slice(0, -1));
  const handleConfirm = () => {
    if (!input) return;
    onConfirm(input);
  };

  return (
    <div className="modal modal-open bg-black/40">
      <div className="modal-box max-h-none overflow-visible max-w-none w-[min(90vw,26rem)] rounded-lg bg-white p-8">
        <h3 className="font-bold text-3xl mb-6">{title}</h3>

        <div className="mb-4 px-4 py-3 bg-gray-100 rounded-lg text-3xl font-mono tracking-widest text-center min-h-[3.5rem]">
          {input || <span className="text-gray-400">—</span>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {DIGIT_KEYS.map((k) => (
            <button
              key={k}
              className="btn text-3xl font-semibold min-h-16 rounded-lg bg-gray-100 hover:bg-gray-200 border-0"
              onClick={() => handleDigit(k)}
            >
              {k}
            </button>
          ))}

          <button
            className="btn min-h-16 rounded-lg bg-gray-100 hover:bg-gray-200 border-0"
            onClick={handleBackspace}
            disabled={!input}
          >
            <Icon
              icon="material-symbols:backspace-outline-rounded"
              width={32}
              height={32}
            />
          </button>

          <button
            className="btn text-3xl font-semibold min-h-16 rounded-lg bg-gray-100 hover:bg-gray-200 border-0"
            onClick={() => handleDigit("0")}
          >
            0
          </button>

          <button
            className="btn min-h-16 rounded-lg bg-avit-blue text-white border-0"
            disabled={!input}
            onClick={handleConfirm}
          >
            <Icon
              icon="material-symbols:check-rounded"
              width={32}
              height={32}
            />
          </button>
        </div>

        <button
          className="btn w-full text-2xl min-h-14 rounded-lg btn-outline"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
