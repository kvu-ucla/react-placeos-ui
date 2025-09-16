import { useZoomContext } from "../../hooks/ZoomContext";
import {useEffect} from "react";

export function StatusTab() {
    const {
        currentMeeting,
        muteEveryone,
        toggleAudioMuteEveryone,
        participants,
        participantMediaMute
    } = useZoomContext();

    const isAudioMuted = (audioState: any) => {
        return audioState === 'AUDIO_MUTED';
    };

    useEffect(() => {
        console.log("=== REACT PARTICIPANTS STATE ===");
        participants?.forEach(p => {
            console.log(`${p.user_name}: video_is_sending=${p.video_is_sending}`);
        });
    }, [participants]);

    // Separate participants by status
    const activeParticipants = participants?.filter(p => !p.is_in_waiting_room) || [];
    const waitingParticipants = participants?.filter(p => p.is_in_waiting_room) || [];

    const ParticipantRow = ({ participant }: { participant: any }) => (
        <div className="flex items-center justify-between py-4 px-0">
            {/* User info section */}
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {participant.user_name.charAt(0).toUpperCase()}
                    </div>
                    {/* Raised hand indicator */}
                    {participant.hand_status?.is_raise_hand && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-xs">✋</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-medium text-base">{participant.user_name}</span>
                    {participant.is_host && (
                        <span className="text-xs text-gray-500">(Host)</span>
                    )}
                    {participant.isCohost && (
                        <span className="text-xs text-gray-500">(Co-host)</span>
                    )}
                </div>
            </div>

            {/* Audio/Video controls */}
            <div className="flex items-center space-x-3">
                {/* Audio Control */}
                <button
                    onClick={() => participantMediaMute('audio', participant.user_id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isAudioMuted(participant.audio_state)
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                >
                    {isAudioMuted(participant.audio_state) ? 'Unmute' : 'Mute'}
                </button>

                {/* Video Control */}
                <button
                    onClick={() => participantMediaMute('video', participant.user_id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        !participant.video_is_sending
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                >
                    {!participant.video_is_sending ? 'Enable video' : 'Disable video'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="border rounded-lg p-6 space-y-6">
            {/* Zoom Meeting Status Header */}
            <div>
                <h2 className="text-xl font-semibold mb-1">Zoom Meeting Status</h2>
            </div>
            {/* Room Info */}
            <div className="border rounded-md p-4 bg-white">
                <div className="font-semibold text-black">
                    {currentMeeting?.meetingName}
                </div>
                <div className="text-gray-600">
                    Meeting Number: {currentMeeting?.meetingNumber ?? "No Meeting"}
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
            </div>

            {/* Participants List */}
            <div className="max-w-4xl mx-auto bg-white">
                {/* Active Participants */}
                {activeParticipants.length > 0 && (
                    <div className="relative">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Participants ({activeParticipants.length})
                        </h3>
                        {activeParticipants.map((participant, index) => (
                            <div key={participant.user_id} className="relative">
                                <ParticipantRow
                                    participant={participant}
                                />
                                {index < activeParticipants.length - 1 && (
                                    <div className="h-px bg-gray-200"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Waiting Room */}
                {waitingParticipants.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Waiting Room ({waitingParticipants.length})
                        </h3>
                        <div className="relative">
                            {waitingParticipants.map((participant, index) => (
                                <div key={participant.user_id} className="relative">
                                    <div className="flex items-center justify-between py-4 px-0">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                                {participant.user_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-gray-700 font-medium text-base">{participant.user_name}</span>
                                        </div>
                                        <div className="flex space-x-3">
                                            <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
                                                Admit
                                            </button>
                                            <button className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors">
                                                Deny
                                            </button>
                                        </div>
                                    </div>
                                    {index < waitingParticipants.length - 1 && (
                                        <div className="h-px bg-gray-200"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Participants */}
                {activeParticipants.length === 0 && waitingParticipants.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <p>No participants in this meeting</p>
                    </div>
                )}
            </div>
        </div>
    );
}