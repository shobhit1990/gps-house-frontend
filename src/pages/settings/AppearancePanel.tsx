import { useSettings } from "./SettingsState";
import { Field, PanelIntro, TextInput, ToggleRow } from "./ui";

const themeColors = [
  { id: "mauve", label: "Mauve", hex: "#c084fc" },
  { id: "lime", label: "Lime", hex: "#84cc16" },
  { id: "blue", label: "Blue", hex: "#3b82f6" },
  { id: "cyan", label: "Cyan", hex: "#22d3ee" },
  { id: "teal", label: "Teal", hex: "#2dd4bf" },
  { id: "pink", label: "Pink", hex: "#f472b6" },
  { id: "slate", label: "Slate", hex: "#94a3b8" },
  { id: "indigo", label: "Indigo", hex: "#818cf8" },
  { id: "orange", label: "Orange", hex: "#fb923c" },
  { id: "sage", label: "Sage", hex: "#86efac" },
  { id: "olive", label: "Olive", hex: "#a3a35a" },
  { id: "violet", label: "Violet", hex: "#8b5cf6" },
  { id: "green", label: "Green", hex: "#22c55e" },
  { id: "ink", label: "Ink", hex: "#312e81" },
  { id: "red", label: "Red", hex: "#ef4444" },
];

export function AppearancePanel() {
  const { draft, update } = useSettings();
  const theme = draft.theme;
  const selected = themeColors.find((color) => color.id === theme.themeColor) ?? themeColors[3];

  const patch = (next: Partial<typeof theme>) => update("theme", { ...theme, ...next });

  return (
    <div>
      <PanelIntro
        kicker="Appearance"
        title="Theme"
        description="Set the workspace domain, report charts, and the accent used across GPS House."
      />
      <div className="max-w-xl">
        <Field label="Domain" required>
          <TextInput
            value={theme.domain}
            placeholder="fleet.gpshouse.com"
            onChange={(event) => patch({ domain: event.target.value })}
          />
        </Field>
      </div>
      <div className="mt-4 max-w-xl">
        <ToggleRow
          label="View chart in reports"
          hint="Show the summary chart at the top of report pages."
          checked={theme.viewChartInReports}
          onChange={(viewChartInReports) => patch({ viewChartInReports })}
        />
      </div>
      <div className="mt-6">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Theme colors</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Selected accent: {selected.label}</p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {themeColors.map((color) => {
            const active = color.id === theme.themeColor;
            return (
              <button
                key={color.id}
                type="button"
                aria-label={color.label}
                title={color.label}
                onClick={() => patch({ themeColor: color.id })}
                className={`h-8 w-8 rounded-full border-2 transition ${active ? "scale-110 border-white ring-2 ring-cyan-300" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
        <div className="mt-5 h-1.5 max-w-xs overflow-hidden rounded-full" style={{ backgroundColor: selected.hex }} />
      </div>
    </div>
  );
}
