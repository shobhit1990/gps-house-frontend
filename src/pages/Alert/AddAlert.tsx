import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronsUp, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AlertModal } from "@/components/Alert/AlertModal";
import { EmptyTableRow } from "@/components/Alert/AlertTable";
import {
  cardClass,
  checkboxClass,
  checkboxLabelClass,
  dangerButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  rowActionClass,
  searchIconClass,
  searchInputClass,
  secondaryButtonClass,
  sectionTitleClass,
  tableHeadRowClass,
  tableRowClass,
  thClass,
  toolbarClass,
} from "@/components/Alert/alertTheme";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Status } from "@/enums/Status";
import type { Alert, AlertAssignee } from "@/interfaces/Alert";
import type { MasterOption } from "@/interfaces/EntityMaster";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useCreateAlertMutation, useDeleteAlertMutation, useGetAlertsQuery } from "@/store/services/api/AddAlert";
import { useGetGroupsQuery } from "@/store/services/api/Group";
import { useGetAlertTypeMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import { useGetUsersQuery } from "@/store/services/api/User";

type AlertDetail = {
  id: string;
  type: string;
  vehicle: string;
  mobile: string;
};

/** Alert records sharing an assignee and alert name, shown as one entry with its records as details. */
type AlertRow = {
  id: string;
  party: string;
  name: string;
  vehicle: string;
  details: AlertDetail[];
};

type DraftType = { alertType: string; mobile: boolean };

const messageTokens = [
  "Vehicle Number",
  "Vehicle Alias",
  "IMEI",
  "Latitude",
  "Longitude",
  "Address",
  "Speed",
  "Time",
  "Status",
  "Current Sensor value",
  "Vehicle Type",
];

const assignees: { value: AlertAssignee; label: string }[] = [
  { value: "user", label: "User" },
  { value: "group", label: "Group" },
  { value: "transporter", label: "Transporter" },
];

const assigneeId = (alert: Alert) => alert[alert.alertAssignedTo] ?? "";
const sensors = ["Ignition", "Fuel", "Temperature", "Battery", "Speed", "Door"];

export default function AddAlert() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const { data: alerts = [] } = useGetAlertsQuery();
  const { data: alertTypes = [] } = useGetAlertTypeMasterQuery();
  const { data: vehicles = [] } = useGetVehicleMasterQuery();
  const { data: transporters = [] } = useGetTransporterMasterQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: groups = [] } = useGetGroupsQuery();
  const [createAlert, { isLoading: isSaving }] = useCreateAlertMutation();
  const [deleteAlert, { isLoading: isDeleting }] = useDeleteAlertMutation();

  const [alertName, setAlertName] = useState("");
  const [assignedTo, setAssignedTo] = useState<AlertAssignee | "">("");
  const [selectedParty, setSelectedParty] = useState("");
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [draftTypes, setDraftTypes] = useState<DraftType[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [tableVisible, setTableVisible] = useState(true);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [alertType, setAlertType] = useState("");
  const [mobileEnabled, setMobileEnabled] = useState(true);

  const [customAlertName, setCustomAlertName] = useState("");
  const [sensor, setSensor] = useState("");
  const [operation, setOperation] = useState("");
  const [conditionValue, setConditionValue] = useState("");
  const [geofenceRestriction, setGeofenceRestriction] = useState(false);
  const [tripRestriction, setTripRestriction] = useState(false);
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [customMobile, setCustomMobile] = useState(true);

  const assigneeLabel =
    assignedTo === "group" ? "Select Group" : assignedTo === "transporter" ? "Select Transporter" : "Select User";

  const partyOptions = useMemo<Record<AlertAssignee, MasterOption[]>>(
    () => ({
      user: users.map((user) => ({ id: user.externalId, name: user.userName })),
      group: groups.map((group) => ({ id: group.externalId, name: group.groupName })),
      transporter: transporters,
    }),
    [users, groups, transporters],
  );

  const vehicleNames = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.name])), [vehicles]);
  const alertTypeNames = useMemo(() => new Map(alertTypes.map((type) => [type.id, type.name])), [alertTypes]);

  const rows = useMemo<AlertRow[]>(() => {
    const groupsByKey = new Map<string, Alert[]>();
    alerts.forEach((alert) => {
      const key = `${alert.alertAssignedTo}|${assigneeId(alert)}|${alert.alertName}`;
      groupsByKey.set(key, [...(groupsByKey.get(key) ?? []), alert]);
    });
    return [...groupsByKey.entries()].map(([key, records]) => {
      const first = records[0];
      const partyId = assigneeId(first);
      const vehicleList = [...new Set(records.map((record) => vehicleNames.get(record.vehicle) ?? record.vehicle))];
      return {
        id: key,
        party: (partyOptions[first.alertAssignedTo] ?? []).find((party) => party.id === partyId)?.name ?? partyId,
        name: first.alertName ?? "",
        vehicle: vehicleList.join(", "),
        details: records.map((record) => ({
          id: record.externalId,
          type: alertTypeNames.get(record.alertType) ?? record.alertType,
          vehicle: vehicleNames.get(record.vehicle) ?? record.vehicle,
          mobile: record.mobile ? "Yes" : "No",
        })),
      };
    });
  }, [alerts, partyOptions, vehicleNames, alertTypeNames]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.party, row.name, row.vehicle, ...row.details.map((detail) => `${detail.type} ${detail.vehicle} ${detail.mobile}`)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [rows, searchText]);

  const activeRow = rows.find((row) => row.id === activeRowId) ?? null;

  const resetMainForm = () => {
    setAlertName("");
    setAssignedTo("");
    setSelectedParty("");
    setSelectedVehicles([]);
    setDraftTypes([]);
    setAlertType("");
  };

  const resetCustomForm = () => {
    setCustomAlertName("");
    setSensor("");
    setOperation("");
    setConditionValue("");
    setGeofenceRestriction(false);
    setTripRestriction(false);
    setSubject("");
    setMessageBody("");
    setCustomMobile(true);
  };

  const handleAssignmentChange = (value: AlertAssignee | "") => {
    setAssignedTo(value);
    setSelectedParty("");
  };

  const handleVehicleChange = (value: string) => {
    if (!value) return;
    setSelectedVehicles((current) => (current.includes(value) ? current : [...current, value]));
  };

  const handleTypeAdd = () => {
    if (!alertType) {
      toast.error("Please select Alert Type.");
      return;
    }
    if (draftTypes.some((entry) => entry.alertType === alertType)) {
      toast.error("This alert type is already added.");
      return;
    }
    setDraftTypes((current) => [...current, { alertType, mobile: mobileEnabled }]);
    setTypeModalOpen(false);
    setAlertType("");
    toast.success("Alert type added. Click Save to store the alert.");
  };

  const handleCustomAdd = () => {
    toast.error("Custom alerts cannot be saved yet: the alert API has no custom alert fields.");
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!alertName.trim()) {
      toast.error("Please enter Alert Name.");
      return;
    }
    if (!assignedTo) {
      toast.error("Please select Alert Assigned To.");
      return;
    }
    if (!selectedParty) {
      toast.error(`Please ${assigneeLabel.toLowerCase()}.`);
      return;
    }
    if (!selectedVehicles.length) {
      toast.error("Please select at least one vehicle.");
      return;
    }
    if (!draftTypes.length) {
      toast.error("Please add at least one alert type.");
      return;
    }
    // The API stores one vehicle and one alert type per record, so each combination is its own request.
    const requests = selectedVehicles.flatMap((vehicle) =>
      draftTypes.map((entry) =>
        createAlert({
          alertName: alertName.trim(),
          alertAssignedTo: assignedTo,
          [assignedTo]: selectedParty,
          vehicle,
          alertType: entry.alertType,
          mobile: entry.mobile,
          status: Status.ACTIVE,
          reason: "New alert created",
        }).unwrap(),
      ),
    );
    const results = await Promise.allSettled(requests);
    const failed = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failed.length === results.length) {
      toast.error(apiErrorMessage(failed[0].reason, "Could not save the alert."));
      return;
    }
    setActiveRowId(`${assignedTo}|${selectedParty}|${alertName.trim()}`);
    resetMainForm();
    if (failed.length) toast.error(`${failed.length} of ${results.length} alert records could not be saved.`);
    else toast.success("Alert saved.");
  };

  const handleDeleteRow = async () => {
    if (!activeRow) {
      toast.error("Select a transporter, user, or group first.");
      return;
    }
    const results = await Promise.allSettled(activeRow.details.map((detail) => deleteAlert(detail.id).unwrap()));
    const failed = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failed.length) {
      toast.error(apiErrorMessage(failed[0].reason, "Could not delete the alert."));
      return;
    }
    setActiveRowId(null);
    toast.success("Alert deleted.");
  };

  const handleDeleteDetail = async (detail: AlertDetail) => {
    try {
      await deleteAlert(detail.id).unwrap();
      toast.success("Alert type removed.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not remove the alert type."));
    }
  };

  const insertToken = (token: string) => {
    setMessageBody((current) => `${current}${current ? " " : ""}{${token}}`);
  };

  const required = <span className="text-rose-400">*</span>;
  const textareaClass = `min-h-[160px] w-full resize-y rounded-lg border px-3 py-3 text-xs outline-none transition ${
    isDark
      ? "border-white/[0.08] bg-[#03091c]/70 text-slate-200 placeholder:text-slate-500 focus:border-cyan-300/35"
      : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-cyan-400"
  }`;
  const panelClass = `overflow-hidden rounded-xl border ${isDark ? "border-white/[0.08]" : "border-slate-200"}`;
  const panelHeaderClass = `border-b px-4 py-3 ${isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`;

  return (
    <div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
        <div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
      </div>
      <Sidebar onLogout={logout} />

      <main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
        <section className="mb-5">
          <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Alerts</p>
          <div className="flex items-center gap-3">
            <h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Add Alerts</h1>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>{rows.length} records</span>
          </div>
        </section>

        <section aria-label="Create alert" className={`mb-4 ${cardClass(isDark)}`}>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className={labelClass(isDark)} htmlFor="alert-name">Alert Name {required}</label>
                <input id="alert-name" className={inputClass(isDark)} placeholder="Alert Name" value={alertName} onChange={(event) => setAlertName(event.target.value)} />
              </div>

              <div>
                <label className={labelClass(isDark)} htmlFor="alert-assigned-to">Alert Assigned To {required}</label>
                <select id="alert-assigned-to" className={inputClass(isDark)} value={assignedTo} onChange={(event) => handleAssignmentChange(event.target.value as AlertAssignee | "")}>
                  <option value="">Select</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.value} value={assignee.value}>{assignee.label}</option>
                  ))}
                </select>
              </div>

              {assignedTo && (
                <div>
                  <label className={labelClass(isDark)} htmlFor="alert-party">{assigneeLabel} {required}</label>
                  <select id="alert-party" className={inputClass(isDark)} value={selectedParty} onChange={(event) => setSelectedParty(event.target.value)}>
                    <option value="">{assigneeLabel}</option>
                    {partyOptions[assignedTo].map((party) => (
                      <option key={party.id} value={party.id}>{party.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {assignedTo && (
                <div>
                  <label className={labelClass(isDark)} htmlFor="alert-vehicles">Select Vehicles {required}</label>
                  <select id="alert-vehicles" className={inputClass(isDark)} value="" onChange={(event) => handleVehicleChange(event.target.value)}>
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
                    ))}
                  </select>
                  {selectedVehicles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedVehicles.map((vehicle) => (
                        <span key={vehicle} title={vehicleNames.get(vehicle) ?? vehicle} className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${isDark ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-800"}`}>
                          {vehicleNames.get(vehicle) ?? vehicle}
                          <button
                            type="button"
                            aria-label={`Remove ${vehicleNames.get(vehicle) ?? vehicle}`}
                            onClick={() => setSelectedVehicles((current) => current.filter((item) => item !== vehicle))}
                            className="opacity-70 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {draftTypes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Alert types to save">
                {draftTypes.map((entry, index) => (
                  <span key={`type-${index}`} className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${isDark ? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100" : "border-violet-200 bg-violet-50 text-violet-800"}`}>
                    {alertTypeNames.get(entry.alertType) ?? entry.alertType} · Mobile {entry.mobile ? "Yes" : "No"}
                    <button type="button" aria-label={`Remove ${alertTypeNames.get(entry.alertType) ?? entry.alertType}`} onClick={() => setDraftTypes((current) => current.filter((_item, itemIndex) => itemIndex !== index))} className="opacity-70 hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={`flex flex-wrap items-center justify-end gap-2 border-t px-4 py-3 sm:px-5 ${isDark ? "border-white/[0.07] bg-[#08142e]/50" : "border-slate-200 bg-slate-50/60"}`}>
            {assignedTo && (
              <>
                <button type="button" className={secondaryButtonClass(isDark)} onClick={() => setTypeModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Type
                </button>
                <button type="button" className={secondaryButtonClass(isDark)} onClick={() => setCustomModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Custom Type
                </button>
              </>
            )}
            <button type="button" className={secondaryButtonClass(isDark)} onClick={resetMainForm}>Clear</button>
            <button type="button" className={primaryButtonClass(isDark)} onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button>
          </div>
        </section>

        <section aria-label="Saved alerts" className={cardClass(isDark)}>
          <div className={toolbarClass(isDark)}>
            <label className="relative block min-w-0 sm:w-[300px]">
              <Search className={searchIconClass(isDark)} />
              <input
                type="search"
                className={searchInputClass(isDark)}
                placeholder="Search alert, user, vehicle..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                aria-label="Search alerts"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={dangerButtonClass(isDark)} onClick={handleDeleteRow} disabled={!activeRowId || isDeleting}>
                <Trash2 className="h-3.5 w-3.5" /> Delete Selected
              </button>
              <button
                type="button"
                onClick={() => setTableVisible((current) => !current)}
                aria-expanded={tableVisible}
                className={secondaryButtonClass(isDark)}
              >
                <ChevronsUp className={`h-3.5 w-3.5 transition ${tableVisible ? "" : "rotate-180"}`} />
                {tableVisible ? "Hide Tables" : "Show Tables"}
              </button>
            </div>
          </div>

          {tableVisible && (
            <div className="grid grid-cols-1 xl:grid-cols-2">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className={tableHeadRowClass(isDark)}>
                      <th scope="col" className={thClass}>Transporter / User / Group</th>
                      <th scope="col" className={thClass}>Name</th>
                      <th scope="col" className={thClass}>Vehicle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setActiveRowId(row.id)}
                        aria-selected={row.id === activeRowId}
                        className={`cursor-pointer ${tableRowClass(isDark, row.id === activeRowId)}`}
                      >
                        <td className="px-4 py-3 font-medium">{row.party}</td>
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.vehicle}</td>
                      </tr>
                    ))}
                    {filteredRows.length === 0 && (
                      <EmptyTableRow
                        isDark={isDark}
                        colSpan={3}
                        title={rows.length === 0 ? "No alerts yet" : "No alerts match your search"}
                      />
                    )}
                  </tbody>
                </table>
              </div>

              <div className={`overflow-x-auto border-t xl:border-l xl:border-t-0 ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className={tableHeadRowClass(isDark)}>
                      <th scope="col" className={thClass}>Type</th>
                      <th scope="col" className={thClass}>Vehicle</th>
                      <th scope="col" className={thClass}>Mobile</th>
                      <th scope="col" className={`${thClass} text-center`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRow && activeRow.details.length > 0 ? (
                      activeRow.details.map((detail) => (
                        <tr key={detail.id} className={tableRowClass(isDark)}>
                          <td className="px-4 py-3">{detail.type}</td>
                          <td className="px-4 py-3">{detail.vehicle}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${
                              detail.mobile === "Yes"
                                ? isDark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                                : isDark ? "bg-slate-500/15 text-slate-300" : "bg-slate-100 text-slate-600"
                            }`}>
                              {detail.mobile}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button type="button" onClick={() => handleDeleteDetail(detail)} className={rowActionClass(isDark, "rose")}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyTableRow
                        isDark={isDark}
                        colSpan={4}
                        title={activeRow ? "No alert types for this entry" : "Select an entry"}
                        hint={activeRow ? undefined : "Click a row on the left to see its alert types."}
                      />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {typeModalOpen && (
        <AlertModal
          isDark={isDark}
          title="Add Alert Type"
          widthClass="max-w-xl"
          onClose={() => setTypeModalOpen(false)}
          onSubmit={handleTypeAdd}
          footer={
            <>
              <button type="button" className={secondaryButtonClass(isDark)} onClick={() => setTypeModalOpen(false)}>Cancel</button>
              <button type="submit" className={primaryButtonClass(isDark)}>Add</button>
            </>
          }
        >
          <label className={labelClass(isDark)} htmlFor="alert-type">Alert Type {required}</label>
          <select id="alert-type" className={inputClass(isDark)} value={alertType} onChange={(event) => setAlertType(event.target.value)}>
            <option value="">Select Type</option>
            {alertTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <label className={`mt-5 ${checkboxLabelClass(isDark)}`}>
            <input type="checkbox" checked={mobileEnabled} onChange={(event) => setMobileEnabled(event.target.checked)} className={checkboxClass} />
            Mobile
          </label>
        </AlertModal>
      )}

      {customModalOpen && (
        <AlertModal
          isDark={isDark}
          title="Custom Alert"
          widthClass="max-w-6xl"
          onClose={() => setCustomModalOpen(false)}
          onSubmit={handleCustomAdd}
          footer={
            <>
              <button type="button" onClick={resetCustomForm} className={secondaryButtonClass(isDark)}>Reset</button>
              <button type="submit" className={primaryButtonClass(isDark)}>Add</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="max-w-sm">
              <label className={labelClass(isDark)} htmlFor="custom-alert-name">Alert Name {required}</label>
              <input id="custom-alert-name" className={inputClass(isDark)} placeholder="Enter Alert Name" value={customAlertName} onChange={(event) => setCustomAlertName(event.target.value)} />
            </div>

            <section className={panelClass}>
              <h3 className={`${panelHeaderClass} ${sectionTitleClass(isDark)}`}>Alert Conditions</h3>
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
                <div>
                  <label className={labelClass(isDark)} htmlFor="custom-sensor">Sensor {required}</label>
                  <select id="custom-sensor" className={inputClass(isDark)} value={sensor} onChange={(event) => setSensor(event.target.value)}>
                    <option value="">Select</option>
                    {sensors.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass(isDark)} htmlFor="custom-operation">Operation {required}</label>
                  <select id="custom-operation" className={inputClass(isDark)} value={operation} onChange={(event) => setOperation(event.target.value)}>
                    <option value="">Select</option>
                    <option value="=">Equal (=)</option>
                    <option value="!=">Not Equal (!=)</option>
                    <option value=">">Greater Than (&gt;)</option>
                    <option value="<">Less Than (&lt;)</option>
                    <option value=">=">Greater Than or Equal (&gt;=)</option>
                    <option value="<=">Less Than or Equal (&lt;=)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass(isDark)} htmlFor="custom-value">Value {required}</label>
                  <input id="custom-value" className={inputClass(isDark)} placeholder="Enter Alert Value" value={conditionValue} onChange={(event) => setConditionValue(event.target.value)} />
                </div>
                <label className={checkboxLabelClass(isDark)}>
                  <input type="checkbox" checked={geofenceRestriction} onChange={(event) => setGeofenceRestriction(event.target.checked)} className={checkboxClass} />
                  Enable Geofence Restrictions
                </label>
                <label className={checkboxLabelClass(isDark)}>
                  <input type="checkbox" checked={tripRestriction} onChange={(event) => setTripRestriction(event.target.checked)} className={checkboxClass} />
                  Enable Trip Restrictions
                </label>
              </div>
            </section>

            <section className={panelClass}>
              <h3 className={`${panelHeaderClass} ${sectionTitleClass(isDark)}`}>Alert Message Template</h3>
              <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <label className={labelClass(isDark)} htmlFor="custom-subject">Subject / Title {required}</label>
                  <input id="custom-subject" className={inputClass(isDark)} placeholder="Enter Subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
                  <label className={`${labelClass(isDark)} mt-4`} htmlFor="custom-message">Message / Mail Body {required}</label>
                  <textarea
                    id="custom-message"
                    className={textareaClass}
                    placeholder="Enter Text"
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                  />
                </div>
                <aside aria-label="Message placeholders" className={`max-h-[280px] overflow-y-auto rounded-lg border p-2 ${isDark ? "border-white/[0.08] bg-[#03091c]/40" : "border-slate-200 bg-slate-50/70"}`}>
                  <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Insert placeholder</p>
                  <div className="flex flex-col gap-1.5">
                    {messageTokens.map((token) => (
                      <button
                        type="button"
                        key={token}
                        onClick={() => insertToken(token)}
                        className={`rounded-md border px-3 py-2 text-left text-[11px] font-medium transition ${isDark ? "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-cyan-300/25 hover:bg-cyan-300/[0.08] hover:text-cyan-100" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"}`}
                      >
                        + {token}
                      </button>
                    ))}
                  </div>
                </aside>
              </div>
            </section>

            <label className={checkboxLabelClass(isDark)}>
              <input type="checkbox" checked={customMobile} onChange={(event) => setCustomMobile(event.target.checked)} className={checkboxClass} />
              Mobile
            </label>
          </div>
        </AlertModal>
      )}
    </div>
  );
}
