// src/components/RoomStatusModal.tsx
// The single loading treatment for the room: cold-load connecting, powering
// up, and shutting down all share this modal. Deliberately non-dismissable
// (no Esc, no backdrop close, no buttons): it auto-clears when the state
// resolves. The page stays mounted behind the blurred scrim and may
// crossfade splash ↔ main underneath while this is up — that's intended.
//
// Owns its own mount state so the scrim + blur can fade OUT as well as in:
// when `variant` goes null the element stays mounted running the exit
// animation, then unmounts on animationend (timer fallback so a missed
// event can't strand it). A variant change while visible just swaps the
// label in place — only presence/absence triggers enter/exit.
import { useEffect, useState, type AnimationEvent } from "react";

export type RoomStatusVariant = "loading" | "starting" | "stopping";

const LABELS: Record<RoomStatusVariant, string> = {
  loading: "Connecting to room systems…",
  starting: "Starting up the room…",
  stopping: "Shutting down the room…",
};

// Exit animation is 200ms; the fallback fires just after in case the
// animationend event is missed (tab hidden, animation cancelled).
const EXIT_FALLBACK_MS = 250;

export default function RoomStatusModal({
  variant,
}: {
  variant: RoomStatusVariant | null;
}) {
  const [shown, setShown] = useState<RoomStatusVariant | null>(variant);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (variant) {
      setShown(variant);
      setExiting(false);
    } else {
      setExiting(shown !== null);
    }
  }, [variant, shown]);

  useEffect(() => {
    if (!exiting) return;
    // The reduced-motion block disables the exit animation, so animationend
    // never fires — unmount immediately (instant out, matching instant in)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(null);
      setExiting(false);
      return;
    }
    const timer = setTimeout(() => {
      setShown(null);
      setExiting(false);
    }, EXIT_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [exiting]);

  const handleAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (exiting && e.animationName === "ui-status-out") {
      setShown(null);
      setExiting(false);
    }
  };

  if (!shown) return null;

  const label = LABELS[shown];
  return (
    // backdrop blur is unique to this modal — the loading states hide the
    // half-hydrated page behind them; the other modals keep a plain scrim.
    // status-modal-fade animates scrim color AND blur together (plain
    // .modal-fade would snap the blur on).
    <div
      className={`modal modal-open status-modal-fade bg-black/40 backdrop-blur-md ${
        exiting ? "status-modal-exit" : ""
      }`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="modal-box modal-pop flex flex-col items-center gap-6 rounded-lg bg-white p-8"
      >
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-avit-blue"></div>
        <p className="text-3xl font-semibold text-gray-600">{label}</p>
      </div>
    </div>
  );
}
