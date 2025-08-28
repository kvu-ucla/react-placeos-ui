// src/components/Footer.tsx
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";
import { useState, useMemo } from "react";

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

  // ---- Volume slider config ----
  const MIN = 800;
  const MAX = 1200;

  // local value, start wherever volume is polled
  const [value, setValue] = useState(volume ?? MIN);

  const percent = useMemo(() => {
    const pct = ((value - MIN) / (MAX - MIN)) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [value]);

  const handleRelease = () => {
    if (value == null) return;
    value === MIN ? setMasterMute(true) : setMasterMute(false);
    adjustMasterVolume(value);
  };

  return (
      <footer className="min-h-38 bg-blue-900 text-white py-4 px-8 flex justify-between items-center">
        {recording ? (
            <div className="flex flex-col items-center p-2">
              <div className="inline-flex justify-evenly items-center bg-gray-400/15 rounded-[10px] px-4 py-4">
                <div className="relative">
                  <div className="absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75 animate-ping"></div>
                  <div className="relative h-4 w-4 bg-red-400 rounded-full mr-4"></div>
                </div>
                <div className="font-semibold">BruinCast Live!</div>
              </div>
              <div className="text-lg text-gray-300">Recording powered by BruinCast</div>
            </div>
        ) : (
            <div className="flex flex-col items-center p-2">
              <div className="inline-flex justify-evenly items-center bg-[#001A5C] rounded-[10px] px-4 py-4">
                <div className="h-4 w-4 bg-[#BFC2C7] rounded-full mr-4"></div>
                <div className="font-semibold">Not Bruincasted</div>
              </div>
              <div className="text-lg text-gray-300">Recording powered by BruinCast</div>
            </div>
        )}

        <div className="flex items-center space-x-2">
          <div className="flex items-center mr-8">
            {/* Label stack + icon */}
            <div className="flex items-center mr-4">
              <div className="flex flex-col leading-tight text-white mr-2">
                <span className="text-base font-semibold">Speaker</span>
                <span className="text-base font-semibold">Volume</span>
              </div>
              {volumeMute ? (
                  <Icon
                      icon="material-symbols:volume-off-outline-rounded"
                      width={28}
                      height={28}
                      className="opacity-90"
                  />
              ) : (
                  <Icon
                      icon="material-symbols:volume-up-outline-rounded"
                      width={28}
                      height={28}
                      className="opacity-90"
                  />
              )}
            </div>

            {/* Gauge: fixed width, height matched to small thumb */}
            <div className="shrink-0 w-[500px] overflow-visible">
              <div className="relative w-full">
                {/* Base track (match thumb height) */}
                <div className="absolute inset-0 h-[18px] rounded-full bg-[#334155]" />
                {/* Fill */}
                <div
                    className="absolute inset-y-0 left-0 h-[18px] rounded-full bg-[#C8D7FF]"
                    style={{ width: `${percent}%` }}
                />
                {/* Slider (transparent track; only thumb visible) */}
                <input
                    type="range"
                    min={MIN}
                    max={MAX}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    onPointerUp={handleRelease}
                    className="relative z-10 w-full h-[18px] appearance-none bg-transparent outline-none rounded-full"
                />
              </div>
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
        
        <style>{`
        input[type="range"] { -webkit-appearance: none; appearance: none; }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 40px; background: transparent; border-radius: 9999px;
        }
        input[type="range"]::-moz-range-track {
          height: 40px; background: transparent; border-radius: 9999px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 30px; height: 30px; border-radius: 9999px;
          background: #fff; border: 2px solid #94a3b8;
          margin-top: 5px; /* centers thumb on 40px track in WebKit */
        }
        input[type="range"]::-moz-range-thumb {
          width: 30px; height: 30px; border-radius: 9999px;
          background: #fff; border: 2px solid #94a3b8;
        }
        input[type="range"]::-moz-range-progress { background: transparent; }
      `}</style>
      </footer>
  );
}
