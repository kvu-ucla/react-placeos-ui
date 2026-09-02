import { useZoomContext } from "../../hooks/ZoomContext";
import { useModuleExecute } from "../../hooks/placeos";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

// If the power bindings never confirm the requested state, stop showing it
// after this long (matches the SessionControls loading timeout)
const PENDING_TIMEOUT_MS = 10000;

export function DisplayTab() {
  const { system_id, inputs, outputs } = useZoomContext();

  // The toggle executes "power" on every output, so its checked state derives
  // from the outputs' power bindings (undefined = not reported yet, treat as on).
  const allPowered = Object.values(outputs).every((o) => o.power !== false);

  // Optimistic in-flight state, tagged with its toggle's sequence number.
  // Cleared once the power bindings catch up, an execute fails, or the
  // timeout expires — each clear decided against the CURRENT pending via
  // functional updates, so a stale callback can't wipe a newer toggle's state.
  const [pending, setPending] = useState<{
    value: boolean;
    seq: number;
  } | null>(null);
  const displays = pending?.value ?? allPowered;

  const pendingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleSeq = useRef(0);

  const clearPendingTimeout = () => {
    if (pendingTimeout.current) {
      clearTimeout(pendingTimeout.current);
      pendingTimeout.current = null;
    }
  };

  // Reconcile: drop pending once the bindings match its value. The updater
  // compares against the pending that is actually current at update time, so
  // a delayed effect run from an earlier commit cannot clear a newer toggle
  // (its value check fails against the new pending).
  useEffect(() => {
    setPending((current) =>
      current !== null && current.value === allPowered ? null : current,
    );
  }, [allPowered, pending]);

  // The timer only matters while a pending value is displayed; whenever
  // pending is cleared (reconcile or abandonment), drop the live timer too.
  // Re-toggle replaces the timer itself before arming a new one.
  useEffect(() => {
    if (pending === null) clearPendingTimeout();
  }, [pending]);

  useEffect(() => clearPendingTimeout, []);

  const execute = useModuleExecute(system_id);

  const toggleDisplays = () => {
    if (!outputs || Object.keys(outputs).length === 0) return;

    const newDisplayState = !displays;
    const seq = ++toggleSeq.current;
    setPending({ value: newDisplayState, seq });

    // Abandon THIS toggle's pending only if it is still the one displayed
    const abandonPending = () => {
      setPending((current) => (current?.seq === seq ? null : current));
    };

    clearPendingTimeout();
    pendingTimeout.current = setTimeout(abandonPending, PENDING_TIMEOUT_MS);

    // Fall back to the derived state if any command fails
    // (useModuleExecute already surfaces its own error toast)
    Promise.allSettled(
      Object.keys(outputs).map((output) =>
        execute(output, "power", [newDisplayState]),
      ),
    ).then((results) => {
      if (results.some((r) => r.status === "rejected")) abandonPending();
    });
  };

  return (
    <>
      <h3 className="font-semibold mb-2">Displays</h3>

      {/* Toggle All Display Screens*/}
      <div className="border border-[#999] text-avit-grey-80 rounded-lg p-4 flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">All display screens</h3>
        <label className="cursor-pointer label">
          <input
            onChange={toggleDisplays}
            type="checkbox"
            checked={displays}
            className="toggle border-gray-300 bg-gray-300 toggle-xl checked:border-blue-600 checked:bg-blue-600 checked:text-white"
          />
        </label>
      </div>

      {/* Container */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {Object.entries(outputs).map(([dispId, display]) => {
          // Filter out camera inputs
          const nonCameraInputs = display.inputs.filter(
            (input) => !input.toLowerCase().includes("camera"),
          );

          return (
            <div
              key={dispId}
              className="collapse collapse-arrow border border-[#999]"
            >
              <input type="radio" name="display-accordion" className="collapse-toggle" />

              {/* Accordion Header */}
              <div className="collapse-title text-xl font-medium flex items-center gap-2">
                <Icon
                  icon="material-symbols:tv-displays-outline-rounded"
                  width={24}
                  height={24}
                />
                {display.name}
                <div className="badge badge-outline ml-auto">
                  {nonCameraInputs.length} inputs
                </div>
              </div>

              {/* Accordion Content */}
              <div className="collapse-content">
                <div className="text-gray-700 p-3 rounded flex items-center gap-2 mb-4">
                  <span className="text-avit-grey-80">
                    <Icon
                      icon="material-symbols:info-rounded"
                      width={24}
                      height={24}
                    />
                  </span>
                  <span className="font-medium">
                    Sources are automatically connected via Zoom.
                  </span>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      const dispMuteState = outputs[dispId].mute;
                      const newMuteState = !dispMuteState;

                      newMuteState
                        ? execute(dispId, "mute")
                        : execute(dispId, "unmute");
                    }}
                    className={`btn w-[300px] h-[64px] ml-4 px-9 py-6 rounded-lg text-xl font-medium ${
                      outputs[dispId].mute
                        ? "bg-black border-black text-white"
                        : "bg-gray-100 border-gray-100 text-avit-grey-80"
                    }`}
                  >
                    {outputs[dispId].mute ? "Unmute Display" : "Mute Display"}
                  </button>
                </div>

                <div className="space-y-2">
                  {nonCameraInputs.map((inputId) => {
                    const inputData = inputs[inputId];
                    const isSelectedSource =
                      inputData?.source === display.source;

                    // Get name from the module itself
                    const friendlyName = inputData?.name;

                    return (
                      <button
                        key={inputId}
                        onClick={() => {
                          execute("System", "route", [inputId, dispId]);
                        }}
                        className={`relative w-full p-4 rounded-lg flex items-center justify-between transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isSelectedSource
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        <span className="flex items-center font-semibold">
                          {friendlyName}
                          {isSelectedSource && (
                            <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full ml-2">
                              CONNECTED
                            </span>
                          )}
                        </span>

                        {/* TODO: sync-detected indicator needs a real signal from the input module */}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
