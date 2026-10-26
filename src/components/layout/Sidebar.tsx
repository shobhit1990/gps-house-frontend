import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Car,
  ChevronDown,
  ChevronRight,
  Contact,
  Home,
  LogOut,
  MoonStar,
  Navigation,
  Settings,
  SunMedium,
  Video,
} from "lucide-react";

const navMenus = [
  { label: "Home", icon: Home, children: ["Dashboard", "Advance Dashboard", "Analytics Dashboard"] },
  { label: "Vehicles", icon: Car, children: ["Vehicles", "Devices", "Transporter", { label: "Manage Technician", children: ["Technician List", "JobSheet"] }, "Client", { label: "User Groups", children: ["User", "Group"] }, "Vehicle Detail", "Driver Detail", "Geofence", "Payment Detail", "Enquiry", "Device Inventory"] },
  { label: "Reports", icon: BarChart3, children: ["Coin Banking", "Distance Report", "Driver Assignment Report", "Expense Report", "Geofence Report", "Google Map Api Record", "Idle Summary Report", "POI Report", "Register Mobile Report", "Ride Report", "Send Command Logs", "Sensor Report", "Sim Tracking Report", "Speed vs Distance", "Status Report", "Stoppage Summary Report", "Subscription Changed Report", "Subscription Expired Report", "Travel Summary Report", "Vehicle Log Report"] },
  { label: "Alerts", icon: Bell, children: ["Add Alerts", "Notification List", "Service & Maintenance", "Parked Scheduler", "Announcement"] },
  { label: "Settings", icon: Settings, to: "/settings", children: [] },
  { label: "Support", icon: Video, children: [ "Raise Ticket", "Answer Tickets"] },
  { label: "Access Management", icon: Contact, children: ["Access Management"] },
] as const;

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<{ label: string; top: number } | null>(null);
  const submenuListRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-[600] border-b border-slate-200/80 bg-white/80 px-4 shadow-[0_2px_18px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#050d22]/95 dark:shadow-none sm:px-6 lg:px-7">
      <div className="mx-auto flex min-h-[76px] max-w-[1900px] items-center gap-4">
        <a href="#overview" className="flex shrink-0 items-center gap-2.5" aria-label="GPS Fleet home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 text-cyan-700 dark:border-cyan-300/20 dark:bg-gradient-to-br dark:from-cyan-300/15 dark:to-violet-400/15 dark:text-cyan-100">
            <Navigation className="h-4 w-4" />
          </span>
          <span className="hidden items-center gap-2.5 lg:flex">
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">GPS</span>
          </span>
        </a>

        <nav aria-label="Main navigation" className="min-w-0 flex-1">
          <ul className="flex flex-wrap items-center gap-1">
            {navMenus.map((item) => {
              const Icon = item.icon;
              const hasDropdown = item.children.length > 0;
              const isActive = "to" in item && location.pathname === item.to;
              const isOpen = hasDropdown && activeMenu === item.label;
              const activeChild = item.children.find(
                (child) => typeof child !== "string" && child.label === activeSubMenu?.label,
              );

              const showSubMenu = (label: string, button: HTMLButtonElement) => {
                const listTop = submenuListRef.current?.getBoundingClientRect().top ?? 0;
                const buttonTop = button.getBoundingClientRect().top;
                setActiveSubMenu({ label, top: buttonTop - listTop });
              };

              return (
                <li
                  key={item.label}
                  className={`relative shrink-0 ${isOpen ? "z-[700]" : "z-0"}`}
                  onMouseEnter={() => {
                    if (!hasDropdown) return;
                    setActiveMenu(item.label);
                    setActiveSubMenu(null);
                  }}
                  onMouseLeave={() => {
                    setActiveMenu(null);
                    setActiveSubMenu(null);
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={hasDropdown ? isOpen : undefined}
                    aria-haspopup={hasDropdown ? "menu" : undefined}
                    onClick={() => {
                      if ("to" in item && item.to) {
                        navigate(item.to);
                        setActiveMenu(null);
                        setActiveSubMenu(null);
                        return;
                      }
                      setActiveMenu(isOpen ? null : item.label);
                      setActiveSubMenu(null);
                    }}
                    className={`flex h-10 items-center gap-2 rounded-lg px-2.5 text-xs font-medium transition sm:px-3 ${
                      isOpen || isActive
                        ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-300/[0.09] dark:text-cyan-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                    <span>{item.label}</span>
                    {hasDropdown && <ChevronDown className="h-3 w-3 text-slate-500" />}
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 top-full z-[710] min-w-[210px] pt-2">
                      <div className="relative">
                        <div ref={submenuListRef} className="max-h-[180px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.10] dark:bg-[#0a1630] dark:shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
                          {item.children.map((child) => {
                            const childLabel = typeof child === "string" ? child : child.label;
                            const hasChildren = typeof child !== "string" && child.children.length > 0;
                            const isSubMenuOpen = activeSubMenu?.label === childLabel;

                            return (
                              <button
                                key={childLabel}
                                type="button"
                                aria-haspopup={hasChildren ? "menu" : undefined}
                                aria-expanded={hasChildren ? isSubMenuOpen : undefined}
                                onMouseEnter={(event) => {
                                  if (hasChildren) {
                                    showSubMenu(childLabel, event.currentTarget);
                                  } else {
                                    setActiveSubMenu(null);
                                  }
                                }}
                                onClick={(event) => {
                                  if (hasChildren) {
                                    if (isSubMenuOpen) {
                                      setActiveSubMenu(null);
                                    } else {
                                      showSubMenu(childLabel, event.currentTarget);
                                    }
                                  } else if (item.label === "Home" && childLabel === "Dashboard") {
                                    navigate("/dashboard");
                                    setActiveMenu(null);
                                  } 
                                  else if (item.label === "Vehicles" && childLabel === "Vehicles") {
                                    navigate("/vehicles");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Devices") {
                                    navigate("/devices");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Transporter") {
                                    navigate("/transporters");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Client") {
                                    navigate("/clients");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Vehicle Detail") {
                                    navigate("/vehicle-details");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Driver Detail") {
                                    navigate("/driver-details");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Geofence") {
                                    navigate("/geofence");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Payment Detail") {
                                    navigate("/payment");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Enquiry") {
                                    navigate("/enquiry");
                                    setActiveMenu(null);
                                  } else if (item.label === "Vehicles" && childLabel === "Device Inventory") {
                                    navigate("/device-inventory");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Coin Banking") {
                                    navigate("/coin-banking");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Driver Assignment Report") {
                                    navigate("/driver-assignment-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Expense Report") {
                                    navigate("/expense-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Geofence Report") {
                                    navigate("/geofence-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Idle Summary Report") {
                                    navigate("/idle-summary-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "POI Report") {
                                    navigate("/poi-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Register Mobile Report") {
                                    navigate("/register-mobile-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Ride Report") {
                                    navigate("/ride-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Send Command Logs") {
                                    navigate("/send-command-logs");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Sensor Report") {
                                    navigate("/sensor-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Sim Tracking Report") {
                                    navigate("/sim-tracking-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Speed vs Distance") {
                                    navigate("/speed-vs-distance");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Distance Report") {
                                    navigate("/distance-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Status Report") {
                                    navigate("/status-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Stoppage Summary Report") {
                                    navigate("/stoppage-summary-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Subscription Changed Report") {
                                    navigate("/subscription-changed-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Subscription Expired Report") {
                                    navigate("/subscription-expired-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Travel Summary Report") {
                                    navigate("/travel-summary-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Reports" && childLabel === "Vehicle Log Report") {
                                    navigate("/vehicle-log-report");
                                    setActiveMenu(null);
                                  } else if (item.label === "Alerts" && childLabel === "Add Alerts") {
                                    navigate("/add-alerts");
                                    setActiveMenu(null);
                                  }
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                                  isSubMenuOpen
                                    ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-300/[0.08] dark:text-cyan-100"
                                    : "text-slate-600 hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-cyan-300/[0.08] dark:hover:text-cyan-100"
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/65" />
                                <span className="flex-1">{childLabel}</span>
                                {hasChildren && <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                              </button>
                            );
                          })}
                        </div>

                        {activeChild && typeof activeChild !== "string" && (
                          <div style={{ top: activeSubMenu?.top ?? 0 }} className="absolute left-full z-[720] min-w-[190px] pl-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.10] dark:bg-[#0a1630] dark:shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
                              {activeChild.children.map((subChild) => (
                                <button
                                  key={subChild}
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    if (item.label === "Vehicles" && activeChild.label === "Manage Technician" && subChild === "Technician List") {
                                      navigate("/technician-list");
                                      setActiveMenu(null);
                                      setActiveSubMenu(null);
                                    } else if (item.label === "Vehicles" && activeChild.label === "Manage Technician" && subChild === "JobSheet") {
                                      navigate("/job-sheet");
                                      setActiveMenu(null);
                                      setActiveSubMenu(null);
                                    } else if (item.label === "Vehicles" && activeChild.label === "User Groups" && subChild === "User") {
                                      navigate("/users");
                                      setActiveMenu(null);
                                      setActiveSubMenu(null);
                                    } else if (item.label === "Vehicles" && activeChild.label === "User Groups" && subChild === "Group") {
                                      navigate("/groups");
                                      setActiveMenu(null);
                                      setActiveSubMenu(null);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-slate-600 transition hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-cyan-300/[0.08] dark:hover:text-cyan-100"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                                  {subChild}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 px-3 py-1.5 text-[10px] font-medium text-cyan-700 dark:border-cyan-300/15 dark:from-cyan-300/[0.08] dark:to-violet-400/[0.08] dark:text-cyan-100 xl:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_9px_rgba(34,211,238,0.7)] dark:bg-cyan-300 dark:shadow-[0_0_9px_rgba(103,232,249,0.8)]" />
            Monitoring workspace
          </span>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-slate-400 dark:hover:border-cyan-200/20 dark:hover:bg-cyan-200/[0.06] dark:hover:text-cyan-100"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.7)] dark:bg-violet-300 dark:shadow-[0_0_8px_rgba(196,181,253,0.7)]" />
          </button>
          <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-slate-300 dark:hover:border-cyan-200/20 dark:hover:bg-cyan-200/[0.06] dark:hover:text-cyan-100"
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-slate-300 dark:hover:border-rose-300/20 dark:hover:bg-rose-300/[0.07] dark:hover:text-rose-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}