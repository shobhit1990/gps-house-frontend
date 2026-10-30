import { Plus, Trash2 } from "lucide-react";
import { useSettings } from "./SettingsState";
import { Field, PanelIntro, SelectInput, TextArea, TextInput } from "./ui";

export function ProfilePanel({ section }: { section: string }) {
  const { draft, update, resetKey } = useSettings();

  if (section === "preferences") {
    const preferences = draft.preferences;
    const patch = (next: Partial<typeof preferences>) => update("preferences", { ...preferences, ...next });
    const fuelCosts =
      preferences.fuelCosts.length > 0
        ? preferences.fuelCosts
        : preferences.fuelType || preferences.fuelCost
          ? [{ fuelType: preferences.fuelType, fuelCost: preferences.fuelCost }]
          : [];
    const updateFuelCosts = (next: typeof fuelCosts) =>
      patch({
        fuelCosts: next,
        fuelType: next[0]?.fuelType ?? "",
        fuelCost: next[0]?.fuelCost ?? "",
      });

    return (
      <div>
        <PanelIntro
          kicker="Profile"
          title="Preferences"
          description="Units, currency, fuel cost and the date format used on reports and vehicle screens."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Distance" required>
            <SelectInput value={preferences.distance} onChange={(event) => patch({ distance: event.target.value })}>
              <option value="KILO_METER">Kilometre</option>
              <option value="MILE">Mile</option>
            </SelectInput>
          </Field>
          <Field label="Volume" required>
            <SelectInput value={preferences.volume} onChange={(event) => patch({ volume: event.target.value })}>
              <option value="LITER">Litre</option>
              <option value="GALLON">Gallon</option>
            </SelectInput>
          </Field>
          <Field label="Currency">
            <SelectInput value={preferences.currency} onChange={(event) => patch({ currency: event.target.value })}>
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
            </SelectInput>
          </Field>
          <div className="sm:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Fuel Cost</h3>
            <div className="space-y-3">
              {fuelCosts.map((fuelCost, index) => (
                <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <Field label="Fuel Type">
                    <SelectInput
                      value={fuelCost.fuelType}
                      onChange={(event) => {
                        const next = [...fuelCosts];
                        next[index] = { ...fuelCost, fuelType: event.target.value };
                        updateFuelCosts(next);
                      }}
                    >
                      <option value="">Select fuel type</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="Electric">Electric</option>
                    </SelectInput>
                  </Field>
                  <Field label="Cost">
                    <TextInput
                      type="number"
                      min={0}
                      placeholder="Enter cost"
                      value={fuelCost.fuelCost}
                      onChange={(event) => {
                        const next = [...fuelCosts];
                        next[index] = { ...fuelCost, fuelCost: event.target.value };
                        updateFuelCosts(next);
                      }}
                    />
                  </Field>
                  <button
                    type="button"
                    aria-label="Add fuel cost"
                    title="Add fuel cost"
                    onClick={() => updateFuelCosts([...fuelCosts, { fuelType: "", fuelCost: "" }])}
                    className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-400/10"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete fuel cost"
                    title="Delete fuel cost"
                    onClick={() => updateFuelCosts(fuelCosts.filter((_, rowIndex) => rowIndex !== index))}
                    className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-600 transition hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {fuelCosts.length === 0 && (
                <button
                  type="button"
                  onClick={() => updateFuelCosts([{ fuelType: "", fuelCost: "" }])}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 dark:border-white/[0.08] dark:text-slate-300"
                >
                  <Plus className="h-4 w-4" /> Add fuel cost
                </button>
              )}
            </div>
          </div>
          <Field label="Date format" required>
            <SelectInput value={preferences.dateFormat} onChange={(event) => patch({ dateFormat: event.target.value })}>
              <option value="dd/MM/yyyy">dd/MM/yyyy</option>
              <option value="MM/dd/yyyy">MM/dd/yyyy</option>
              <option value="yyyy-MM-dd">yyyy-MM-dd</option>
            </SelectInput>
          </Field>
          <Field label="Time format" required>
            <SelectInput value={preferences.timeFormat} onChange={(event) => patch({ timeFormat: event.target.value })}>
              <option value="HH:mm:ss">HH:mm:ss</option>
              <option value="hh:mm a">hh:mm a</option>
            </SelectInput>
          </Field>
        </div>
        <button type="button" onClick={() => resetKey("preferences")} className="mt-5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white">
          Reset preferences
        </button>
      </div>
    );
  }

  const profile = draft.profile;
  const patch = (next: Partial<typeof profile>) => update("profile", { ...profile, ...next });

  return (
    <div>
      <PanelIntro
        kicker="Profile"
        title="My profile"
        description="Your contact details and the company billing information printed on invoices and links."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Name">
          <TextInput value={profile.name} placeholder="Name" onChange={(event) => patch({ name: event.target.value })} />
        </Field>
        <Field label="Mobile number">
          <TextInput value={profile.mobile} placeholder="Mobile number" onChange={(event) => patch({ mobile: event.target.value })} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={profile.email} placeholder="Email" onChange={(event) => patch({ email: event.target.value })} />
        </Field>
      </div>

      <h3 className="mb-3 mt-8 text-sm font-semibold text-slate-900 dark:text-white">Billing detail</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" required>
          <TextInput value={profile.companyName} placeholder="Company name" onChange={(event) => patch({ companyName: event.target.value })} />
        </Field>
        <Field label="Website">
          <TextInput value={profile.website} placeholder="Website" onChange={(event) => patch({ website: event.target.value })} />
        </Field>
        <Field label="GSTIN">
          <TextInput value={profile.gstin} placeholder="GST number" onChange={(event) => patch({ gstin: event.target.value })} />
        </Field>
        <Field label="CIN">
          <TextInput value={profile.cin} placeholder="CIN" onChange={(event) => patch({ cin: event.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address" required>
            <TextArea rows={2} value={profile.address} placeholder="Address" onChange={(event) => patch({ address: event.target.value })} />
          </Field>
          <p className="mt-1 text-[11px] text-slate-500">Only letters, numbers and . , - / @</p>
        </div>
        <Field label="Web link">
          <TextInput value={profile.webLink} placeholder="Web link" onChange={(event) => patch({ webLink: event.target.value })} />
        </Field>
        <Field label="Android link">
          <TextInput value={profile.androidLink} placeholder="Android link" onChange={(event) => patch({ androidLink: event.target.value })} />
        </Field>
        <Field label="iOS link">
          <TextInput value={profile.iosLink} placeholder="iOS link" onChange={(event) => patch({ iosLink: event.target.value })} />
        </Field>
      </div>
      <button type="button" onClick={() => resetKey("profile")} className="mt-5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white">
        Reset profile
      </button>
    </div>
  );
}
