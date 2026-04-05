import { Globe, Map as MapIcon, ZoomIn, ZoomOut } from "lucide-react";
import { Suspense, lazy, useCallback, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps";
import type { Asset, Telemetry } from "../../backend.d";
import { AssetStatus } from "../../backend.d";

const Globe3D = lazy(() =>
  import("./Globe3D").then((m) => ({ default: m.Globe3D })),
);

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const PORT_COORDS: Record<string, [number, number]> = {
  Singapore: [103.8, 1.35],
  Rotterdam: [4.47, 51.91],
  Shanghai: [121.47, 31.23],
  "New York": [-74.0, 40.71],
  Dubai: [55.27, 25.2],
  "Los Angeles": [-118.24, 34.05],
  London: [-0.12, 51.5],
  Tokyo: [139.69, 35.68],
  Mumbai: [72.88, 19.08],
  "Cape Town": [18.42, -33.92],
  Hamburg: [9.99, 53.55],
  "Hong Kong": [114.16, 22.32],
  Sydney: [151.21, -33.87],
  Lagos: [3.39, 6.45],
  "S\u00e3o Paulo": [-46.63, -23.55],
};

function getPortCoords(name: string): [number, number] | null {
  if (PORT_COORDS[name]) return PORT_COORDS[name];
  for (const key of Object.keys(PORT_COORDS)) {
    if (
      name.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(name.toLowerCase())
    ) {
      return PORT_COORDS[key];
    }
  }
  return null;
}

function markerColor(status: AssetStatus): string {
  switch (status) {
    case AssetStatus.alert:
      return "#EF4444";
    case AssetStatus.inTransit:
      return "#22D3C5";
    case AssetStatus.onHold:
      return "#F59E0B";
    case AssetStatus.delivered:
      return "#22C55E";
    default:
      return "#8FA2B8";
  }
}

interface TooltipData {
  asset: Asset;
  telemetry: Telemetry;
  x: number;
  y: number;
}

interface WorldMapProps {
  assets: Asset[];
  telemetryMap: Record<string, Telemetry>;
  selectedId: string | null;
  onSelectAsset: (id: string) => void;
}

export function WorldMap({
  assets,
  telemetryMap,
  selectedId,
  onSelectAsset,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<"2d" | "3d">("2d");

  const handleMarkerClick = useCallback(
    (assetId: string) => {
      onSelectAsset(assetId);
    },
    [onSelectAsset],
  );

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: "#0B0F14", border: "1px solid #1F2B3A" }}
    >
      {/* Title bar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11,15,20,0.98), rgba(11,15,20,0.85))",
          borderBottom: view === "3d" ? "1px solid #1F2B3A" : "none",
        }}
      >
        <div className="text-[13px] font-semibold" style={{ color: "#E8EEF6" }}>
          Live Asset Tracking Map
        </div>
        <div className="flex items-center gap-2">
          {/* 2D/3D toggle */}
          <div
            className="flex items-center rounded-full p-0.5"
            style={{ backgroundColor: "#0B0F14", border: "1px solid #1F2B3A" }}
          >
            <button
              type="button"
              data-ocid="map.2d.toggle"
              onClick={() => setView("2d")}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
              style={{
                backgroundColor: view === "2d" ? "#22D3C5" : "transparent",
                color: view === "2d" ? "#0B0F14" : "#8FA2B8",
              }}
            >
              <MapIcon size={11} />
              2D Map
            </button>
            <button
              type="button"
              data-ocid="map.3d.toggle"
              onClick={() => setView("3d")}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-all"
              style={{
                backgroundColor: view === "3d" ? "#22D3C5" : "transparent",
                color: view === "3d" ? "#0B0F14" : "#8FA2B8",
              }}
            >
              <Globe size={11} />
              3D Globe
            </button>
          </div>

          {/* Zoom controls (2D only) */}
          {view === "2d" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-ocid="map.zoom_in.button"
                onClick={() => setZoom((z) => Math.min(z + 0.3, 3))}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
                style={{
                  backgroundColor: "#141E2A",
                  border: "1px solid #1F2B3A",
                  color: "#8FA2B8",
                }}
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                data-ocid="map.zoom_out.button"
                onClick={() => setZoom((z) => Math.max(z - 0.3, 0.5))}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
                style={{
                  backgroundColor: "#141E2A",
                  border: "1px solid #1F2B3A",
                  color: "#8FA2B8",
                }}
              >
                <ZoomOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map content */}
      <div className="relative flex-1 min-h-0">
        {view === "3d" ? (
          <Suspense
            fallback={
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "#000510" }}
                data-ocid="map.loading_state"
              >
                <div className="text-[13px]" style={{ color: "#22D3C5" }}>
                  Loading 3D Globe\u2026
                </div>
              </div>
            }
          >
            <Globe3D
              assets={assets}
              telemetryMap={telemetryMap}
              selectedId={selectedId}
              onSelectAsset={onSelectAsset}
            />
          </Suspense>
        ) : (
          <>
            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: "100%", height: "100%" }}
              projectionConfig={{ scale: 140 * zoom }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#141E2A"
                      stroke="#223245"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#1F2B3A", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {assets.map((asset) => {
                const telemetry = telemetryMap[asset.id];
                if (!telemetry) return null;
                const current: [number, number] = [
                  telemetry.longitude,
                  telemetry.latitude,
                ];
                const originCoords = getPortCoords(asset.origin);
                const destCoords = getPortCoords(asset.destination);

                return (
                  <g key={`route-${asset.id}`}>
                    {originCoords && (
                      <Line
                        from={originCoords}
                        to={current}
                        stroke="#2F8CFF"
                        strokeWidth={1.5}
                        strokeOpacity={0.6}
                        strokeDasharray="4 3"
                      />
                    )}
                    {destCoords && (
                      <Line
                        from={current}
                        to={destCoords}
                        stroke="#2F8CFF"
                        strokeWidth={1}
                        strokeOpacity={0.3}
                        strokeDasharray="4 3"
                      />
                    )}
                  </g>
                );
              })}

              {assets.map((asset) => {
                const telemetry = telemetryMap[asset.id];
                if (!telemetry) return null;
                const color = markerColor(asset.status);
                const isSelected = asset.id === selectedId;

                return (
                  <Marker
                    key={asset.id}
                    coordinates={[telemetry.longitude, telemetry.latitude]}
                    onClick={() => handleMarkerClick(asset.id)}
                    onMouseEnter={(e: React.MouseEvent) => {
                      const rect = (e.target as Element)
                        .closest("svg")
                        ?.getBoundingClientRect();
                      setTooltip({
                        asset,
                        telemetry,
                        x: e.clientX - (rect?.left ?? 0),
                        y: e.clientY - (rect?.top ?? 0),
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {asset.status === AssetStatus.inTransit && (
                      <circle
                        r={8}
                        fill={color}
                        fillOpacity={0.15}
                        className="asset-marker-pulse"
                      />
                    )}
                    <circle
                      r={isSelected ? 6 : 4.5}
                      fill={color}
                      stroke={isSelected ? "#fff" : "transparent"}
                      strokeWidth={1.5}
                    />
                  </Marker>
                );
              })}
            </ComposableMap>

            {tooltip && (
              <div
                className="absolute z-20 pointer-events-none rounded-lg px-3 py-2.5"
                style={{
                  left: tooltip.x + 12,
                  top: tooltip.y - 60,
                  backgroundColor: "#141E2A",
                  border: "1px solid #1F2B3A",
                  maxWidth: 220,
                }}
              >
                <div
                  className="text-[12px] font-semibold"
                  style={{ color: "#E8EEF6" }}
                >
                  {tooltip.asset.name}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "#8FA2B8" }}
                >
                  {tooltip.asset.origin} \u2192 {tooltip.asset.destination}
                </div>
                <div className="text-[11px] mt-1" style={{ color: "#22D3C5" }}>
                  {tooltip.telemetry.latitude.toFixed(2)}\u00b0,{" "}
                  {tooltip.telemetry.longitude.toFixed(2)}\u00b0
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
