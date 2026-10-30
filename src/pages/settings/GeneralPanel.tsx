import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { exchangeTargets, landingOptions, type LandingPage } from "./model";
import { useSettings } from "./SettingsState";
import { Field, PanelIntro, PillTabs, primaryButtonClass, quietButtonClass, SelectInput, ToggleRow } from "./ui";

type ExchangeTarget = (typeof exchangeTargets)[number]["id"];

const templates: Record<ExchangeTarget, string[]> = {
  vehicle: ["Vehicle No", "Vehicle Type", "Device IMEI", "Transporter"],
  poi: ["Name", "Latitude", "Longitude", "Address"],
  payment: ["Vehicle No", "Amount", "Paid On", "Status"],
  billing: ["Company", "Invoice No", "Amount", "Due Date"],
};

export function GeneralPanel({ section }: { section: string }) {
  const { draft, update } = useSettings();
  const general = draft.general;
  const [pendingLanding, setPendingLanding] = useState<LandingPage>(general.landingPage);
  const [exchange, setExchange] = useState<ExchangeTarget>("vehicle");

  const patch = (next: Partial<typeof general>) => update("general", { ...general, ...next });

  const downloadTemplate = () => {
    const headers = templates[exchange];
    const filename = `${exchange}-template`;
    if (general.downloadXlsx) {
      const sheet = XLSX.utils.aoa_to_sheet([headers]);
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Template");
      XLSX.writeFile(book, `${filename}.xlsx`);
    } else {
      const blob = new Blob([`${headers.join(",")}\n`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`${exchange} template downloaded`);
  };

  if (section === "exchange") {
    const current = exchangeTargets.find((item) => item.id === exchange) ?? exchangeTargets[0];
    return (
      <div>
        <PanelIntro
          kicker="General"
          title="File exchange"
          description="Download a blank template or upload a filled file for vehicles, points of interest, payments and billing."
        />
        <PillTabs<ExchangeTarget> value={exchange} onChange={setExchange} options={exchangeTargets.map((item) => ({ id: item.id, label: item.label }))} />
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 dark:border-white/[0.08] dark:bg-[#03091c]/40">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{current.label}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{current.hint}</p>
          {general.uploads[current.id] && (
            <p className="mt-3 text-xs text-cyan-700 dark:text-cyan-200">Last upload: {general.uploads[current.id]}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className={quietButtonClass}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <label className={`${quietButtonClass} cursor-pointer`}>
              <Upload className="h-3.5 w-3.5" />
              Upload
              <input
                type="file"
                accept={general.downloadXlsx ? ".xlsx,.xls,.csv" : ".csv,.xlsx,.xls"}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  patch({ uploads: { ...general.uploads, [current.id]: file.name } });
                  toast.success(`${current.label} file selected`);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PanelIntro
        kicker="General"
        title="Landing page"
        description="Choose the first screen after login, and how vehicle lists and fuel charts behave."
      />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] max-w-md flex-1">
        <Field label="First page after login">
          <SelectInput value={pendingLanding} onChange={(event) => setPendingLanding(event.target.value as LandingPage)}>
            {landingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        </div>
        <button
          type="button"
          onClick={() => {
            patch({ landingPage: pendingLanding });
            toast.success("Landing page updated");
          }}
          className={primaryButtonClass}
        >
          Change
        </button>
      </div>
      <div className="mt-5 space-y-2">
        <ToggleRow
          label="Download excel file in XLSX format"
          hint="Templates download as Excel workbooks. Turn this off for CSV."
          checked={general.downloadXlsx}
          onChange={(downloadXlsx) => patch({ downloadXlsx })}
        />
        <ToggleRow
          label="View fuel chart in voltage format"
          hint="Plot fuel as sensor voltage instead of litres."
          checked={general.fuelChartVoltage}
          onChange={(fuelChartVoltage) => patch({ fuelChartVoltage })}
        />
        <ToggleRow
          label="Sort vehicle list upon HighChart view"
          hint="When a chart is open, keep the vehicle list in that chart's order."
          checked={general.sortByHighchart}
          onChange={(sortByHighchart) => patch({ sortByHighchart })}
        />
      </div>
    </div>
  );
}
