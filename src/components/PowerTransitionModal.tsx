// src/components/PowerTransitionModal.tsx
// Modal overlay shown while a power transition is in flight — real hardware
// power-up takes many seconds and the page sitting there unchanged reads as
// unresponsiveness. Deliberately non-dismissable (no Esc, no backdrop close,
// no buttons): it auto-clears when the room is ready or the transition is
// abandoned. Unlike the other modals, the backdrop is the OPAQUE app
// background — the page must be fully hidden during a transition. It stays
// mounted underneath and may crossfade splash ↔ main while this is up.
export default function PowerTransitionModal({
  direction,
}: {
  direction: "on" | "off";
}) {
  const label =
    direction === "on" ? "Starting up the room…" : "Shutting down…";
  return (
    <div className="modal modal-open modal-fade bg-avit-bg">
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
