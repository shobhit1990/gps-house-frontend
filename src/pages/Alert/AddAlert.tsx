
import React, { useMemo, useState } from "react";
import { ChevronsUp, Search, X } from "lucide-react";

type AlertRow = {
  id: number;
  transporter: string;
  name: string;
  vehicle: string;
  type: string;
  mobile: string;
};

type AlertCondition = {
  sensor: string;
  operation: string;
  value: string;
};

const initialRows: AlertRow[] = [
  { id: 1, transporter: "9839759599", name: "UP32BN4896_ALERT", vehicle: "1", type: "", mobile: "" },
  { id: 2, transporter: "sadik", name: "UP32JJ9278", vehicle: "ALL", type: "", mobile: "" },
  { id: 3, transporter: "amit6533", name: "Vehicle Start", vehicle: "ALL", type: "", mobile: "" },
  { id: 4, transporter: "9415026470", name: "UP32GN8345", vehicle: "ALL", type: "", mobile: "" },
];

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

const purple = "#482064";

const inputClass =
  "h-14 w-full rounded-md border border-[#dedede] bg-white px-5 text-base text-[#30343b] outline-none placeholder:text-[#8a929d] focus:border-[#482064] focus:ring-1 focus:ring-[#482064]";

const labelClass = "mb-2 block text-[18px] font-medium text-[#454545]";

const buttonClass =
  "rounded-md bg-[#482064] px-5 py-3 text-base text-white transition hover:bg-[#351449] disabled:cursor-not-allowed disabled:opacity-50";

export default function AlertManagement() {
  const [alertName, setAlertName] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");

  const [rows, setRows] = useState<AlertRow[]>(initialRows);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tableVisible, setTableVisible] = useState(true);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const [alertType, setAlertType] = useState("");
  const [mobileEnabled, setMobileEnabled] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const [customAlertName, setCustomAlertName] = useState("");
  const [condition, setCondition] = useState<AlertCondition>({
    sensor: "",
    operation: "",
    value: "",
  });
  const [geofenceRestriction, setGeofenceRestriction] = useState(false);
  const [tripRestriction, setTripRestriction] = useState(false);
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [customMobile, setCustomMobile] = useState(true);

  const usersByAssignment: Record<string, string[]> = {
    User: ["sadik", "amit6533", "9839759599", "9415026470"],
    Group: ["Operations Team", "Admin Group", "Transport Team"],
    Transporter: ["Transporter 1", "Transporter 2"],
  };

  const vehicles = [
    "UP32BN4896",
    "UP32JJ9278",
    "UP32GN8345",
    "UP32AB1234",
    "UP32CD5678",
  ];

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      [row.transporter, row.name, row.vehicle, row.type, row.mobile]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [rows, searchText]);

  const resetMainForm = () => {
    setAlertName("");
    setAssignedTo("");
    setSelectedUser("");
    setSelectedVehicles([]);
    setSelectedTypes([]);
    setSearchText("");
    setSelectedIds([]);
  };

  const resetCustomForm = () => {
    setCustomAlertName("");
    setCondition({ sensor: "", operation: "", value: "" });
    setGeofenceRestriction(false);
    setTripRestriction(false);
    setSubject("");
    setMessageBody("");
    setCustomMobile(true);
  };

  const handleAssignmentChange = (value: string) => {
    setAssignedTo(value);
    setSelectedUser("");
    setSelectedVehicles([]);
  };

  const handleVehicleChange = (value: string) => {
    setSelectedVehicles((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
    setCustomModalOpen(true);
  };

  const handleTypeAdd = () => {
    if (!alertType) {
      window.alert("Please select Alert Type.");
      return;
    }

    setSelectedTypes((current) =>
      current.includes(alertType) ? current : [...current, alertType]
    );
    setTypeModalOpen(false);
    setAlertType("");
  };

  const handleCustomAdd = () => {
    if (!customAlertName.trim() || !condition.sensor || !condition.operation ||
        !condition.value.trim() || !subject.trim() || !messageBody.trim()) {
      window.alert("Please fill all required custom alert fields.");
      return;
    }

    const newRow: AlertRow = {
      id: Date.now(),
      transporter: selectedUser || assignedTo || "User",
      name: customAlertName.trim(),
      vehicle: selectedVehicles.length ? selectedVehicles.join(", ") : "ALL",
      type: condition.sensor,
      mobile: customMobile ? "Yes" : "No",
    };

    setRows((current) => [...current, newRow]);
    setCustomModalOpen(false);
    resetCustomForm();
  };

  const handleSave = () => {
    if (!alertName.trim()) {
      window.alert("Please enter Alert Name.");
      return;
    }

    if (!assignedTo) {
      window.alert("Please select Alert Assigned To.");
      return;
    }

    if (!selectedUser) {
      window.alert("Please select User.");
      return;
    }

    if (!selectedVehicles.length) {
      window.alert("Please select at least one vehicle.");
      return;
    }

    setRows((current) => [
      ...current,
      {
        id: Date.now(),
        transporter: selectedUser,
        name: alertName.trim(),
        vehicle: selectedVehicles.join(", "),
        type: selectedTypes.join(", "),
        mobile: mobileEnabled ? "Yes" : "No",
      },
    ]);

    resetMainForm();
  };

  const handleDelete = () => {
    if (!selectedIds.length) {
      window.alert("Please select rows using the checkboxes first.");
      return;
    }

    setRows((current) =>
      current.filter((row) => !selectedIds.includes(row.id))
    );
    setSelectedIds([]);
  };

  const insertToken = (token: string) => {
    setMessageBody((current) => `${current} {${token}}`);
  };

  return (
    <div className="w-full min-w-0 bg-white font-sans text-[#30343b]">
      {/* Main alert form */}
      <div className="border-b border-[#e1e1e1] px-4 pb-2 pt-3">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelClass}>
              Alert Name <span className="text-red-600">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Alert Name"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>
              Alert Assigned To <span className="text-red-600">*</span>
            </label>
            <select
              className={inputClass}
              value={assignedTo}
              onChange={(e) => handleAssignmentChange(e.target.value)}
            >
              <option value="">Select</option>
              <option value="User">User</option>
              <option value="Group">Group</option>
              <option value="Transporter">Transporter</option>
            </select>
          </div>

          {assignedTo && (
            <div>
              <label className={labelClass}>
                Select User <span className="text-red-600">*</span>
              </label>
              <select
                className={inputClass}
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select User</option>
                {(usersByAssignment[assignedTo] || []).map((user) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          )}

          {assignedTo && selectedUser && (
            <div>
              <label className={labelClass}>
                Select Vehicles <span className="text-red-600">*</span>
              </label>
              <select
                className={inputClass}
                value=""
                onChange={(e) => {
                  if (e.target.value) handleVehicleChange(e.target.value);
                }}
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle} value={vehicle}>{vehicle}</option>
                ))}
              </select>

              {selectedVehicles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedVehicles.map((vehicle) => (
                    <span
                      key={vehicle}
                      className="flex items-center gap-2 rounded bg-[#f0e8f5] px-2 py-1 text-sm text-[#482064]"
                    >
                      {vehicle}
                      <button
                        type="button"
                        onClick={() => setSelectedVehicles((current) =>
                          current.filter((item) => item !== vehicle)
                        )}
                        aria-label={`Remove ${vehicle}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedTypes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTypes.map((type) => (
              <span
                key={type}
                className="rounded bg-[#f0e8f5] px-3 py-1 text-sm text-[#482064]"
              >
                {type}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex h-[50px] w-full max-w-[261px]">
            <input
              className="min-w-0 flex-1 rounded-l-md border border-r-0 border-[#dedede] px-5 text-base outline-none focus:border-[#482064]"
              placeholder="Search Alert"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setSearchText(searchText.trim())}
              aria-label="Search alerts"
              className="flex w-[61px] items-center justify-center rounded-r-md bg-[#482064] text-white"
            >
              <Search size={22} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={buttonClass}
              onClick={() => setTypeModalOpen(true)}
            >
              Add Type
            </button>

            <button
              type="button"
              className={`${buttonClass} ring-4 ring-[#482064]/30`}
              onClick={() => setCustomModalOpen(true)}
            >
              Add Custom Type
            </button>

            <button type="button" className={buttonClass} onClick={handleDelete}>
              Delete
            </button>

            <button type="button" className={buttonClass} onClick={resetMainForm}>
              Clear
            </button>

            <button type="button" className={buttonClass} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Collapse bar */}
      <div className="flex h-[23px] items-center justify-center bg-[#482064]">
        <button
          type="button"
          onClick={() => setTableVisible((current) => !current)}
          className="flex h-[23px] w-[190px] items-center justify-center bg-[#351447] text-white"
          aria-label="Toggle alerts table"
        >
          <ChevronsUp className={tableVisible ? "" : "rotate-180"} size={20} />
        </button>
      </div>

      {/* Alerts table */}
      {tableVisible && (
        <div className="mt-3 w-full overflow-x-auto">
          <table className="w-full min-w-[950px] table-fixed border-collapse text-left">
            <thead>
              <tr className="h-[52px] bg-[#482064] text-[18px] text-white">
                <th className="w-[19%] px-6 font-medium">Transporter/User/Group</th>
                <th className="w-[14%] px-6 font-medium">Name</th>
                <th className="w-[9%] px-6 font-medium">Vehicle</th>
                <th className="w-[13%] px-6 font-medium">Type</th>
                <th className="w-[16%] px-6 font-medium">Vehicle</th>
                <th className="w-[15%] px-6 font-medium">Mobile</th>
                <th className="w-[14%] px-6 text-center font-medium">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? (
                filteredRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`h-[45px] border-b border-[#dfe2e6] text-[18px] ${
                      index % 2 === 0 ? "bg-[#f2f3f5]" : "bg-white"
                    }`}
                  >
                    <td className="border-r border-[#dfe2e6] px-3">{row.transporter}</td>
                    <td className="border-r border-[#dfe2e6] px-3">{row.name}</td>
                    <td className="border-r border-[#dfe2e6] px-3">{row.vehicle}</td>
                    <td className="border-r border-[#dfe2e6] px-3">{row.type}</td>
                    <td className="border-r border-[#dfe2e6] px-3"></td>
                    <td className="border-r border-[#dfe2e6] px-3">{row.mobile}</td>
                    <td className="px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => setSelectedIds((current) =>
                          current.includes(row.id)
                            ? current.filter((id) => id !== row.id)
                            : [...current, row.id]
                        )}
                        aria-label={`Select ${row.name}`}
                        className="h-4 w-4 accent-[#482064]"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="h-[45px] bg-[#f2f3f5] text-center text-red-600">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Type modal: Image 2 */}
      {typeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-[1200px] overflow-hidden rounded-md border-t-[3px] border-[#482064] bg-white shadow-xl">
            <div className="p-5 md:p-8">
              <label className={labelClass}>
                Alert Type <span className="text-red-600">*</span>
              </label>
              <select
                className={inputClass}
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="Vehicle Start">Vehicle Start</option>
                <option value="Vehicle Stop">Vehicle Stop</option>
                <option value="Overspeed">Overspeed</option>
                <option value="Ignition On">Ignition On</option>
                <option value="Ignition Off">Ignition Off</option>
                <option value="Geofence Entry">Geofence Entry</option>
                <option value="Geofence Exit">Geofence Exit</option>
                <option value="Power Disconnect">Power Disconnect</option>
                <option value="Low Battery">Low Battery</option>
              </select>

              <label className="mt-6 flex w-fit cursor-pointer items-center gap-3 text-xl font-medium">
                <input
                  type="checkbox"
                  checked={mobileEnabled}
                  onChange={(e) => setMobileEnabled(e.target.checked)}
                  className="h-6 w-6 accent-[#482064]"
                />
                Mobile
              </label>

              <div className="mt-16 flex justify-end gap-3">
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setTypeModalOpen(false)}
                >
                  CLOSE
                </button>
                <button type="button" className={buttonClass} onClick={handleTypeAdd}>
                  ADD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Alert modal: Images 3 and 4 */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 p-3 md:p-6">
          <div className="mx-auto w-full max-w-[1500px] rounded-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-t-[3px] border-[#482064] px-5 py-4">
              <h2 className="text-xl font-semibold">Add Custom Alert</h2>
              <button
                type="button"
                onClick={() => setCustomModalOpen(false)}
                className="rounded p-1 text-gray-600 hover:bg-gray-100"
                aria-label="Close custom alert"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="max-w-[355px]">
                <label className={labelClass}>
                  Alert Name <span className="text-red-600">*</span>
                </label>
                <input
                  className={inputClass}
                  placeholder="Enter Alert Name"
                  value={customAlertName}
                  onChange={(e) => setCustomAlertName(e.target.value)}
                />
              </div>

              {/* Alert Conditions */}
              <section className="overflow-hidden rounded-md border border-[#dedede]">
                <h3 className="bg-[#eef0f5] px-3 py-3 text-xl font-medium">
                  Alert Conditions
                </h3>

                <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-3">
                  <div>
                    <label className={labelClass}>
                      Sensor <span className="text-red-600">*</span>
                    </label>
                    <select
                      className={inputClass}
                      value={condition.sensor}
                      onChange={(e) => setCondition({
                        ...condition,
                        sensor: e.target.value,
                      })}
                    >
                      <option value="">Select</option>
                      <option value="Ignition">Ignition</option>
                      <option value="Fuel">Fuel</option>
                      <option value="Temperature">Temperature</option>
                      <option value="Battery">Battery</option>
                      <option value="Speed">Speed</option>
                      <option value="Door">Door</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Operation <span className="text-red-600">*</span>
                    </label>
                    <select
                      className={inputClass}
                      value={condition.operation}
                      onChange={(e) => setCondition({
                        ...condition,
                        operation: e.target.value,
                      })}
                    >
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
                    <label className={labelClass}>
                      Value <span className="text-red-600">*</span>
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Enter Alert Value"
                      value={condition.value}
                      onChange={(e) => setCondition({
                        ...condition,
                        value: e.target.value,
                      })}
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 text-lg">
                    <input
                      type="checkbox"
                      checked={geofenceRestriction}
                      onChange={(e) => setGeofenceRestriction(e.target.checked)}
                      className="h-6 w-6 accent-[#482064]"
                    />
                    Enable Geofence Restrictions
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 text-lg">
                    <input
                      type="checkbox"
                      checked={tripRestriction}
                      onChange={(e) => setTripRestriction(e.target.checked)}
                      className="h-6 w-6 accent-[#482064]"
                    />
                    Enable Trip Restrictions
                  </label>
                </div>
              </section>

              {/* Message template */}
              <section className="overflow-hidden rounded-md border border-[#dedede]">
                <h3 className="bg-[#eef0f5] px-3 py-3 text-xl font-medium">
                  Alert Message Template
                </h3>

                <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_245px]">
                  <div className="min-w-0">
                    <label className={labelClass}>
                      Subject / Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Enter Alert Name"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />

                    <label className={`${labelClass} mt-4`}>
                      Message / Mail Body <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      className="min-h-[200px] w-full resize-y rounded-md border border-[#dedede] px-5 py-4 text-base outline-none placeholder:text-[#8a929d] focus:border-[#482064] focus:ring-1 focus:ring-[#482064]"
                      placeholder="Enter Text"
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                    />
                  </div>

                  <aside className="max-h-[345px] overflow-y-auto rounded-md border border-[#dedede] p-3">
                    <h4 className="mb-3 font-medium">Insert Message Fields</h4>
                    <div className="flex flex-col gap-2">
                      {messageTokens.map((token) => (
                        <button
                          type="button"
                          key={token}
                          onClick={() => insertToken(token)}
                          className="w-full rounded-lg border border-[#c6c0c0] bg-[#f4f3f3] px-3 py-2 text-left text-base text-black hover:bg-[#e8dfee]"
                        >
                          + {token}
                        </button>
                      ))}
                    </div>
                  </aside>
                </div>
              </section>

              <label className="flex w-fit cursor-pointer items-center gap-3 text-xl font-medium">
                <input
                  type="checkbox"
                  checked={customMobile}
                  onChange={(e) => setCustomMobile(e.target.checked)}
                  className="h-6 w-6 accent-[#482064]"
                />
                Mobile
              </label>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#e2e2e2] pt-5">
                <button
                  type="button"
                  className="rounded-md bg-[#737d85] px-8 py-3 text-base text-white hover:bg-[#626b72]"
                  onClick={resetCustomForm}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={handleCustomAdd}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
