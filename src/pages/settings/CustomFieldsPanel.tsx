import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { vehicles } from "@/components/data/vehicles";
import type { CustomFieldDraft } from "@/interfaces/Settings";
import { useSettings } from "./SettingsState";
import { EmptyState, Field, PanelIntro, quietButtonClass, SelectInput, TextInput } from "./ui";

const actionButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-4 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-300/25 dark:bg-cyan-300/[0.10] dark:text-cyan-100 dark:hover:bg-cyan-300/[0.16]";
const viewOnOptions = ["Vehicle list", "Vehicle detail", "Dashboard", "Reports", "Certificate"];
const entityOptions = ["Vehicle", "Device", "Transporter", "Driver"];
const blankField = (): CustomFieldDraft => ({ fieldName: "", viewOn: "" });

export function CustomFieldsPanel({
  section,
  onSectionChange,
}: {
  section: string;
  onSectionChange: (section: string) => void;
}) {
  const { draft, update } = useSettings();
  const currentUser = useSelector(selectCurrentUser);
  const clients = [...new Set(vehicles.map((vehicle) => vehicle.branch).filter(Boolean))];
  const [client, setClient] = useState("");
  const [username, setUsername] = useState("");
  const [entity, setEntity] = useState("");
  const [fields, setFields] = useState<CustomFieldDraft[]>([blankField()]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return draft.customFields;
    return draft.customFields.filter((row) =>
      [row.createdBy, row.client, row.createdFor, row.entity, row.fieldName, row.viewOn].join(" ").toLowerCase().includes(query),
    );
  }, [draft.customFields, search]);

  const saveFields = () => {
    if (!client || !username || !entity) {
      toast.error("Choose who the fields are for");
      return;
    }
    const ready = fields.filter((field) => field.fieldName.trim());
    if (ready.length === 0) {
      toast.error("Add at least one field name");
      return;
    }
    const createdBy = currentUser?.name || currentUser?.username || "demo";
    update("customFields", [
      ...ready.map((field) => ({
        id: crypto.randomUUID(),
        createdBy,
        client,
        createdFor: username,
        entity,
        fieldName: field.fieldName.trim(),
        viewOn: field.viewOn || "Vehicle list",
      })),
      ...draft.customFields,
    ]);
    setFields([blankField()]);
    toast.success("Custom fields added");
    onSectionChange("list");
  };

  if (section === "form") {
    return (
      <div>
        <PanelIntro
          kicker="Custom fields"
          title="New fields"
          description="Extra fields for a client, shown on the page you choose."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Custom fields for" required>
            <SelectInput value={client} onChange={(event) => setClient(event.target.value)}>
              <option value="">Select client</option>
              {clients.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Create for" required>
            <SelectInput value={username} onChange={(event) => setUsername(event.target.value)}>
              <option value="">Select username</option>
              <option value={currentUser?.username || "demo"}>{currentUser?.username || "demo"}</option>
            </SelectInput>
          </Field>
          <Field label="For" required>
            <SelectInput value={entity} onChange={(event) => setEntity(event.target.value)}>
              <option value="">Select</option>
              {entityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <button
          type="button"
          onClick={() => setFields((current) => [...current, blankField()])}
          className={quietButtonClass}
        >
          <Plus className="h-3.5 w-3.5" />
          Add new fields
        </button>
        <div className="mt-4 space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-2">
              <Field label="Field name" required>
                <TextInput
                  value={field.fieldName}
                  placeholder="Field name"
                  onChange={(event) =>
                    setFields((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, fieldName: event.target.value } : item)))
                  }
                />
              </Field>
              <Field label="View on" required>
                <SelectInput
                  value={field.viewOn}
                  onChange={(event) =>
                    setFields((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, viewOn: event.target.value } : item)))
                  }
                >
                  <option value="">View on page</option>
                  {viewOnOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          ))}
        </div>
        <button type="button" onClick={saveFields} className={`mt-5 ${actionButtonClass}`}>
          Save
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PanelIntro kicker="Custom fields" title="All fields" description="Fields created for a client and the page they appear on." />
        <button
          type="button"
          onClick={() => onSectionChange("form")}
          className={`${actionButtonClass} shrink-0`}
        >
          <Plus className="h-3.5 w-3.5" />
          Add custom fields
        </button>
      </div>
      <label className="relative mb-4 block max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <TextInput value={search} placeholder="Search" className="pl-9" onChange={(event) => setSearch(event.target.value)} />
      </label>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 dark:bg-white/[0.025] dark:text-slate-400">
            <tr>
              {["Created by", "Client", "Created for", "Entity", "Field name", "View on", "Action"].map((label) => (
                <th key={label} className="px-3 py-3 font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState label="No data available" />
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 text-slate-700 dark:border-white/[0.06] dark:text-slate-200">
                  <td className="px-3 py-3">{row.createdBy}</td>
                  <td className="px-3 py-3">{row.client}</td>
                  <td className="px-3 py-3">{row.createdFor}</td>
                  <td className="px-3 py-3">{row.entity}</td>
                  <td className="px-3 py-3">{row.fieldName}</td>
                  <td className="px-3 py-3">{row.viewOn}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      aria-label={`Remove ${row.fieldName}`}
                      onClick={() => update("customFields", draft.customFields.filter((item) => item.id !== row.id))}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries</p>
    </div>
  );
}
