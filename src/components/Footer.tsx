// src/components/Footer.tsx
import { Icon } from "@iconify/react";
import { useModalContext } from "../hooks/ModalContext";
import { useZoomContext } from "../hooks/ZoomContext";
import { useEffect, useState } from "react";
import * as Slider from '@radix-ui/react-slider';



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

  useEffect(() => {
    if (!volume) return;

    setValue(volume);
  }, [volume]);

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
          <div className="ml-4 w-[500px] min-h-[48px] overflow-visible">
            <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-10"
                min={800}
                max={1200}
                step={10}
                value={[value!]}
                onValueChange={([val]) => setValue(val)}
                onValueCommit={() => handleRelease()}
            >
              <Slider.Track className="relative grow rounded-full h-3 bg-gray-300">
                <Slider.Range className="absolute h-full bg-blue-500 rounded-full" />
              </Slider.Track>
              <Slider.Thumb
                  className="block w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Volume"
              />
            </Slider.Root>
          </div>


        {/*<input*/}
        {/*  type="range"*/}
        {/*  min={800}*/}
        {/*  max={1200}*/}
        {/*  value={value}*/}
        {/*  onChange={(e) => setValue(Number(e.target.value))}*/}
        {/*  onPointerUp={handleRelease}*/}
        {/*  className="w-full range rounded-3xl [--range-thumb:white] text-[#C8D7FF] range-xl touch-none"*/}
        {/*/>*/}
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
