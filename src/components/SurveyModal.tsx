// src/components/SurveyModal.tsx
import {Icon} from "@iconify/react";


export default function SupportModal({ onClose }: { onClose: () => void }) {

  return (
    <div className="modal modal-open bg-black/40">
      <div className="modal-box bg-white p-8 rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-avit-grey pb-8">
          <h2 className="text-4xl font-semibold">Share Your Experience</h2>
          <button onClick={onClose} className="btn-ghost text-2xl font-bold ">
            <Icon
                icon="material-symbols:close-small-outline-rounded"
                width={48}
                height={48}
            ></Icon>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center justify-center mt-4">
          <div className="mb-4">
            Scan the QR code with your phone's camera to take a quick survey.
          </div>
          {/* Main content */}
          <div className="">
            <img
                src={import.meta.env.BASE_URL + "dts_survey.svg"}
                alt="DTS Survey QR Code"
                className=""
            />
          </div>
        </div>
        
      </div>

      {/* Optional: backdrop click closes modal */}
      <div className="modal-backdrop" onClick={() => onClose()} />
    </div>
  );
}
