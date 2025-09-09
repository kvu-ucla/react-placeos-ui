// src/components/Footer.tsx
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";
import {useState} from "react";

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
  const [value, setValue] = useState(volume); 
  const handleRelease = () => {
    if (!value) return;

    value === 800 ? setMasterMute(true) : setMasterMute(false);
    adjustMasterVolume(value);
  };

  return (
      <footer className="min-h-38 bg-blue-900 text-white py-4 px-8 flex justify-between items-center">
        {recording && (
            <div className="flex flex-col items-center p-2">
              <div className="inline-flex justify-evenly items-center bg-gray-400/15 rounded-[10px] px-4 py-4">
                <div className="relative">
                  <div className="absolute inline-flex h-4 w-4 rounded-full bg-[#48E960] opacity-75 animate-ping"></div>
                  <div className="relative h-4 w-4 bg-[#48E960] rounded-full mr-4"></div>
                </div>
                <div className="font-semibold">BruinCasting</div>
              </div>
              <div className="text-lg text-gray-300">
                Recording powered by BruinCast
              </div>
            </div>
        )}
        {!recording && (
            <div className="flex flex-col items-center p-2">
              <div className="inline-flex justify-evenly items-center bg-[#001A5C] rounded-[10px] px-4 py-4">
                <div className="h-4 w-4 bg-[#CCCCCC] rounded-full mr-4"></div>
                <div className="font-semibold">Not Bruincasting</div>
              </div>
              <div className="text-lg text-gray-300">
                Recording powered by BruinCast
              </div>
            </div>
        )}
        <div className="flex items-center space-x-2">
          <div className="flex items-center mr-8">
            <div className="flex flex-col items-center mr-4">
              <div className="text-3xl font-semibold">Speaker</div>
              <div className="text-3xl font-semibold">Volume</div>
            </div>
            {volumeMute ? (
                <Icon
                    icon="material-symbols:volume-off-outline-rounded"
                    width={96}
                    height={96}
                />
            ) : (
                <Icon
                    icon="material-symbols:volume-up-outline-rounded"
                    width={96}
                    height={96}
                />
            )}
            <div className="ml-4 w-[500px] overflow-hidden">
              <input
                  type="range"
                  min={800}
                  max={1200}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  onPointerUp={handleRelease}
                  className="w-full range rounded-3xl [--range-thumb:white] text-[#C8D7FF] range-xl touch-none"
              />
              <input
                  type="range"
                  min={800}
                  max={1200}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  onPointerUp={handleRelease}
                  className="
                  w-full appearance-none touch-none
                  focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
              
                  [&::-webkit-slider-runnable-track]:h-2
                  [&::-webkit-slider-runnable-track]:rounded-full
                  [&::-webkit-slider-runnable-track]:bg-gray-200
              
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[#155dfc]
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:active:scale-110
                  [&::-webkit-slider-thumb]:-mt-[6px]
                   "
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