// src/components/RoomStatusModal.tsx
// The single loading treatment for the room: cold-load connecting, powering
// up, and shutting down all share this modal. Deliberately non-dismissable
// (no Esc, no backdrop close, no buttons): it auto-clears when the state
// resolves. The page stays mounted behind the blurred scrim and may
// crossfade splash ↔ main underneath while this is up — that's intended.
export type RoomStatusVariant = "loading" | "starting" | "stopping";

const LABELS: Record<RoomStatusVariant, string> = {
  loading: "Connecting to room systems…",
  starting: "Starting up the room…",
  stopping: "Shutting down the room…",
};

export default function RoomStatusModal({
  variant,
}: {
  variant: RoomStatusVariant;
}) {
  const label = LABELS[variant];
  return (
    // backdrop-blur is unique to this modal — the loading states hide the
    // half-hydrated page behind them; the other modals keep a plain scrim
    <div className="modal modal-open modal-fade bg-black/40 backdrop-blur-md">
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
