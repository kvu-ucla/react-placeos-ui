// src/components/ShutdownModal.tsx

import {useControlContext} from "../hooks/ControlStateContext.tsx";

export default function ShutdownModal({onClose}: { onClose: () => void }) {
    const {togglePower} = useControlContext();
    return (
        <div className="modal modal-open bg-black/40">
            <div className="modal-box rounded-lg bg-white p-8">
                <h3 className="font-bold text-3xl mb-4">Are you sure you want to shut the system down?</h3>
                {/*<p className="py-4">Are you sure you want to shut the system down?</p>*/}
                <div className="flex flex-col">
                    <button className="btn text-3xl min-w-64 min-h-24 bg-avit-blue mb-4 p-4" onClick={togglePower}>Yes,
                        I'm sure
                    </button>
                    <button className="btn text-3xl min-w-64 min-h-24 btn-outline p-4" onClick={() => onClose()}>No, go
                        back
                    </button>
                </div>
            </div>
            {/* Optional: backdrop click closes modal */}
            <div className="modal-backdrop" onClick={() => onClose()}/>
        </div>
    );
}
