// src/components/SurveyModal.tsx
import {Icon} from "@iconify/react";
import { useControlContext } from "../hooks/ControlStateContext.tsx";


export default function SupportModal({ onClose }: { onClose: () => void }) {
  const { system } = useControlContext();

  const room = system?.name?.replace(/\s/g, '') ?? '';

  const surveyURL = `https://uclaapoanonsurvey.qualtrics.com/jfe/form/SV_9H4E6e9mv9VJnTg?room_location=${room}`;
  
  return (
    <div className="modal modal-open bg-black/40">
      <div className="modal-box bg-white p-8 rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-avit-grey pb-8">
          <button onClick={onClose} className="btn-ghost text-2xl font-bold ">
            <Icon
                icon="material-symbols:close-small-outline-rounded"
                width={48}
                height={48}
            ></Icon>
          </button>
        </div>
        <iframe src={surveyURL} height="800px" width="600px"></iframe>
      </div>

      {/* Optional: backdrop click closes modal */}
      <div className="modal-backdrop" onClick={() => onClose()} />
    </div>
  );
}
