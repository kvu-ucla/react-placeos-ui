// src/components/VolumeSlider.tsx
import { Icon } from "@iconify/react";
import * as Slider from "@radix-ui/react-slider";

export default function VolumeSlider({
  value,
  min = 800,
  max = 1200,
  step = 10,
  onChange,
  onCommit,
  onDragStart,
  muted,
  onToggleMute,
  ariaLabel = "Volume",
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
  /** Fired on pointer down so consumers can pause binding-echo syncs until onCommit */
  onDragStart?: () => void;
  muted?: boolean;
  onToggleMute?: () => void;
  ariaLabel?: string;
}) {
  return (
    <>
      {muted !== undefined && onToggleMute && (
        <button
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="btn-ghost"
        >
          <Icon
            icon={
              muted
                ? "material-symbols:volume-off-outline-rounded"
                : "material-symbols:volume-up-outline-rounded"
            }
            width={72}
            height={72}
          />
        </button>
      )}
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-16"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onPointerDown={onDragStart}
        onValueChange={([val]) => onChange(val)}
        onValueCommit={([val]) => onCommit(val)}
      >
        <Slider.Track className="relative grow rounded-full h-6 bg-gray-300">
          <Slider.Range className="absolute h-full bg-blue-500 rounded-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-12 h-12 bg-white border-2 border-blue-500 rounded-full shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-6 focus:ring-blue-500"
          aria-label={ariaLabel}
        />
      </Slider.Root>
    </>
  );
}
