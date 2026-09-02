// src/components/PowerTransitionScreen.tsx
// Shown between SplashScreen and MainScreen while a power transition is in
// flight — real hardware power-up takes many seconds and the old screen
// sitting there reads as unresponsiveness.
export default function PowerTransitionScreen({
  direction,
}: {
  direction: "on" | "off";
}) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 bg-avit-bg"
      role="status"
    >
      <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-avit-blue"></div>
      <p className="text-3xl font-semibold text-gray-600">
        {direction === "on" ? "Starting up the room…" : "Shutting down…"}
      </p>
    </div>
  );
}
