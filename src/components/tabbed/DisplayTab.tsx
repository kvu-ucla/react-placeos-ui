import { useZoomContext } from "../../hooks/ZoomContext";
import { useModuleExecute } from "../../hooks/placeos";
import { useState } from "react";
import { Icon } from "@iconify/react";

export function DisplayTab() {
  const { system_id, inputs, outputs } = useZoomContext();

  const [displays, setDisplays] = useState(true);

  const execute = useModuleExecute(system_id);

  const toggleDisplays = () => {
    if (!outputs) return;

    const newDisplayState = !displays;
    setDisplays(newDisplayState);

    for (const output of Object.keys(outputs)) {
      execute(output, "power", [newDisplayState]);
    }
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

                        {/* TODO(chunk 5): sync-detected indicator — needs real signal state from the input module */}
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
