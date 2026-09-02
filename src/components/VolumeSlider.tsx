// src/components/VolumeSlider.tsx
import { useEffect, useRef } from "react";
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
  onDragEnd,
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
  /** Fired on pointer down so consumers can pause binding-echo syncs while dragging */
  onDragStart?: () => void;
  /**
   * Fired when the pointer interaction ends, on ALL end paths (pointerup or
   * pointercancel anywhere on the window). Radix only fires onValueCommit when
   * the value changed, so consumers must clear drag guards here, not in onCommit.
   */
  onDragEnd?: () => void;
  muted?: boolean;
  onToggleMute?: () => void;
  ariaLabel?: string;
}) {
  const onDragEndRef = useRef(onDragEnd);
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  });

  // Detach fn for the currently-registered window listeners, if any
  const detachRef = useRef<(() => void) | null>(null);

  const handlePointerDown = () => {
    onDragStart?.();
    if (detachRef.current) return; // already tracking this drag
    const end = () => {
      detachRef.current?.();
      onDragEndRef.current?.();
    };
    detachRef.current = () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      detachRef.current = null;
    };
    // Window-level so the end signal fires even if the pointer leaves the
    // slider or the interaction is cancelled; bubbles after Radix's own
    // pointerup handling, so onValueCommit (when it fires) runs first.
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  useEffect(() => () => detachRef.current?.(), []);

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
        onPointerDown={handlePointerDown}
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
