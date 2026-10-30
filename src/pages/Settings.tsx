import { useState } from "react";
import { useTheme } from "next-themes";
import {
  BadgeCheck,
  Car,
  Gauge,
  Monitor,
  Palette,
  SlidersHorizontal,
  TextCursorInput,
  UserRound,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { AppearancePanel } from "./settings/AppearancePanel";
import { CertificatePanel } from "./settings/CertificatePanel";
import { CustomFieldsPanel } from "./settings/CustomFieldsPanel";
import { GeneralPanel } from "./settings/GeneralPanel";
import { ProfilePanel } from "./settings/ProfilePanel";
import { SettingsProvider, useSettings } from "./settings/SettingsState";
import { activeChipClass, panelCardClass, primaryButtonClass } from "./settings/ui";
import { VehicleConfigPanel } from "./settings/VehicleConfigPanel";

type Section = { id: string; label: string; hint: string; icon: LucideIcon };
type Tab = { id: string; label: string; icon: LucideIcon; sections: Section[] };

const tabs: Tab[] = [
  {
    id: "general",
    label: "General",
    icon: SlidersHorizontal,
    sections: [
      { id: "landing", label: "Landing page", hint: "First screen after login", icon: Monitor },
      { id: "exchange", label: "File exchange", hint: "Vehicle, POI, payment, billing", icon: ArrowLeftRight },
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    sections: [{ id: "theme", label: "Theme", hint: "Domain, charts and colors", icon: Palette }],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    icon: Car,
    sections: [{ id: "distance", label: "Distance and lock", hint: "Transporter variation", icon: Gauge }],
  },
  {
    id: "profile",
    label: "Profile",
    icon: UserRound,
    sections: [
      { id: "account", label: "My profile", hint: "Contact and billing", icon: UserRound },
      { id: "preferences", label: "Preferences", hint: "Units, fuel and dates", icon: SlidersHorizontal },
    ],
  },
  {
    id: "certificates",
    label: "Certificates",
    icon: BadgeCheck,
    sections: [
      { id: "list", label: "Registry", hint: "Issued certificates", icon: BadgeCheck },
      { id: "form", label: "Add certificate", hint: "Fitment, invoice and KYC", icon: TextCursorInput },
    ],
  },
  {
    id: "fields",
    label: "Custom fields",
    icon: TextCursorInput,
    sections: [
      { id: "list", label: "All fields", hint: "Fields already created", icon: TextCursorInput },
      { id: "form", label: "New field", hint: "Add a field for a client", icon: SlidersHorizontal },
    ],
  },
];

function SettingsWorkspace() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const { dirty, save } = useSettings();
  const [tabId, setTabId] = useState(tabs[0].id);
  const [sectionId, setSectionId] = useState(tabs[0].sections[0].id);
  const tab = tabs.find((item) => item.id === tabId) ?? tabs[0];

  const selectTab = (next: Tab) => {
    setTabId(next.id);
    setSectionId(next.sections[0].id);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
        <div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
      </div>
      <Sidebar onLogout={logout} />

      <main className="relative mx-auto max-w-[1900px] px-4 pb-10 pt-6 sm:px-6 lg:px-7 lg:pt-7">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Workspace</p>
            <h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${dirty ? "text-amber-300" : isDark ? "text-slate-400" : "text-slate-500"}`}>
              {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <button type="button" onClick={save} className={primaryButtonClass}>
              Save
            </button>
          </div>
        </header>

        <div className={`mb-4 flex gap-1 overflow-x-auto rounded-xl border p-1 ${isDark ? "border-white/[0.08] bg-[#08142e]/65" : "border-slate-200 bg-white/90 shadow-sm"}`}>
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = item.id === tab.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  active
                    ? activeChipClass
                    : isDark
                      ? "border border-transparent text-slate-400 hover:text-white"
                      : "border border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className={`${panelCardClass} p-3`}>
            <p className={`px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Configure</p>
            <div className="space-y-1">
              {tab.sections.map((section) => {
                const Icon = section.icon;
                const active = section.id === sectionId;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSectionId(section.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? activeChipClass
                        : isDark
                          ? "border-transparent hover:bg-white/[0.04]"
                          : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        active
                          ? "border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 to-violet-400/15 text-cyan-700 dark:text-cyan-100"
                          : isDark
                            ? "border-white/10 bg-white/[0.03] text-slate-400"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>{section.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{section.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className={`${panelCardClass} min-w-0 p-4 sm:p-5`}>
            {tab.id === "general" && <GeneralPanel section={sectionId} />}
            {tab.id === "appearance" && <AppearancePanel />}
            {tab.id === "vehicles" && <VehicleConfigPanel />}
            {tab.id === "profile" && <ProfilePanel section={sectionId} />}
            {tab.id === "certificates" && <CertificatePanel section={sectionId} onSectionChange={setSectionId} />}
            {tab.id === "fields" && <CustomFieldsPanel section={sectionId} onSectionChange={setSectionId} />}
          </section>
        </div>
      </main>
    </div>
  );
}

const Settings = () => (
  <SettingsProvider>
    <SettingsWorkspace />
  </SettingsProvider>
);

export default Settings;
