import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart2,
  Cpu,
  HelpCircle,
  LayoutDashboard,
  Package,
  Satellite,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { icon: <Package size={18} />, label: "Assets" },
  { icon: <AlertTriangle size={18} />, label: "Alerts" },
  { icon: <Cpu size={18} />, label: "Device Config" },
  { icon: <BarChart2 size={18} />, label: "Reports" },
  { icon: <Settings size={18} />, label: "Settings" },
  { icon: <HelpCircle size={18} />, label: "Support" },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onNavSelect?: (label: string) => void;
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
  onNavSelect,
}: SidebarProps) {
  const [active, setActive] = useState("Dashboard");

  const content = (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#101A24" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "#223245" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#22D3C5" }}
          >
            <Satellite size={16} color="#0B0F14" />
          </div>
          <div>
            <div
              className="text-[13px] font-semibold leading-tight"
              style={{ color: "#E8EEF6" }}
            >
              OrbitSync
            </div>
            <div className="text-[10px]" style={{ color: "#8FA2B8" }}>
              Supply Chain
            </div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "#223245" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold"
            style={{ backgroundColor: "#1F2B3A", color: "#22D3C5" }}
          >
            OP
          </div>
          <div>
            <div
              className="text-[12px] font-medium"
              style={{ color: "#E8EEF6" }}
            >
              Ops Director
            </div>
            <div className="text-[11px]" style={{ color: "#8FA2B8" }}>
              Global Operations
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
            onClick={() => {
              setActive(item.label);
              onNavSelect?.(item.label);
              onMobileClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
              active === item.label
                ? "text-[#E8EEF6]"
                : "text-[#8FA2B8] hover:text-[#E8EEF6] hover:bg-white/5",
            )}
            style={
              active === item.label
                ? { backgroundColor: "#1F2B3A", color: "#22D3C5" }
                : {}
            }
          >
            <span style={active === item.label ? { color: "#22D3C5" } : {}}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer status */}
      <div className="px-5 py-4 border-t" style={{ borderColor: "#223245" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "#22D3C5" }}
          />
          <span className="text-[11px]" style={{ color: "#8FA2B8" }}>
            Satellite: Strong
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-screen sticky top-0 border-r"
        style={{ borderColor: "#223245" }}
      >
        {content}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            role="button"
            tabIndex={0}
            aria-label="Close menu"
            onClick={onMobileClose}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onMobileClose();
            }}
          />
          <aside className="relative w-[240px] h-full flex flex-col">
            <button
              type="button"
              className="absolute top-3 right-3 text-[#8FA2B8] hover:text-[#E8EEF6]"
              onClick={onMobileClose}
            >
              <X size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
