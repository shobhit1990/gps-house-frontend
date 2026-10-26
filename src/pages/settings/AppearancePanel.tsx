import { themeColors } from "./model";
import { useSettings } from "./SettingsState";
import { Field, PanelIntro, TextInput, ToggleRow } from "./ui";

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
