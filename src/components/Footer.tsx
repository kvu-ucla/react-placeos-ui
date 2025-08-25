// src/components/Footer.tsx
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";

export default function Footer() {
  const {
    volume,
    volumeMute,
    adjustMasterVolume,
    setMasterMute,
    callStatus,
    recording,
  } = useZoomContext();
  const { showModal } = useModalContext();
  const isJoined = callStatus?.status === "IN_MEETING";

  console.log("Footer recording =", recording);
  return (
    <footer className="min-h-38 bg-blue-900 text-white py-4 px-8 flex justify-between items-center">
      {recording && (
        <div className="flex flex-col items-center p-2">
          <div className="inline-flex justify-evenly items-center bg-gray-400/15 rounded-[10px] px-4 py-4">
            <div className="relative">
              <div className="absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75 animate-ping"></div>
              <div className="relative h-4 w-4 bg-red-400 rounded-full mr-4"></div>
            </div>
            <div className="font-semibold">BruinCast Live!</div>
          </div>
          <div className="text-lg text-gray-300">
            Recording powered by BruinCast
          </div>
        </div>
      )}
      {!recording && (
        <div className="flex flex-col items-center p-2">
          <div className="inline-flex justify-evenly items-center bg-[#001A5C] rounded-[10px] px-4 py-4">
            <div className="h-4 w-4 bg-[#BFC2C7] rounded-full mr-4"></div>
            <div className="font-semibold">Not Bruincasted</div>
          </div>
          <div className="text-lg text-gray-300">
            Recording powered by BruinCast
          </div>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <div className="flex items-center mr-8">
          <div className="text-3xl">Speaker Volume</div>
            {volumeMute} ??
          <Icon
            icon="material-symbols:volume-up-outline-rounded"
            width={128}
            height={128}
          />
          :
          <Icon
            icon="material-symbols:volume-up-outline-rounded"
            width={128}
            height={128}
          />
          <div className="ml-4 w-full overflow-hidden">
            <input
              type="range"
              min={600}
              max={1200}
              value={volume}
              onChange={(e) => {
                if (Number(e.target.value) <= 600) {
                  setMasterMute(); // trigger mute if slider hits 600
                } else {
                  adjustMasterVolume(Number(e.target.value)); // send the raw value (600–1200)
                }
              }}
              className="w-full range rounded-3xl [--range-thumb:white] text-[#C8D7FF] range-xl touch-none"
            />
          </div>
        </div>

        {isJoined && (
          <button
            onClick={() => showModal("end-meeting")}
            className="btn btn-error text-white text-3xl p-8 rounded-lg font-medium"
          >
            End Meeting
          </button>
        )}
      </div>
    </footer>
  );
}
