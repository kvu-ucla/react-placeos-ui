// Computed health rows for the Support Diagnostics tab. The statement this
// surface makes ("the system is solid") only holds if unknown state fails
// toward "checking", never default-green — every row starts undefined and is
// only ok once its underlying facts have actually arrived.
import { useEffect, useState } from "react";
import { useBinder } from "./placeos";
import { useZoomContext } from "./ZoomContext";

export type HealthState = "ok" | "degraded" | "checking";

export interface HealthRow {
  label: string;
  state: HealthState;
  /** Short supporting detail shown beside the state */
  note?: string;
  /** Environment rows display degradation but never reset the clock */
  environment?: boolean;
}

const OPERATIONAL_SINCE_KEY = "health-operational-since";

interface RouteDetailEntry {
  rx_host?: string | null;
  [key: string]: unknown;
}

export function useSystemHealth(systemId: string): {
  rows: HealthRow[];
  operationalSince: number | null;
} {
  const { connection, zoomOnline, paired, zrcConnectionState, callStatus, zoomMod } =
    useZoomContext();

  const [graphOk, setGraphOk] = useState<boolean | undefined>();
  const [inputs, setInputs] = useState<unknown[] | undefined>();
  const [routesDetail, setRoutesDetail] = useState<
    Record<string, RouteDetailEntry> | undefined
  >();
  // callStatus maps an UNREPORTED meeting_status to NOT_IN_MEETING (sane for
  // the rest of the UI, poison for health): only trust it once the binding
  // has actually delivered at least once.
  const [meetingReported, setMeetingReported] = useState(false);

  useBinder(
    systemId,
    (binder) => {
      // Rebinding starts a fresh evidence trail — nothing is "reported" yet
      setMeetingReported(false);
      // Invalid/unknown values RESET to undefined (checking) — retaining the
      // previous healthy value would keep a row green on stale facts.
      binder.listen<boolean>("System", "signal_graph_ok", (val) => {
        setGraphOk(typeof val === "boolean" ? val : undefined);
      });
      binder.listen<unknown[]>("System", "inputs", (val) => {
        setInputs(Array.isArray(val) ? val : undefined);
      });
      // Absent Switcher module simply never delivers — row stays "checking"
      binder.listen<Record<string, RouteDetailEntry>>(
        "Switcher",
        "routes_detail",
        (val) => {
          setRoutesDetail(
            val && typeof val === "object" ? val : undefined,
          );
        },
      );
      // ts-client emits a synthetic `undefined` on subscribe before any real
      // value arrives — only a delivered report (string or explicit null)
      // counts as evidence.
      binder.listen(zoomMod, "meeting_status", (val) => {
        if (val !== undefined) setMeetingReported(true);
      });
    },
    [zoomMod],
  );

  const rows: HealthRow[] = [
    {
      label: "Websocket",
      state:
        connection === "online"
          ? "ok"
          : connection === "connecting"
            ? "checking"
            : "degraded",
      note: connection,
    },
    {
      label: "Signal routing",
      state:
        graphOk === false
          ? "degraded"
          : graphOk === undefined || inputs === undefined
            ? "checking"
            : inputs.length > 0
              ? "ok"
              : "degraded",
      note:
        graphOk === false
          ? "graph failed to load"
          : inputs !== undefined
            ? `${inputs.length} inputs`
            : undefined,
    },
    (() => {
      if (routesDetail === undefined)
        return {
          label: "Video endpoints",
          state: "checking" as const,
          environment: true,
        };
      const entries = Object.entries(routesDetail);
      const down = entries.filter(([, e]) => e?.rx_host == null);
      return {
        label: "Video endpoints",
        state: down.length === 0 ? ("ok" as const) : ("degraded" as const),
        note:
          down.length === 0
            ? `${entries.length} reachable`
            : `unreachable: ${down.map(([name]) => name).join(", ")}`,
        environment: true,
      };
    })(),
    {
      label: "Zoom Room",
      state:
        zoomOnline === undefined ||
        paired === undefined ||
        zrcConnectionState == null
          ? "checking"
          : zoomOnline && paired && zrcConnectionState.includes("Connected")
            ? "ok"
            : "degraded",
      note: zrcConnectionState?.replace("ConnectionState.ConnectionState", "") ?? undefined,
    },
    {
      label: "Meeting state",
      state: !meetingReported
        ? "checking"
        : callStatus?.status == null || callStatus.status === "UNKNOWN"
          ? "degraded"
          : "ok",
      note: meetingReported ? callStatus?.status : undefined,
    },
  ];

  // "Operational since": armed while every OWNED row is ok; resets the moment
  // one leaves ok. localStorage so a panel reload doesn't fake a fresh streak.
  const ownedAllOk = rows
    .filter((r) => !r.environment)
    .every((r) => r.state === "ok");
  const [operationalSince, setOperationalSince] = useState<number | null>(
    () => {
      const stored = Number(localStorage.getItem(OPERATIONAL_SINCE_KEY));
      return Number.isFinite(stored) && stored > 0 ? stored : null;
    },
  );

  useEffect(() => {
    if (ownedAllOk) {
      if (operationalSince == null) {
        const now = Date.now();
        localStorage.setItem(OPERATIONAL_SINCE_KEY, String(now));
        setOperationalSince(now);
      }
    } else if (operationalSince != null) {
      localStorage.removeItem(OPERATIONAL_SINCE_KEY);
      setOperationalSince(null);
    }
  }, [ownedAllOk, operationalSince]);

  return { rows, operationalSince: ownedAllOk ? operationalSince : null };
}
