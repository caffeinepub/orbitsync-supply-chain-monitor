import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Telemetry } from "./backend.d";
import { AlertsTable } from "./components/dashboard/AlertsTable";
import { AssetDetails } from "./components/dashboard/AssetDetails";
import { AssetList } from "./components/dashboard/AssetList";
import { DeviceConfigPage } from "./components/dashboard/DeviceConfigPage";
import { Header } from "./components/dashboard/Header";
import { KPICards } from "./components/dashboard/KPICards";
import { Sidebar } from "./components/dashboard/Sidebar";
import { WorldMap } from "./components/dashboard/WorldMap";
import { useActor } from "./hooks/useActor";
import {
  useCustodyChain,
  useETA,
  useLatestTelemetry,
  useResolveAlert,
  useSeedAndListAssets,
  useTelemetryHistory,
  useUnresolvedAlerts,
} from "./hooks/useQueries";

const SKELETON_KPI = ["k1", "k2", "k3", "k4"];
const SKELETON_ASSETS = ["s1", "s2", "s3", "s4", "s5"];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "deviceConfig">(
    "dashboard",
  );

  const { actor } = useActor();

  const { data: assets = [], isLoading: assetsLoading } =
    useSeedAndListAssets();
  const { data: alerts = [] } = useUnresolvedAlerts();
  const { data: telemetry, isLoading: telLoading } =
    useLatestTelemetry(selectedAssetId);
  const { data: history } = useTelemetryHistory(selectedAssetId);
  const { data: custody = [] } = useCustodyChain(selectedAssetId);
  const { data: eta } = useETA(selectedAssetId);
  const resolveAlert = useResolveAlert();

  useEffect(() => {
    if (assets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(assets[0].id);
    }
  }, [assets, selectedAssetId]);

  useEffect(() => {
    if (alerts.length > 0) {
      const key = `notified-${alerts[0]?.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        toast.warning(
          `${alerts.length} unresolved alert${alerts.length > 1 ? "s" : ""} detected`,
          {
            style: {
              backgroundColor: "#141E2A",
              border: "1px solid #F59E0B",
              color: "#F59E0B",
            },
          },
        );
      }
    }
  }, [alerts]);

  const handleNavSelect = (label: string) => {
    if (label === "Device Config") {
      setCurrentView("deviceConfig");
    } else if (label === "Dashboard") {
      setCurrentView("dashboard");
    }
    // Other nav items keep current view or could be expanded later
  };

  const telemetryMap: Record<string, Telemetry> = {};
  if (telemetry && selectedAssetId) {
    telemetryMap[selectedAssetId] = telemetry;
  }

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) ?? null;

  const handleResolve = (alertId: string) => {
    resolveAlert.mutate(alertId, {
      onSuccess: () => toast.success("Alert resolved"),
      onError: () => toast.error("Failed to resolve alert"),
    });
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#0B0F14" }}
    >
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onNavSelect={handleNavSelect}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          alertCount={alerts.length}
        />

        {currentView === "deviceConfig" ? (
          <DeviceConfigPage actor={actor} />
        ) : (
          <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-5">
            <div
              className="text-[12px] uppercase tracking-widest font-semibold mb-4"
              style={{ color: "#8FA2B8" }}
            >
              Active Assets Overview
            </div>

            {/* 3-column layout */}
            <div className="flex gap-4 mb-4" style={{ minHeight: "520px" }}>
              {/* Left: KPI + Asset list */}
              <div className="hidden lg:flex flex-col gap-4 w-[300px] flex-shrink-0">
                {assetsLoading ? (
                  <div
                    data-ocid="kpi.loading_state"
                    className="grid grid-cols-2 gap-3"
                  >
                    {SKELETON_KPI.map((k) => (
                      <Skeleton
                        key={k}
                        className="h-20 rounded-xl"
                        style={{ backgroundColor: "#141E2A" }}
                      />
                    ))}
                  </div>
                ) : (
                  <KPICards assets={assets} alerts={alerts} />
                )}

                <div
                  className="flex-1 rounded-xl p-4 overflow-hidden"
                  style={{
                    backgroundColor: "#141E2A",
                    border: "1px solid #1F2B3A",
                  }}
                >
                  {assetsLoading ? (
                    <div data-ocid="assets.loading_state" className="space-y-2">
                      {SKELETON_ASSETS.map((k) => (
                        <Skeleton
                          key={k}
                          className="h-12 rounded-lg"
                          style={{ backgroundColor: "#1F2B3A" }}
                        />
                      ))}
                    </div>
                  ) : (
                    <AssetList
                      assets={assets}
                      selectedId={selectedAssetId}
                      onSelect={setSelectedAssetId}
                    />
                  )}
                </div>
              </div>

              {/* Center: Map */}
              <div className="flex-1 min-w-0" style={{ minHeight: "460px" }}>
                <WorldMap
                  assets={assets}
                  telemetryMap={telemetryMap}
                  selectedId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                />
              </div>

              {/* Right: Asset details */}
              <div className="hidden xl:flex flex-col w-[300px] flex-shrink-0">
                <AssetDetails
                  asset={selectedAsset}
                  telemetry={telemetry}
                  history={history}
                  custody={custody}
                  eta={eta}
                  isLoading={telLoading && !!selectedAssetId}
                />
              </div>
            </div>

            {/* Mobile: asset list + details below map */}
            <div className="lg:hidden space-y-4 mb-4">
              <KPICards assets={assets} alerts={alerts} />
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "#141E2A",
                  border: "1px solid #1F2B3A",
                }}
              >
                <AssetList
                  assets={assets}
                  selectedId={selectedAssetId}
                  onSelect={setSelectedAssetId}
                />
              </div>
              <AssetDetails
                asset={selectedAsset}
                telemetry={telemetry}
                history={history}
                custody={custody}
                eta={eta}
                isLoading={telLoading && !!selectedAssetId}
              />
            </div>

            <AlertsTable
              alerts={alerts}
              onResolve={handleResolve}
              isResolving={resolveAlert.isPending}
            />

            <footer
              className="mt-6 pt-4 border-t flex items-center justify-between"
              style={{ borderColor: "#223245" }}
            >
              <div
                className="flex items-center gap-2 text-[11px]"
                style={{ color: "#8FA2B8" }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#22D3C5" }}
                />
                System Status / Satellite Connection: Strong
              </div>
              <div className="text-[11px]" style={{ color: "#8FA2B8" }}>
                © {new Date().getFullYear()}. Built with ❤ using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "#22D3C5" }}
                >
                  caffeine.ai
                </a>
              </div>
            </footer>
          </main>
        )}
      </div>

      <Toaster />
    </div>
  );
}
