import { cn } from "@/lib/utils";
import { Package, Plane, Ship, Truck } from "lucide-react";
import type { Asset, ETA } from "../../backend.d";
import { AssetStatus } from "../../backend.d";

interface AssetListProps {
  assets: Asset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function statusConfig(status: AssetStatus) {
  switch (status) {
    case AssetStatus.inTransit:
      return {
        label: "ON ROUTE",
        bg: "#0D2E2A",
        color: "#22D3C5",
        dot: "#22D3C5",
      };
    case AssetStatus.onHold:
      return {
        label: "ON HOLD",
        bg: "#2E1F0A",
        color: "#F59E0B",
        dot: "#F59E0B",
      };
    case AssetStatus.alert:
      return {
        label: "ALERT",
        bg: "#2E0A0A",
        color: "#EF4444",
        dot: "#EF4444",
      };
    case AssetStatus.delivered:
      return {
        label: "DELIVERED",
        bg: "#0A2E16",
        color: "#22C55E",
        dot: "#22C55E",
      };
    default:
      return {
        label: "UNKNOWN",
        bg: "#1F2B3A",
        color: "#8FA2B8",
        dot: "#8FA2B8",
      };
  }
}

function assetTypeIcon(type: string) {
  switch (type) {
    case "vessel":
      return <Ship size={14} />;
    case "truck":
      return <Truck size={14} />;
    case "aircraft":
      return <Plane size={14} />;
    default:
      return <Package size={14} />;
  }
}

export function AssetList({ assets, selectedId, onSelect }: AssetListProps) {
  return (
    <div data-ocid="assets.list">
      <div
        className="text-[11px] uppercase tracking-wide font-semibold mb-3"
        style={{ color: "#8FA2B8" }}
      >
        Key High-Value Assets
      </div>
      <div className="space-y-1.5 max-h-[340px] overflow-y-auto scrollbar-thin">
        {assets.length === 0 && (
          <div
            data-ocid="assets.empty_state"
            className="text-[12px] text-center py-6"
            style={{ color: "#8FA2B8" }}
          >
            No assets found
          </div>
        )}
        {assets.map((asset, i) => {
          const sc = statusConfig(asset.status);
          const isSelected = asset.id === selectedId;
          return (
            <button
              type="button"
              key={asset.id}
              data-ocid={`assets.item.${i + 1}`}
              onClick={() => onSelect(asset.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                isSelected ? "" : "hover:bg-white/5",
              )}
              style={{
                backgroundColor: isSelected ? "#1F2B3A" : "transparent",
                border: `1px solid ${isSelected ? "#22D3C5" : "transparent"}`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: sc.dot }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "#8FA2B8" }}>
                    {assetTypeIcon(asset.assetType)}
                  </span>
                  <span
                    className="text-[12px] font-medium truncate"
                    style={{ color: "#E8EEF6" }}
                  >
                    {asset.name}
                  </span>
                </div>
                <div
                  className="text-[11px] truncate mt-0.5"
                  style={{ color: "#8FA2B8" }}
                >
                  {asset.origin} → {asset.destination}
                </div>
              </div>
              <div
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: sc.bg, color: sc.color }}
              >
                {sc.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
