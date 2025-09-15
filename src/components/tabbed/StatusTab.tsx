import {useZoomContext} from "../../hooks/ZoomContext";


export function StatusTab() {
    const {
        currentMeeting,
        muteEveryone,
        toggleAudioMuteEveryone,
        participants
    } = useZoomContext();
    
    
    return (
        <div className="border rounded-lg p-6 space-y-6">
            {/* Zoom Meeting Status Header */}
            <div>
                <h2 className="text-xl font-semibold mb-1">
                    Zoom Meeting Status
                </h2>
            </div>
            {/* Room Info */}
            <div className="border rounded-md p-4 bg-white">
                <div className="font-semibold text-black">
                    {currentMeeting?.meetingName}
                </div>
                <div className="text-gray-600">
                    Meeting Number: {currentMeeting?.meetingNumber ?? "No Meeting"} &nbsp; • {participants.length ?? "No "} Participant(s)
                    &nbsp;
                </div>
            </div>
            {/* Tabs and Global Tools */}
            {/* Global actions */}
            <div className="flex gap-4">
                {muteEveryone ? (
                    <button
                        onClick={toggleAudioMuteEveryone}
                        className="bg-black text-white px-4 py-2 rounded text-2xl font-semibold"
                    >
                        Unmute all participants
                    </button>
                ) : (
                    <button
                        onClick={toggleAudioMuteEveryone}
                        className="bg-gray-300 px-4 py-2 rounded text-2xl font-semibold"
                    >
                        Mute all participants
                    </button>
                )}
                {/*<button className="bg-gray-300 px-4 py-2 rounded text-sm font-semibold">*/}
                {/*  Disable video for all*/}
                {/*</button>*/}
            </div>
            {/* Participants list */}
            {/*<div>*/}
            {/*  {participants?.map(participant => (*/}
            {/*      <div key={participant.user_name}>*/}
            {/*        <div key={participant.is_host}>*/}
            {/*          <div key={participant.}>*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </div>*/}
            {/*      */}
            {/*  )) ?? <div>No participants</div>}*/}
            {/*</div>*/}
        </div>
    );
}