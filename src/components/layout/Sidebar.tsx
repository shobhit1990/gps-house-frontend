import { useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Car,
  ChevronDown,
  ChevronRight,
  Contact,
  Database,
  Home,
  LogOut,
  MoonStar,
  MoreHorizontal,
  Navigation,
  Settings,
  SunMedium,
  Video,
  type LucideIcon,
} from "lucide-react";

type NavChild = string | { label: string; children: string[] };
type NavMenu = { label: string; icon: LucideIcon; to?: string; children: NavChild[] };

const navMenus: NavMenu[] = [
  { label: "Home", icon: Home, children: ["Dashboard", "Advance Dashboard", "Analytics Dashboard"] },
  { label: "Master", icon: Database, children: ["Owners"] },
  { label: "Vehicles", icon: Car, children: ["Vehicles", "Devices", "Transporter", { label: "Manage Technician", children: ["Technician List", "JobSheet"] }, "Client", { label: "User Groups", children: ["User", "Group"] }, "Vehicle Detail", "Driver Detail", "Geofence", "Payment Detail", "Enquiry", "Device Inventory"] },
  { label: "Reports", icon: BarChart3, children: ["Coin Banking", "Distance Report", "Driver Assignment Report", "Expense Report", "Geofence Report", "Google Map Api Record", "Idle Summary Report", "POI Report", "Register Mobile Report", "Ride Report", "Send Command Logs", "Sensor Report", "Sim Tracking Report", "Speed vs Distance", "Status Report", "Stoppage Summary Report", "Subscription Changed Report", "Subscription Expired Report", "Travel Summary Report", "Vehicle Log Report"] },
  { label: "Alerts", icon: Bell, children: ["Add Alerts", "Notification List", "Service & Maintenance", "Parked Scheduler", "Announcement"] },
  { label: "Settings", icon: Settings, to: "/settings", children: [] },
  { label: "Support", icon: Video, children: [ "Raise Ticket", "Answer Tickets"] },
  { label: "Access Management", icon: Contact, children: ["Access Management"] },
];

/** Route for each leaf menu entry, keyed by its path of labels ("Menu/Child" or "Menu/Child/SubChild"). */
const menuRoutes: Record<string, string> = {
  "Home/Dashboard": "/dashboard",
  "Master/Owners": "/owners",
  "Vehicles/Vehicles": "/vehicles",
  "Vehicles/Devices": "/devices",
  "Vehicles/Transporter": "/transporters",
  "Vehicles/Manage Technician/Technician List": "/technician-list",
  "Vehicles/Manage Technician/JobSheet": "/job-sheet",
  "Vehicles/Client": "/clients",
  "Vehicles/User Groups/User": "/users",
  "Vehicles/User Groups/Group": "/groups",
  "Vehicles/Vehicle Detail": "/vehicle-details",
  "Vehicles/Driver Detail": "/driver-details",
  "Vehicles/Geofence": "/geofence",
  "Vehicles/Payment Detail": "/payment",
  "Vehicles/Enquiry": "/enquiry",
  "Vehicles/Device Inventory": "/device-inventory",
  "Reports/Coin Banking": "/coin-banking",
  "Reports/Distance Report": "/distance-report",
  "Reports/Driver Assignment Report": "/driver-assignment-report",
  "Reports/Expense Report": "/expense-report",
  "Reports/Geofence Report": "/geofence-report",
  "Reports/Idle Summary Report": "/idle-summary-report",
  "Reports/POI Report": "/poi-report",
  "Reports/Register Mobile Report": "/register-mobile-report",
  "Reports/Ride Report": "/ride-report",
  "Reports/Send Command Logs": "/send-command-logs",
  "Reports/Sensor Report": "/sensor-report",
  "Reports/Sim Tracking Report": "/sim-tracking-report",
  "Reports/Speed vs Distance": "/speed-vs-distance",
  "Reports/Status Report": "/status-report",
  "Reports/Stoppage Summary Report": "/stoppage-summary-report",
  "Reports/Subscription Changed Report": "/subscription-changed-report",
  "Reports/Subscription Expired Report": "/subscription-expired-report",
  "Reports/Travel Summary Report": "/travel-summary-report",
  "Reports/Vehicle Log Report": "/vehicle-log-report",
  "Alerts/Add Alerts": "/add-alerts",
  "Alerts/Notification List": "/notification-list",
  "Alerts/Service & Maintenance": "/service-maintenance",
  "Alerts/Parked Scheduler": "/parked-scheduler",
  "Alerts/Announcement": "/announcement",
  "Support/Raise Ticket": "/raise-ticket",
  "Support/Answer Tickets": "/answer-tickets",
};

const routeFor = (...labels: string[]) => menuRoutes[labels.join("/")];

/** True when the current page belongs to this top-level menu. */
const menuContainsPath = (menu: NavMenu, pathname: string) =>
  menu.to === pathname ||
  Object.entries(menuRoutes).some(([key, route]) => route === pathname && key.startsWith(`${menu.label}/`));

const MORE_MENU = "__more__";
const NAV_GAP = 4; // matches gap-1 on the menu lists

const topButtonClass = (highlighted: boolean) =>
  `flex h-10 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 text-xs font-medium transition sm:px-3 ${
    highlighted
      ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-300/[0.09] dark:text-cyan-100"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
  }`;

const dropdownItemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-slate-600 transition hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-cyan-300/[0.08] dark:hover:text-cyan-100";

function TopButtonContent({ item }: { item: NavMenu }) {
  const Icon = item.icon;
  return (
    <>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
      <span>{item.label}</span>
      {item.children.length > 0 && <ChevronDown className="h-3 w-3 text-slate-500" />}
    </>
  );
}

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<{ label: string; top: number } | null>(null);
  const submenuListRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const navRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const [visibleCount, setVisibleCount] = useState(navMenus.length);

  // Show as many top-level menus as fit on one line; the rest go into the "More" menu.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const measure = measureRef.current;
    if (!nav || !measure) return;

    const calculate = () => {
      const available = nav.clientWidth;
      const items = Array.from(measure.children) as HTMLElement[];
      const moreWidth = items[items.length - 1].offsetWidth;
      const widths = items.slice(0, -1).map((element) => element.offsetWidth);
      const totalWidth = widths.reduce((sum, width) => sum + width, 0) + NAV_GAP * (widths.length - 1);
      if (totalWidth <= available) {
        setVisibleCount(widths.length);
        return;
      }
      let used = moreWidth;
      let count = 0;
      for (const width of widths) {
        if (used + NAV_GAP + width > available) break;
        used += NAV_GAP + width;
        count += 1;
      }
      setVisibleCount(count);
    };

    calculate();
    const observer = new ResizeObserver(calculate);
    observer.observe(nav);
    observer.observe(measure);
    return () => observer.disconnect();
  }, []);

  const visibleMenus = navMenus.slice(0, visibleCount);
  const overflowMenus = navMenus.slice(visibleCount);
  const isMoreOpen = activeMenu === MORE_MENU;
  const isMoreActive = overflowMenus.some((menu) => menuContainsPath(menu, location.pathname));

  const goTo = (route?: string) => {
    if (!route) return;
    navigate(route);
    setActiveMenu(null);
    setActiveSubMenu(null);
  };

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

        <nav ref={navRef} aria-label="Main navigation" className="relative min-w-0 flex-1">
          {/* Off-screen copy of every menu button, used only to measure widths. */}
          <ul ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 flex gap-1">
            {navMenus.map((item) => (
              <li key={item.label} className="shrink-0">
                <span className={topButtonClass(false)}>
                  <TopButtonContent item={item} />
                </span>
              </li>
            ))}
            <li className="shrink-0">
              <span className={topButtonClass(false)}>
                <MoreHorizontal className="h-4 w-4 shrink-0" />
                <span>More</span>
                <ChevronDown className="h-3 w-3" />
              </span>
            </li>
          </ul>

          <ul className="flex flex-nowrap items-center gap-1">
            {visibleMenus.map((item) => {
              const hasDropdown = item.children.length > 0;
              const isActive = menuContainsPath(item, location.pathname);
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
                      if (item.to) {
                        goTo(item.to);
                        return;
                      }
                      setActiveMenu(isOpen ? null : item.label);
                      setActiveSubMenu(null);
                    }}
                    className={topButtonClass(isOpen || isActive)}
                  >
                    <TopButtonContent item={item} />
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
                                  } else {
                                    goTo(routeFor(item.label, childLabel));
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
                                  onClick={() => goTo(routeFor(item.label, activeChild.label, subChild))}
                                  className={dropdownItemClass}
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

            {overflowMenus.length > 0 && (
              <li
                className={`relative shrink-0 ${isMoreOpen ? "z-[700]" : "z-0"}`}
                onMouseEnter={() => {
                  setActiveMenu(MORE_MENU);
                  setActiveSubMenu(null);
                }}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isMoreOpen}
                  onClick={() => setActiveMenu(isMoreOpen ? null : MORE_MENU)}
                  className={topButtonClass(isMoreOpen || isMoreActive)}
                >
                  <MoreHorizontal className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                  <span>More</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>

                {isMoreOpen && (
                  <div className="absolute left-0 top-full z-[710] w-[240px] pt-2">
                    <div role="menu" className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.10] dark:bg-[#0a1630] dark:shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
                      {overflowMenus.map((menu) => {
                        const Icon = menu.icon;
                        if (menu.to) {
                          return (
                            <button key={menu.label} type="button" role="menuitem" onClick={() => goTo(menu.to)} className={`${dropdownItemClass} font-semibold`}>
                              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                              {menu.label}
                            </button>
                          );
                        }
                        return (
                          <div key={menu.label} role="group" aria-label={menu.label} className="border-t border-slate-100 pt-1 first:border-t-0 first:pt-0 dark:border-white/[0.06]">
                            <p className="flex items-center gap-2 px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                              {menu.label}
                            </p>
                            {menu.children.map((child) =>
                              typeof child === "string" ? (
                                <button key={child} type="button" role="menuitem" onClick={() => goTo(routeFor(menu.label, child))} className={dropdownItemClass}>
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/65" />
                                  {child}
                                </button>
                              ) : (
                                <div key={child.label}>
                                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">{child.label}</p>
                                  {child.children.map((subChild) => (
                                    <button key={subChild} type="button" role="menuitem" onClick={() => goTo(routeFor(menu.label, child.label, subChild))} className={`${dropdownItemClass} pl-6`}>
                                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                                      {subChild}
                                    </button>
                                  ))}
                                </div>
                              ),
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>
            )}
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