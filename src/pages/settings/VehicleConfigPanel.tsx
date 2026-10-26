import { vehicles } from "@/components/data/vehicles";
import { useSettings } from "./SettingsState";
import { Field, PanelIntro, SelectInput, TextInput } from "./ui";

const transporters = [...new Set(vehicles.map((vehicle) => vehicle.branch).filter(Boolean))];

export function VehicleConfigPanel() {
  const { draft, update } = useSettings();
  const config = draft.vehicleConfig;
  const patch = (next: Partial<typeof config>) => update("vehicleConfig", { ...config, ...next });

  return (
    <div>
      <PanelIntro
        kicker="Vehicles"
        title="Distance and lock"
        description="Set the allowed distance variation for a transporter, and whether the vehicle lock control stays available."
      />
      <div className="grid max-w-xl gap-4">
        <Field label="Transporter">
          <SelectInput value={config.transporter} onChange={(event) => patch({ transporter: event.target.value })}>
            <option value="">Select transporter</option>
            {transporters.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Distance variation">
          <TextInput
            type="number"
            min={0}
            value={config.distanceVariation}
            onChange={(event) => patch({ distanceVariation: event.target.value })}
          />
        </Field>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-700 dark:border-white/[0.08] dark:bg-[#03091c]/40 dark:text-slate-200">
          <input
            type="checkbox"
            checked={config.lockButton}
            onChange={(event) => patch({ lockButton: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300 accent-cyan-500"
          />
          Lock button
        </label>
      </div>
    </div>
  );
}
