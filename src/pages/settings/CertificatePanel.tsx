import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { vehicles } from "@/components/data/vehicles";
import { emptyCertificate, type CertificateRecord } from "./model";
import { useSettings } from "./SettingsState";
import { EmptyState, Field, inputClass, PanelIntro, primaryButtonClass, quietButtonClass, TextInput, UploadTile } from "./ui";

const columns: { key: keyof CertificateRecord; label: string }[] = [
  { key: "deviceImei", label: "Device IMEI" },
  { key: "vehicleNo", label: "Vehicle no." },
  { key: "vehicleType", label: "Vehicle type" },
  { key: "chassisNo", label: "Chassis no." },
  { key: "vtdModel", label: "VTD model" },
  { key: "iccid", label: "ICCID" },
  { key: "numberOfSos", label: "Number of SOS" },
  { key: "invoiceNo", label: "Invoice no." },
  { key: "invoiceDate", label: "Invoice date" },
];

const vehicleTypeLabel = (kind: string) => (kind === "bike" ? "Two-wheeler" : "Four-wheeler");

export function CertificatePanel({
  section,
  onSectionChange,
}: {
  section: string;
  onSectionChange: (section: string) => void;
}) {
  const { draft, update } = useSettings();
  const [form, setForm] = useState<CertificateRecord>(emptyCertificate);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return draft.certificates;
    return draft.certificates.filter((row) =>
      [row.deviceImei, row.vehicleNo, row.vehicleType, row.chassisNo, row.vtdModel, row.iccid, row.invoiceNo, row.kycName]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [draft.certificates, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const setField = (key: keyof CertificateRecord, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const openNew = () => {
    setForm(emptyCertificate());
    onSectionChange("form");
  };

  const openEdit = (row: CertificateRecord) => {
    setForm({ ...row, fitmentImages: [...row.fitmentImages], vendorLogos: [...row.vendorLogos] });
    onSectionChange("form");
  };

  const saveCertificate = () => {
    if (!form.vehicleNo) {
      toast.error("Select a vehicle number");
      return;
    }
    const record = { ...form, id: form.id || crypto.randomUUID() };
    const next = form.id
      ? draft.certificates.map((row) => (row.id === form.id ? record : row))
      : [record, ...draft.certificates];
    update("certificates", next);
    setForm(emptyCertificate());
    toast.success(form.id ? "Certificate updated" : "Certificate added");
    onSectionChange("list");
  };

  const remove = (id: string) => {
    update("certificates", draft.certificates.filter((row) => row.id !== id));
    toast.success("Certificate removed");
  };

  if (section === "form") {
    return (
      <div>
        <PanelIntro
          kicker="Certificates"
          title={form.id ? "Edit certificate" : "Add certificate"}
          description="Vehicle fitment, invoice and KYC documents for a device certificate."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Vehicle number" required>
            <select
              value={form.vehicleNo}
              onChange={(event) => {
                const match = vehicles.find((vehicle) => vehicle.vehicle === event.target.value);
                setForm((current) => ({
                  ...current,
                  vehicleNo: event.target.value,
                  vehicleType: match ? vehicleTypeLabel(match.kind) : current.vehicleType,
                }));
              }}
              className={inputClass}
            >
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.vehicle} value={vehicle.vehicle}>
                  {vehicle.vehicle}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vehicle type">
            <TextInput value={form.vehicleType} readOnly placeholder="Filled from the vehicle" />
          </Field>
          <Field label="Device IMEI">
            <TextInput value={form.deviceImei} onChange={(event) => setField("deviceImei", event.target.value)} />
          </Field>
          {(
            [
              ["numberOfSos", "Number of SOS"],
              ["chassisNo", "Chassis number"],
              ["manufacturingCompany", "Manufacturing company"],
              ["engineNumber", "Engine number"],
              ["vehicleModel", "Vehicle model"],
              ["customerName", "Customer name"],
              ["customerAddress", "Customer address"],
              ["dealerName", "Dealer name"],
              ["dealerAddress", "Dealer address"],
              ["vtdModel", "VTD model"],
              ["vtdUniqueId", "VTD unique ID"],
              ["invoiceNo", "Invoice number"],
              ["iccid", "SIM ICCID"],
              ["ideaNumber", "Idea number"],
              ["bankNumber", "Bank number"],
              ["rtoDistrict", "RTO district"],
              ["rtoState", "RTO state"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput value={form[key]} onChange={(event) => setField(key, event.target.value)} />
            </Field>
          ))}
          {(
            [
              ["deviceInstallationDate", "Device installation date"],
              ["vehicleManufacturingDate", "Vehicle manufacturing date"],
              ["registrationDate", "Registration date"],
              ["lastFitnessDate", "Last fitness date"],
              ["invoiceDate", "Invoice date"],
              ["dueDate", "Due date"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput type="date" value={form[key]} onChange={(event) => setField(key, event.target.value)} />
            </Field>
          ))}
        </div>

        <h3 className="mb-3 mt-8 text-sm font-semibold text-slate-900 dark:text-white">Fitment images</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {form.fitmentImages.map((fileName, index) => (
            <UploadTile
              key={`fitment-${index}`}
              label={`Fitment image ${index + 1}`}
              fileName={fileName}
              onPick={(name) =>
                setForm((current) => ({
                  ...current,
                  fitmentImages: current.fitmentImages.map((item, itemIndex) => (itemIndex === index ? name : item)),
                }))
              }
            />
          ))}
          {form.vendorLogos.map((fileName, index) => (
            <UploadTile
              key={`vendor-${index}`}
              label={`Vendor logo ${index + 1}`}
              fileName={fileName}
              onPick={(name) =>
                setForm((current) => ({
                  ...current,
                  vendorLogos: current.vendorLogos.map((item, itemIndex) => (itemIndex === index ? name : item)),
                }))
              }
            />
          ))}
        </div>

        <h3 className="mb-3 mt-8 text-sm font-semibold text-slate-900 dark:text-white">KYC</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(
            [
              ["kycName", "Name"],
              ["kycSurname", "Surname"],
              ["kycFatherName", "Father's name"],
              ["kycPan", "PAN number"],
              ["kycAadhaar", "Aadhaar number"],
              ["kycRemark", "Remark"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput value={form[key]} onChange={(event) => setField(key, event.target.value)} />
            </Field>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <UploadTile label="PAN card" fileName={form.pancardFile} onPick={(name) => setField("pancardFile", name)} />
          <UploadTile label="Aadhaar front" fileName={form.aadhaarFront} onPick={(name) => setField("aadhaarFront", name)} />
          <UploadTile label="Aadhaar back" fileName={form.aadhaarBack} onPick={(name) => setField("aadhaarBack", name)} />
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={saveCertificate} className={primaryButtonClass}>
            Save certificate
          </button>
          <button
            type="button"
            onClick={() => setForm(emptyCertificate())}
            className={quietButtonClass}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PanelIntro kicker="Certificates" title="Registry" description="Device certificates, invoices and KYC status for the fleet." />
        <button
          type="button"
          onClick={openNew}
          className={`${primaryButtonClass} shrink-0`}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      <label className="relative mb-4 block max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <TextInput value={search} placeholder="Search" className="pl-9" onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
      </label>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
        <table className="min-w-[980px] w-full text-left text-xs">
          <thead className="bg-violet-900 text-white dark:bg-violet-500/15 dark:text-violet-100">
            <tr>
              <th className="px-3 py-3 font-medium">SN</th>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-3 font-medium">{column.label}</th>
              ))}
              <th className="px-3 py-3 font-medium">KYC</th>
              <th className="px-3 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3}>
                  <EmptyState label="No data available" />
                </td>
              </tr>
            ) : (
              pageRows.map((row, index) => (
                <tr key={row.id} className="border-t border-slate-200 text-slate-700 dark:border-white/[0.06] dark:text-slate-200">
                  <td className="px-3 py-3">{safePage * pageSize + index + 1}</td>
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-3">{String(row[column.key] || "—")}</td>
                  ))}
                  <td className="px-3 py-3">{row.kycName ? "Complete" : "Pending"}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button type="button" aria-label="Edit certificate" onClick={() => openEdit(row)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" aria-label="Remove certificate" onClick={() => remove(row.id)} className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {filtered.length === 0 ? 0 : safePage * pageSize + 1} to {Math.min(filtered.length, safePage * pageSize + pageSize)} of {filtered.length} entries
        </span>
        <div className="flex gap-1">
          <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-white/10">Prev</button>
          <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40 dark:border-white/10">Next</button>
        </div>
      </div>
    </div>
  );
}
