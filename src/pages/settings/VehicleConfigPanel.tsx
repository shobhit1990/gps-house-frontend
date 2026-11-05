import { useState } from "react";
import { toast } from "sonner";
import { Status } from "@/enums/Status";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useGetTransporterMasterQuery } from "@/store/services/api/Master";
import {
  useCreateVehicleConfigMutation,
  useGetVehicleConfigsQuery,
  useUpdateVehicleConfigMutation,
} from "@/store/services/api/VehicleConfig";
import { Field, PanelIntro, primaryButtonClass, SelectInput, TextInput } from "./ui";

const defaults = { distanceVariation: "0", lockButton: true };

/** Vehicle config is stored per transporter through /vehicleConfig, so this panel saves on its own instead of with the settings draft. */
export function VehicleConfigPanel() {
  const { data: transporters = [] } = useGetTransporterMasterQuery();
  const { data: configs = [] } = useGetVehicleConfigsQuery();
  const [createConfig, { isLoading: isCreating }] = useCreateVehicleConfigMutation();
  const [updateConfig, { isLoading: isUpdating }] = useUpdateVehicleConfigMutation();
  const isSaving = isCreating || isUpdating;
  const [transporter, setTransporter] = useState("");
  const [distanceVariation, setDistanceVariation] = useState(defaults.distanceVariation);
  const [lockButton, setLockButton] = useState(defaults.lockButton);
  const existing = configs.find((config) => config.transporter === transporter);

  const selectTransporter = (next: string) => {
    const saved = configs.find((config) => config.transporter === next);
    setTransporter(next);
    setDistanceVariation(saved ? String(saved.distanceVariation ?? 0) : defaults.distanceVariation);
    setLockButton(saved ? Boolean(saved.lockButton) : defaults.lockButton);
  };

  const save = async () => {
    if (!transporter) {
      toast.error("Please select a transporter.");
      return;
    }
    const variation = Number(distanceVariation);
    if (!distanceVariation.trim() || !Number.isFinite(variation) || variation < 0) {
      toast.error("Distance variation must be a non-negative number.");
      return;
    }
    try {
      if (existing) {
        await updateConfig({
          externalId: existing.externalId,
          body: { distanceVariation: variation, lockButton, reason: "Vehicle config updated" },
        }).unwrap();
      } else {
        await createConfig({
          transporter,
          distanceVariation: variation,
          lockButton,
          status: Status.ACTIVE,
          reason: "New vehicle config created",
        }).unwrap();
      }
      toast.success("Vehicle config saved.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save the vehicle config."));
    }
  };

  return (
    <div>
      <PanelIntro
        kicker="Vehicles"
        title="Distance and lock"
        description="Set the allowed distance variation for a transporter, and whether the vehicle lock control stays available."
      />
      <div className="grid max-w-xl gap-4">
        <Field label="Transporter" required>
          <SelectInput value={transporter} onChange={(event) => selectTransporter(event.target.value)}>
            <option value="">Select transporter</option>
            {transporters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Distance variation">
          <TextInput
            type="number"
            min={0}
            value={distanceVariation}
            onChange={(event) => setDistanceVariation(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-700 dark:border-white/[0.08] dark:bg-[#03091c]/40 dark:text-slate-200">
          <input
            type="checkbox"
            checked={lockButton}
            onChange={(event) => setLockButton(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-cyan-500"
          />
          Lock button
        </label>
        <div>
          <button type="button" onClick={save} disabled={isSaving} className={`${primaryButtonClass} disabled:opacity-60`}>
            {isSaving ? "Saving..." : existing ? "Update vehicle config" : "Save vehicle config"}
          </button>
        </div>
      </div>
    </div>
  );
}
