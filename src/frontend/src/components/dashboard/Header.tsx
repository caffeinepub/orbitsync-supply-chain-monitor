import { Input } from "@/components/ui/input";
import { Bell, Calendar, Menu, Search } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  alertCount: number;
}

export function Header({ onMenuClick, alertCount }: HeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 border-b flex-shrink-0"
      style={{ backgroundColor: "#0B0F14", borderColor: "#223245" }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="header.menu.toggle"
          className="lg:hidden text-[#8FA2B8] hover:text-[#E8EEF6]"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <div>
          <h1
            className="text-[18px] font-semibold"
            style={{ color: "#E8EEF6" }}
          >
            Global Asset Monitoring
          </h1>
          <p className="text-[11px]" style={{ color: "#8FA2B8" }}>
            Real-time satellite supply chain visibility
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#8FA2B8" }}
          />
          <Input
            data-ocid="header.search_input"
            placeholder="Search container #…"
            className="pl-8 h-8 w-48 text-[12px] border-0"
            style={{
              backgroundColor: "#141E2A",
              color: "#E8EEF6",
              border: "1px solid #1F2B3A",
            }}
          />
        </div>

        <div className="relative">
          <button
            type="button"
            data-ocid="header.notifications.button"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "#8FA2B8" }}
          >
            <Bell size={16} />
          </button>
          {alertCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "#EF4444", color: "#fff" }}
            >
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </div>

        <div
          className="hidden md:flex items-center gap-1.5 text-[11px]"
          style={{ color: "#8FA2B8" }}
        >
          <Calendar size={12} />
          {today}
        </div>
      </div>
    </header>
  );
}
