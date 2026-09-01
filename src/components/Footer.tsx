// src/components/Footer.tsx
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";
import { useEffect, useState } from "react";
import VolumeSlider from "./VolumeSlider";
import {SYSTEM_FEATURE} from "../hooks/useZoomModule.ts";



export default function Footer() {
  const {
    volume,
    volumeMute,
    adjustMasterVolume,
    setMasterMute,
    // toggleMasterMute,
    getFeatures,  
    callStatus,
    recording,
  } = useZoomContext();
  const { showModal } = useModalContext();
  const isJoined = callStatus?.status === "IN_MEETING";
  const [value, setValue] = useState(volume);
  const handleRelease = (val: number) => {
    if (!val) return;

    setMasterMute(val === 800);
    adjustMasterVolume(val);
  };

  useEffect(() => {
    if (!volume) return;

    setValue(volume);
  }, [volume]);

  return (
    <footer className="min-h-32 bg-blue-900 text-white px-4 py-2  flex justify-between items-center">
      {getFeatures?.includes(SYSTEM_FEATURE.BruinCast) && (
        recording ? (
          <div className="flex flex-col items-start justify-start p-2">
            <div className="inline-flex justify-evenly items-center bg-gray-400/15 rounded-[10px] px-4 py-2">
              <div className="relative">
                <div className="absolute inline-flex h-4 w-4 rounded-full bg-[#48E960] opacity-75 animate-ping"></div>
                <div className="relative h-4 w-4 bg-[#48E960] rounded-full mr-4"></div>
              </div>
              <div className="font-semibold text-xl text-white">BruinCasting</div>
            </div>
            <div className="text-lg text-gray-300">
              Recording powered by BruinCast
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start justify-start p-2">
            <div className="inline-flex justify-evenly items-center bg-[#001A5C] rounded-[10px] px-4 py-2">
              <div className="h-4 w-4 bg-[#CCCCCC] rounded-full mr-4"></div>
              <div className="font-semibold text-xl text-white">Not Bruincasting</div>
            </div>
            <div className="text-lg text-gray-300">
              Recording powered by BruinCast
            </div>
          </div>
        )
      )}
      <div className="flex items-center space-x-2 ml-auto">
        <div className="flex items-center mr-8">
          <div className="flex flex-col items-center mr-4">
            <div className="text-3xl font-semibold">Volume</div>
          </div>
                {volumeMute ? <Icon
                    icon="material-symbols:volume-off-outline-rounded"
                    width={72}
                    height={72}
                />
                :
                <Icon
                    icon="material-symbols:volume-up-outline-rounded"
                    width={72}
                    height={72}
                />}
          <div className="ml-4 w-[360px] min-h-[48px] overflow-visible">
            <VolumeSlider
                value={value!}
                onChange={setValue}
                onCommit={handleRelease}
                ariaLabel="Master volume"
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
