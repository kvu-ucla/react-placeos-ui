// src/components/SupportModal.tsx
import { useState } from "react";
import { Icon } from "@iconify/react";
import { useZoomContext } from "../hooks/ZoomContext.tsx";
import { useControlContext } from "../hooks/ControlStateContext.tsx";
import { useEscapeKey } from "../hooks/useEscapeKey";
import type { SupportCard } from "../hooks/useControlState";

type SupportTab = "Contact" | "Diagnostics";

// Values arrive as unknown driver payloads; never let one crash the modal
const showValue = (v: unknown): string => {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  try {
    const s = JSON.stringify(v);
    return s.length > 160 ? s.slice(0, 159) + "…" : s;
  } catch {
    return String(v);
  }
};

export default function SupportModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SupportTab>("Contact");
  const {
    connection,
    zoomOnline,
    callStatus,
    zrcConnectionState,
    paired,
    health,
    meetingError,
  } = useZoomContext();
  const { system, supportPhone, supportPhoneDisplay, supportCards } =
    useControlContext();

  const avDescription = system.name?.includes("Dodd")
    ? "Please see staff in Dodd 300 for assistance."
    : "Please see the support staff for assistance.";

  useEscapeKey(onClose);

  // Cards come from the System module's `help` setting; until it's authored
  // (or if it fails to parse) fall back to the historical hardcoded three.
  const fallbackContacts: SupportCard[] = [
    {
      title: "AV Technical Support",
      description: avDescription,
      phone: supportPhoneDisplay,
      href: supportPhone ? `tel:${supportPhone}` : null,
    },
    {
      title: "Facilities Support",
      description: "Hours: 9am–5pm\nWeekdays Only",
      phone: "(310) 825-9236",
      href: "tel:+13108259236",
    },
    {
      title: "Emergency Support",
      description: "Crisis response hotline",
      phone: "(800) 900-UCLA",
      href: "tel:+18009008525",
    },
  ];
  const contacts = supportCards.length > 0 ? supportCards : fallbackContacts;

  return (
    <div className="modal modal-open modal-fade bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Support"
        className="modal-box modal-pop bg-white p-8 max-w-full max-h-[90vh] overflow-y-auto rounded-lg"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-avit-grey pb-8">
          <h2 className="text-4xl font-semibold">Support</h2>
          <div
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClose();
              }
            }}
            aria-label="Close"
            className="nav-btn btn-ghost text-2xl font-bold "
          >
            <Icon
              icon="material-symbols:close-small-outline-rounded"
              width={48}
              height={48}
            ></Icon>
          </div>
        </div>

        {/* Body */}
        <div className="flex mt-4">
          {/* Sidebar tabs */}
          <div className="w-1/4">
            <div className="flex flex-col space-y-2">
              {(["Contact", "Diagnostics"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-left px-6 py-4 rounded-lg font-medium transition-colors duration-200 ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="w-3/4 px-6">
            {activeTab === "Contact" && (
              <>
                <div className="not-prose text-left text-base text-avit-grey-80">
                  <h3 className="text-3xl font-semibold mb-4">Contact</h3>

                  <div className="space-y-3">
                    {contacts.map(({ title, description, phone, href }) => (
                      <div
                        key={title}
                        className="flex items-start justify-between gap-6 rounded-lg border border-avit-grey bg-white p-4"
                      >
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-blue-600">
                              <Icon
                                icon="material-symbols:info-rounded"
                                width={48}
                                height={48}
                              ></Icon>
                            </span>
                            <span className="font-semibold text-xl leading-tight">
                              {title}
                            </span>
                          </div>
                          <p className="text-xl leading-relaxed whitespace-pre-line text-gray-600">
                            {description}
                          </p>
                        </div>

                        {phone && href && (
                          <div className="flex items-center justify-center text-2xl">
                            <a
                              href={href}
                              className="whitespace-nowrap text-blue-600 font-semibold text-right hover:underline"
                            >
                              {phone}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-left">
                    <div className="inline-flex items-center gap-2 rounded bg-gray-100 px-3 py-1 text-sm">
                      <div className={`h-4 w-4 rounded-full ${connection === 'online' ? 'bg-green-500' : 'bg-gray-400' } mr-1 animate-pulse`}/>
                      <span className="text-gray-700 text-base font-medium">
                        {connection === 'connecting'
                          ? 'Connecting to systems…'
                          : `All systems ${connection}`}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "Diagnostics" && (
              <div className="not-prose text-left text-avit-grey-80">
                <h3 className="text-3xl font-semibold mb-4">Diagnostics</h3>
                {/* Read-out support can ask a caller for over the phone —
                    room-systems truth, not webview probes (those lived here
                    during the defect hunt; revive from cc20602 if needed) */}
                <div className="rounded-lg border border-avit-grey bg-white p-4 text-lg break-all">
                  {(
                    [
                      ["Build", showValue(__BUILD_INFO__)],
                      ["Controls link", connection],
                      ["Zoom Room", zoomOnline ? "online" : "offline"],
                      ["ZRC state", showValue(zrcConnectionState)],
                      ["Paired", paired == null ? "—" : paired ? "yes" : "no"],
                      ["Meeting", showValue(callStatus?.status)],
                      ["Driver health", showValue(health)],
                      ["Last meeting error", showValue(meetingError)],
                      ["Browser", navigator.userAgent],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex gap-4 py-1.5 border-b border-gray-100 last:border-b-0">
                      <span className="w-48 shrink-0 font-semibold text-gray-700">
                        {label}
                      </span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optional: backdrop click closes modal */}
      <div className="modal-backdrop" onClick={() => onClose()} />
    </div>
  );
}
