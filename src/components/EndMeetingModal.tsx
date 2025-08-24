// src/components/EndMeetingModal.tsx
import {useZoomContext} from "../hooks/ZoomContext";

export default function EndMeetingModal({onClose}: { onClose: () => void }) {
    const { leave } = useZoomContext();
    
    const endMeeting = () => {
        leave();
        onClose();
    }
    return (
        <div className="modal modal-open bg-black/40">
            <div className="modal-box max-h-none overflow-visible max-w-none w-[min(90vw,48rem)] rounded-lg bg-white p-8">
                <h3 className="font-bold text-3xl mb-4">End class session?</h3>
                <p className="py-4">
                    This will end any in-progress Zoom meetings, BruinCast recordings and power off all audio and video systems.</p>
                    <div className="flex items-center justify-center w-full gap-4">
                        <button className="btn text-3xl min-w-64 min-h-24 rounded-lg btn-outline px-3 py-6" onClick={() => onClose()}>
                            Go back
                        </button>
                        <button className="btn text-3xl min-w-64 min-h-24 rounded-lg bg-avit-blue px-3 py-6" onClick={endMeeting}>
                            End class
                        </button>
                </div>

            </div>
            {/* Optional: backdrop click closes modal */}
            <div className="modal-backdrop" onClick={() => onClose()}/>
        </div>
    );
}
