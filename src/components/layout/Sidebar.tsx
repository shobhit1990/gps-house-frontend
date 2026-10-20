import { NavLink } from "react-router-dom";
import { LayoutDashboard, MapPin, History, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ENV } from "@/config/env";

interface SidebarProps {
  userRole: string;
  isMobile: boolean;
  showMobileSidebar: boolean;
  setShowMobileSidebar: (show: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const navItems = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { label: "Live Tracking", url: "/live-tracking", icon: MapPin },
  { label: "History", url: "/history-tracking", icon: History },
  { label: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar({
  isMobile,
  showMobileSidebar,
  setShowMobileSidebar,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-[60] flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        isMobile && (showMobileSidebar ? "translate-x-0" : "-translate-x-full")
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <span className="text-lg font-bold text-primary">{ENV.APP_NAME}</span>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            onClick={() => isMobile && setShowMobileSidebar(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
