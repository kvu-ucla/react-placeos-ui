// src/components/SurveyModal.tsx
import {Icon} from "@iconify/react";
import { useControlContext } from "../hooks/ControlStateContext.tsx";
import { useEffect, useState } from "react";


export default function SupportModal({ onClose }: { onClose: () => void }) {
  const { system } = useControlContext();
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  const room = system?.name?.replace(/\s/g, '') ?? '';

  //refresh when opening modal
  useEffect(() => {
    setRefreshKey(Date.now());
  }, []);

  const surveyURL = `https://uclaapoanonsurvey.qualtrics.com/jfe/form/SV_9H4E6e9mv9VJnTg?room_location=${room}&t=${refreshKey}`;
  
  return (
    <div className="modal modal-open bg-black/40">
      <div className="bg-white p-8 rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-avit-grey pb-8">
          <h2 className="text-4xl font-semibold">Survey</h2>
          <button onClick={onClose} className="btn-ghost text-2xl font-bold ">
            <Icon
                icon="material-symbols:close-small-outline-rounded"
                width={48}
                height={48}
            ></Icon>
          </button>
        </div>
        <iframe src={surveyURL} height="650px" width="650px"></iframe>
      </div>

      {/* Optional: backdrop click closes modal */}
      <div className="modal-backdrop" onClick={() => onClose()} />
    </div>
  );
}
