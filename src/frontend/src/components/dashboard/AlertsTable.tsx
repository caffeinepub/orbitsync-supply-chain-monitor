import { AlertOctagon, AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { Alert } from "../../backend.d";
import { AlertSeverity, AlertType } from "../../backend.d";

function tsToTime(ts: bigint): string {
  const ms = Number(ts);
  if (ms === 0) return "—";
  const date = ms > 1e13 ? new Date(ms / 1_000_000) : new Date(ms);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityConfig(severity: AlertSeverity) {
  switch (severity) {
    case AlertSeverity.high:
      return {
        color: "#EF4444",
        bg: "#2E0A0A",
        icon: <AlertOctagon size={12} />,
      };
    case AlertSeverity.medium:
      return {
        color: "#F59E0B",
        bg: "#2E1F0A",
        icon: <AlertTriangle size={12} />,
      };
    default:
      return { color: "#2F8CFF", bg: "#0A1A2E", icon: <Info size={12} /> };
  }
}

function alertTypeLabel(type: AlertType): string {
  switch (type) {
    case AlertType.tempExceeded:
      return "Temp Exceeded";
    case AlertType.humidityAlert:
      return "Humidity Alert";
    case AlertType.shockDetected:
      return "Shock Detected";
    case AlertType.geofenceBreach:
      return "Geofence Breach";
    case AlertType.signalLost:
      return "Signal Lost";
    default:
      return "Alert";
  }
}

interface AlertsTableProps {
  alerts: Alert[];
  onResolve: (id: string) => void;
  isResolving: boolean;
}

export function AlertsTable({
  alerts,
  onResolve,
  isResolving,
}: AlertsTableProps) {
  return (
    <div
      className="rounded-xl"
      style={{ backgroundColor: "#141E2A", border: "1px solid #1F2B3A" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#1F2B3A" }}
      >
        <div className="text-[13px] font-semibold" style={{ color: "#E8EEF6" }}>
          Recent Alerts
        </div>
        <div
          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: alerts.length > 0 ? "#2E0A0A" : "#0A2E16",
            color: alerts.length > 0 ? "#EF4444" : "#22C55E",
          }}
        >
          {alerts.length} unresolved
        </div>
      </div>

      <div data-ocid="alerts.table" className="overflow-x-auto">
        {alerts.length === 0 ? (
          <div data-ocid="alerts.empty_state" className="py-8 text-center">
            <CheckCircle
              size={28}
              className="mx-auto mb-2"
              style={{ color: "#22C55E" }}
            />
            <div className="text-[13px]" style={{ color: "#8FA2B8" }}>
              All clear — no active alerts
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1F2B3A" }}>
                {[
                  "Severity",
                  "Type",
                  "Asset ID",
                  "Message",
                  "Time",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide font-semibold"
                    style={{ color: "#8FA2B8" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, i) => {
                const sc = severityConfig(alert.severity);
                return (
                  <tr
                    key={alert.id}
                    data-ocid={`alerts.row.${i + 1}`}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: "1px solid #1F2B3A" }}
                  >
                    <td className="px-4 py-3">
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                      >
                        {sc.icon}
                        {alert.severity.toUpperCase()}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-[12px]"
                      style={{ color: "#E8EEF6" }}
                    >
                      {alertTypeLabel(alert.alertType)}
                    </td>
                    <td
                      className="px-4 py-3 text-[11px] font-mono"
                      style={{ color: "#8FA2B8" }}
                    >
                      {alert.assetId.slice(0, 10)}…
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] max-w-[200px] truncate"
                      style={{ color: "#8FA2B8" }}
                    >
                      {alert.message}
                    </td>
                    <td
                      className="px-4 py-3 text-[11px]"
                      style={{ color: "#8FA2B8" }}
                    >
                      {tsToTime(alert.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        data-ocid={`alerts.resolve_button.${i + 1}`}
                        onClick={() => onResolve(alert.id)}
                        disabled={isResolving}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors hover:opacity-80"
                        style={{ backgroundColor: "#1F2B3A", color: "#22D3C5" }}
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
