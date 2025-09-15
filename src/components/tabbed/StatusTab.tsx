import { useZoomContext } from "../../hooks/ZoomContext";

export function StatusTab() {
  const {
    currentMeeting,
    muteEveryone,
    toggleAudioMuteEveryone,
    participants,
  } = useZoomContext();

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
      Participants list
      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Participants ({participants.length})
        </h3>

        {participants.map((participant) => (
          <div
            key={participant.user_name} // Key should be on the outermost element
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shadow-sm"
          >
            {/* User info section */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {participant.user_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {participant.user_name}
                </p>
                {participant.is_host && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Host
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
