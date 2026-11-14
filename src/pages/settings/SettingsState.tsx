import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { SettingsDraft } from "@/interfaces/Settings";

type SettingsKey = keyof SettingsDraft;

type SettingsContextValue = {
  draft: SettingsDraft;
  dirty: boolean;
  update: <K extends SettingsKey>(key: K, value: SettingsDraft[K]) => void;
  save: () => void;
  resetKey: <K extends SettingsKey>(key: K) => void;
};

const createDraft = (): SettingsDraft => ({
  general: {
    landingPage: "vehicles",
    downloadXlsx: false,
    fuelChartVoltage: false,
    sortByHighchart: true,
    uploads: { vehicle: "", poi: "", payment: "", billing: "" },
  },
  theme: {
    domain: "",
    viewChartInReports: true,
    themeColor: "cyan",
  },
  profile: {
    name: "",
    mobile: "",
    email: "",
    companyName: "",
    website: "",
    gstin: "",
    cin: "",
    address: "",
    webLink: "",
    androidLink: "",
    iosLink: "",
  },
  preferences: {
    distance: "KILO_METER",
    volume: "LITER",
    currency: "INR",
    fuelType: "",
    fuelCost: "",
    fuelCosts: [{ fuelType: "", fuelCost: "" }],
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm:ss",
  },
  certificates: [],
  customFields: [],
});

const SettingsContext = createContext<SettingsContextValue | null>(null);

const cloneDraft = (draft: SettingsDraft): SettingsDraft => structuredClone(draft);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<SettingsDraft>(() => createDraft());
  const [saved, setSaved] = useState<SettingsDraft>(() => createDraft());

  const value = useMemo<SettingsContextValue>(() => {
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
    return {
      draft,
      dirty,
      update: (key, next) => setDraft((current) => ({ ...current, [key]: next })),
      save: () => {
        setSaved(cloneDraft(draft));
        toast.success("Settings saved");
      },
      resetKey: (key) => setDraft((current) => ({ ...current, [key]: structuredClone(saved[key]) })),
    };
  }, [draft, saved]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
