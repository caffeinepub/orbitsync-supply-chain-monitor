import type { Alert, Asset } from "../../backend.d";
import { AssetStatus } from "../../backend.d";

interface KPICardsProps {
  assets: Asset[];
  alerts: Alert[];
}

interface KPICardData {
  label: string;
  value: number;
  delta?: string;
  color: string;
}

export function KPICards({ assets, alerts }: KPICardsProps) {
  const transit = assets.filter(
    (a) => a.status === AssetStatus.inTransit,
  ).length;
  const alarms = assets.filter((a) => a.status === AssetStatus.alert).length;
  const onHold = assets.filter((a) => a.status === AssetStatus.onHold).length;

  const cards: KPICardData[] = [
    {
      label: "Total Assets",
      value: assets.length,
      delta: "+12%",
      color: "#22D3C5",
    },
    { label: "In Transit", value: transit, delta: "+5%", color: "#2F8CFF" },
    {
      label: "Active Alarms",
      value: alarms,
      delta: alarms > 0 ? `${alerts.length} alerts` : "0 alerts",
      color: "#EF4444",
    },
    { label: "On Hold", value: onHold, delta: "0%", color: "#F59E0B" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <div
          key={card.label}
          data-ocid={`kpi.card.${i + 1}`}
          className="rounded-xl p-4"
          style={{ backgroundColor: "#141E2A", border: "1px solid #1F2B3A" }}
        >
          <div
            className="text-[11px] uppercase tracking-wide font-medium mb-2"
            style={{ color: "#8FA2B8" }}
          >
            {card.label}
          </div>
          <div
            className="text-[30px] font-bold leading-none"
            style={{ color: card.color }}
          >
            {card.value}
          </div>
          {card.delta && (
            <div
              className="text-[11px] mt-1"
              style={{
                color:
                  card.color === "#EF4444" && card.value > 0
                    ? "#EF4444"
                    : "#22C55E",
              }}
            >
              {card.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
