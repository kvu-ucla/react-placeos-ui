// src/components/SupportModal.tsx
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useZoomContext } from "../hooks/ZoomContext.tsx";
import { useControlContext } from "../hooks/ControlStateContext.tsx";
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY } from "../config";
import { useEscapeKey } from "../hooks/useEscapeKey";

interface ContactInfo {
  title: string;
  description: string;
  phone: string | null;
  href: string | null;
}

// On-glass rendering diagnostics — the physical panel's webview shows defects
// desktop Chrome doesn't and devtools can't attach, so the ground truth
// (computed styles + engine feature support + which build is on glass) has to
// be readable on the panel itself. Every probe is individually guarded: a
// hostile webview must never crash the support modal.
function collectDiagnostics(xBtn: HTMLElement | null): [string, string][] {
  const rows: [string, string][] = [];
  const safe = (name: string, fn: () => string) => {
    try {
      rows.push([name, fn()]);
    } catch (err) {
      rows.push([name, `err: ${String(err)}`]);
    }
  };
  const styleOf = (el: Element | null) => (el ? getComputedStyle(el) : null);
  const appearanceOf = (s: CSSStyleDeclaration) =>
    s.appearance ||
    (s as unknown as Record<string, string>).webkitAppearance ||
    "?";

  safe("build", () => __BUILD_INFO__);
  safe("nav-btn", () => {
    // Prefer an unselected nav button (the defective state); while this
    // modal is open the Support button itself is selected, so on the splash
    // screen only a selected sample may exist — labeled accordingly.
    const unsel = document.querySelector(
      "header .nav-btn:not(.nav-btn-selected)",
    );
    const el = unsel ?? document.querySelector("header .nav-btn");
    const s = styleOf(el);
    if (!s) return "n/a";
    const tag = unsel ? "" : " (selected sample)";
    return `appearance=${appearanceOf(s)}; bg=${s.backgroundColor}; border=${s.border || `${s.borderWidth} ${s.borderStyle}`}${tag}`;
  });
  safe("header shadow", () => {
    // shadow-lg lives on the <header> element but ONLY while the system is
    // active — say which case we measured so 'none' is interpretable
    const el = document.querySelector("header");
    if (!el) return "n/a";
    const has = el.classList.contains("shadow-lg");
    return `class=${has ? "yes" : "no (shadow-lg is active-only)"}; computed=${getComputedStyle(el).boxShadow.slice(0, 60)}`;
  });
  safe("x-btn", () => {
    const s = styleOf(xBtn);
    return s ? `appearance=${appearanceOf(s)}; bg=${s.backgroundColor}` : "n/a";
  });
  safe("x-btn --btn-bg", () => {
    const s = styleOf(xBtn);
    return s ? s.getPropertyValue("--btn-bg").trim() || "(unset)" : "n/a";
  });
  safe("inline-shadow test", () => {
    // Same idea as inline-bg: does the highest-precedence author shadow
    // (inline style) survive on this engine?
    const el = document.querySelector("header") as HTMLElement | null;
    if (!el) return "n/a";
    const prev = el.style.boxShadow;
    el.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
    const read = getComputedStyle(el).boxShadow;
    el.style.boxShadow = prev;
    return read;
  });
  safe("inline-bg test", () => {
    // Does an INLINE background take effect? Distinguishes "our stylesheet
    // rule loses somewhere" from "the engine overrides author backgrounds
    // on this element wholesale" — inline style is the highest author
    // precedence CSS offers.
    const el = (document.querySelector(
      "header .nav-btn:not(.nav-btn-selected)",
    ) ?? document.querySelector("header .nav-btn")) as HTMLElement | null;
    if (!el) return "n/a";
    const prev = el.style.backgroundColor;
    el.style.backgroundColor = "transparent";
    const read = getComputedStyle(el).backgroundColor;
    el.style.backgroundColor = prev;
    return read;
  });
  safe("cssom", () => {
    // Prove our nav-btn rules exist in the parsed CSSOM on this engine
    let count = 0;
    let first = "";
    const walk = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        const r = rule as CSSStyleRule & { cssRules?: CSSRuleList };
        if (r.selectorText?.includes("nav-btn")) {
          count++;
          if (!first) first = r.cssText.slice(0, 60);
        }
        if (r.cssRules) walk(r.cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        /* cross-origin sheet — skip */
      }
    }
    return `count=${count}; first=${first || "none"}`;
  });
  safe("forced-colors", () =>
    [
      `active=${matchMedia("(forced-colors: active)").matches}`,
      `contrast-more=${matchMedia("(prefers-contrast: more)").matches}`,
      `inverted=${matchMedia("(inverted-colors: inverted)").matches}`,
    ].join("; "),
  );
  safe("@property", () => String("CSSPropertyRule" in window));
  safe("@layer", () => String("CSSLayerBlockRule" in window));
  safe(":has", () => String(CSS.supports("selector(:has(a))")));
  safe("relative-color", () => String(CSS.supports("color", "oklch(from red l c h)")));
  safe("color-mix", () => String(CSS.supports("color", "color-mix(in oklab,red,blue)")));
  safe("mask-image", () => String(CSS.supports("mask-image", "none")));
  return rows;
}

export default function SupportModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"Contact">("Contact");
  const xBtnRef = useRef<HTMLDivElement>(null);
  const [diagnostics, setDiagnostics] = useState<[string, string][]>([]);
  // Read at modal-open time, from the live DOM
  useEffect(() => {
    setDiagnostics(collectDiagnostics(xBtnRef.current));
  }, []);

  const { connection } = useZoomContext();
  const { system } = useControlContext();

  const avDescription = system.name?.includes("Dodd")
    ? "Please see staff in Dodd 300 for assistance."
    : "Please see the support staff for assistance.";

  useEscapeKey(onClose);

  const contacts: ContactInfo[] = [
    {
      title: "AV Technical Support",
      description: avDescription,
      phone: SUPPORT_PHONE_DISPLAY,
      href: SUPPORT_PHONE ? `tel:${SUPPORT_PHONE}` : null,
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
            ref={xBtnRef}
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
              {["Contact"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "Contact")}
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

                  {/* Diagnostics — helps support identify the panel webview */}
                  <div className="mt-2 text-left text-sm text-gray-500 break-all">
                    Browser: {navigator.userAgent}
                  </div>
                  <div className="mt-1 text-left text-xs text-gray-500 break-all">
                    {diagnostics.map(([name, value]) => (
                      <div key={name}>
                        {name}: {value}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Optional: backdrop click closes modal */}
      <div className="modal-backdrop" onClick={() => onClose()} />
    </div>
  );
}
