import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Droplets, Signal, Thermometer, Zap } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type {
  Asset,
  CustodyEvent,
  ETA,
  Telemetry,
  TelemetryHistory,
} from "../../backend.d";
import { EventType } from "../../backend.d";

const METRIC_SKELETONS = ["m1", "m2", "m3", "m4"];

function tsToDate(ts: bigint): string {
  const ms = Number(ts);
  if (ms === 0) return "—";
  const date = ms > 1e13 ? new Date(ms / 1_000_000) : new Date(ms);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetricTile({
  icon,
  label,
  value,
  unit,
  danger,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit: string;
  danger?: boolean;
  warning?: boolean;
}) {
  const valueColor = danger ? "#EF4444" : warning ? "#F59E0B" : "#22D3C5";
  return (
    <div
      className="flex-1 rounded-xl p-3 flex flex-col gap-1"
      style={{
        backgroundColor: "#0B0F14",
        border: `1px solid ${danger ? "#EF444433" : warning ? "#F59E0B33" : "#1F2B3A"}`,
      }}
    >
      <div className="flex items-center gap-1.5" style={{ color: "#8FA2B8" }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div
        className="text-[22px] font-bold leading-none"
        style={{ color: valueColor }}
      >
        {value !== null ? value.toFixed(1) : "—"}
        <span
          className="text-[12px] font-normal ml-1"
          style={{ color: "#8FA2B8" }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function eventTypeLabel(type: EventType): string {
  switch (type) {
    case EventType.pickup:
      return "Pickup";
    case EventType.transfer:
      return "Transfer";
    case EventType.checkpoint:
      return "Checkpoint";
    case EventType.delivery:
      return "Delivery";
    default:
      return "Event";
  }
}

function eventTypeColor(type: EventType): string {
  switch (type) {
    case EventType.pickup:
      return "#22D3C5";
    case EventType.delivery:
      return "#22C55E";
    case EventType.checkpoint:
      return "#2F8CFF";
    default:
      return "#8FA2B8";
  }
}

interface AssetDetailsProps {
  asset: Asset | null;
  telemetry: Telemetry | null | undefined;
  history: TelemetryHistory | undefined;
  custody: CustodyEvent[];
  eta: ETA | null | undefined;
  isLoading: boolean;
}

export function AssetDetails({
  asset,
  telemetry,
  history,
  custody,
  eta,
  isLoading,
}: AssetDetailsProps) {
  if (!asset) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center p-6 rounded-xl"
        style={{ backgroundColor: "#141E2A", border: "1px solid #1F2B3A" }}
      >
        <Signal size={32} style={{ color: "#223245" }} className="mb-3" />
        <div className="text-[13px] font-medium" style={{ color: "#8FA2B8" }}>
          Select an asset
        </div>
        <div className="text-[11px] mt-1" style={{ color: "#223245" }}>
          Click a marker or list item to view details
        </div>
      </div>
    );
  }

  const tempHistory = history?.readings.map((r) => r.temperature) ?? [];
  const humidityHistory = history?.readings.map((r) => r.humidity) ?? [];
  const shockHistory = history?.readings.map((r) => r.shockG) ?? [];
  const etaDate = eta ? tsToDate(eta.estimatedArrival) : null;
  const distKm = eta?.distanceKm ?? null;
  const speed = eta?.currentSpeedKnots ?? null;

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto scrollbar-thin">
      {/* Asset header */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "#141E2A", border: "1px solid #1F2B3A" }}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <div
              className="text-[14px] font-semibold"
              style={{ color: "#E8EEF6" }}
            >
              {asset.name}
            </div>
            <div className="text-[11px]" style={{ color: "#8FA2B8" }}>
              ID: {asset.id.slice(0, 12)}…
            </div>
          </div>
          <div
            className="text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{ backgroundColor: "#0D2E2A", color: "#22D3C5" }}
          >
            REAL-TIME
          </div>
        </div>
        <div className="text-[11px]" style={{ color: "#8FA2B8" }}>
          {asset.origin} → {asset.destination}
        </div>
        {etaDate && (
          <div className="flex items-center gap-1.5 mt-2">
            <Clock size={12} style={{ color: "#F59E0B" }} />
            <span className="text-[11px]" style={{ color: "#F59E0B" }}>
              ETA: {etaDate}
            </span>
            {speed && (
              <span className="text-[11px]" style={{ color: "#8FA2B8" }}>
                • {speed.toFixed(1)} kts
              </span>
            )}
            {distKm && (
              <span className="text-[11px]" style={{ color: "#8FA2B8" }}>
                • {distKm.toFixed(0)} km
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metrics */}
      {isLoading ? (
        <div
          data-ocid="details.loading_state"
          className="grid grid-cols-2 gap-2"
        >
          {METRIC_SKELETONS.map((k) => (
            <Skeleton
              key={k}
              className="h-16 rounded-xl"
              style={{ backgroundColor: "#1F2B3A" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <MetricTile
            icon={<Thermometer size={12} />}
            label="Temp"
            value={telemetry?.temperature ?? null}
            unit="°C"
            danger={
              (telemetry?.temperature ?? 0) > 30 ||
              (telemetry?.temperature ?? 0) < 2
            }
            warning={(telemetry?.temperature ?? 0) > 25}
          />
          <MetricTile
            icon={<Droplets size={12} />}
            label="Humidity"
            value={telemetry?.humidity ?? null}
            unit="%"
            warning={(telemetry?.humidity ?? 0) > 75}
          />
          <MetricTile
            icon={<Zap size={12} />}
            label="Shock"
            value={telemetry?.shockG ?? null}
            unit="G"
            danger={(telemetry?.shockG ?? 0) > 3}
            warning={(telemetry?.shockG ?? 0) > 1}
          />
          <MetricTile
            icon={<Signal size={12} />}
            label="Satellite"
            value={telemetry?.satelliteSignal ?? null}
            unit="%"
            danger={(telemetry?.satelliteSignal ?? 100) < 30}
            warning={(telemetry?.satelliteSignal ?? 100) < 60}
          />
        </div>
      )}

      {/* Sparklines */}
      {tempHistory.length > 0 && (
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "#141E2A", border: "1px solid #1F2B3A" }}
        >
          <div
            className="text-[11px] uppercase tracking-wide font-medium mb-2"
            style={{ color: "#8FA2B8" }}
          >
            Sensor History
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-[10px] mb-0.5" style={{ color: "#8FA2B8" }}>
                Temperature (°C)
              </div>
              <Sparkline data={tempHistory} color="#22D3C5" />
            </div>
            <div>
              <div className="text-[10px] mb-0.5" style={{ color: "#8FA2B8" }}>
                Humidity (%)
              </div>
              <Sparkline data={humidityHistory} color="#2F8CFF" />
            </div>
            <div>
              <div className="text-[10px] mb-0.5" style={{ color: "#8FA2B8" }}>
                Shock (G)
              </div>
              <Sparkline data={shockHistory} color="#F59E0B" />
            </div>
          </div>
        </div>
      )}

      {/* Custody Chain */}
      {custody.length > 0 && (
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "#141E2A", border: "1px solid #1F2B3A" }}
        >
          <div
            className="text-[11px] uppercase tracking-wide font-medium mb-3"
            style={{ color: "#8FA2B8" }}
          >
            Custody Chain
          </div>
          <div className="relative">
            <div
              className="absolute left-3 top-0 bottom-0 w-px"
              style={{ backgroundColor: "#223245" }}
            />
            <div className="space-y-3">
              {custody.map((event, i) => (
                <div
                  key={event.id}
                  data-ocid={`custody.item.${i + 1}`}
                  className="flex items-start gap-3"
                >
                  <div
                    className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      backgroundColor: "#0B0F14",
                      border: `1.5px solid ${eventTypeColor(event.eventType)}`,
                      color: eventTypeColor(event.eventType),
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[12px] font-medium"
                      style={{ color: "#E8EEF6" }}
                    >
                      {eventTypeLabel(event.eventType)}
                    </div>
                    <div className="text-[11px]" style={{ color: "#8FA2B8" }}>
                      {event.location}
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: "#223245" }}
                    >
                      {tsToDate(event.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
