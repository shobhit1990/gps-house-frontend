
import React, { useState } from "react";
import { Plus, X, Download, Upload, Trash2, ChevronDown } from "lucide-react";

type CalibrationRow = {
  id: number;
  fuel: string;
  voltage: string;
  actualValue: string;
  expectedValue: string;
};

type Sensor = {
  id: number;
  name: string;
  sensorType: string;
  connectedTo: string;
  formula: string;
  value: string;
  inverse: boolean;
  rs232: boolean;
  showOnDashboard: boolean;
  type: string;
  unitOfMeasurement: string;
  sensor1Text: string;
  sensor0Text: string;
  descending: boolean;
  calibrationRows: CalibrationRow[];
};

const inputClass =
  "h-14 w-full rounded-md border border-gray-200 bg-white px-4 text-base outline-none focus:border-[#482064] placeholder:text-gray-400";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#482064] px-5 py-3 font-medium text-white hover:bg-[#37164f]";

const initialSensor = (id: number): Sensor => ({
  id,
  name: "",
  sensorType: "",
  connectedTo: "",
  formula: "",
  value: "",
  inverse: false,
  rs232: false,
  showOnDashboard: false,
  type: "",
  unitOfMeasurement: "",
  sensor1Text: "",
  sensor0Text: "",
  descending: true,
  calibrationRows: [],
});

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block font-semibold text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-sm text-gray-600">{hint}</p>}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select",
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <select
        className={`${inputClass} appearance-none pr-10`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
      />
    </div>
  );
}

export default function AddDeviceform() {
  const [activeTab, setActiveTab] = useState("device");
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryImei, setInventoryImei] = useState("");
  const [editingSensorId, setEditingSensorId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const initialDevice = {
    imei: "",
    simNumber: "",
    simOperator: "Airtel Gprs (airtelgprs.com)",
    secondarySimNumber: "",
    secondarySimOperator: "Airtel Gprs (airtelgprs.com)",
    deviceType: "Concox (8505)",
    client: "",
    password: "",
    active: true,
    ignitionPositive: false,
    ignitionNotConnected: false,
    acPositive: false,
    attendance: false,
    timezone: false,
  };

  const [device, setDevice] = useState(initialDevice);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  const updateDevice = (
    field: keyof typeof initialDevice,
    value: string | boolean
  ) => {
    setDevice((prev) => ({ ...prev, [field]: value }));
  };

  const updateSensor = (
    id: number,
    field: keyof Sensor,
    value: unknown
  ) => {
    setSensors((prev) =>
      prev.map((sensor) =>
        sensor.id === id
          ? { ...sensor, [field]: value }
          : sensor
      )
    );
  };

  const addSensor = () => {
    const id = sensors.length
      ? Math.max(...sensors.map((sensor) => sensor.id)) + 1
      : 1;

    setSensors((prev) => [...prev, initialSensor(id)]);
    setEditingSensorId(id);
    setActiveTab("sensorDetails");
  };

  const deleteSensor = (id: number) => {
    setSensors((prev) => prev.filter((sensor) => sensor.id !== id));

    if (editingSensorId === id) {
      setEditingSensorId(null);
    }
  };

  const addCalibrationRow = (sensorId: number) => {
    setSensors((prev) =>
      prev.map((sensor) => {
        if (sensor.id !== sensorId) return sensor;

        const id = sensor.calibrationRows.length
          ? Math.max(
              ...sensor.calibrationRows.map((row) => row.id)
            ) + 1
          : 1;

        return {
          ...sensor,
          calibrationRows: [
            ...sensor.calibrationRows,
            {
              id,
              fuel: "",
              voltage: "",
              actualValue: "",
              expectedValue: "",
            },
          ],
        };
      })
    );
  };

  const updateCalibration = (
    sensorId: number,
    rowId: number,
    field: keyof CalibrationRow,
    value: string
  ) => {
    setSensors((prev) =>
      prev.map((sensor) =>
        sensor.id !== sensorId
          ? sensor
          : {
              ...sensor,
              calibrationRows: sensor.calibrationRows.map((row) =>
                row.id === rowId
                  ? { ...row, [field]: value }
                  : row
              ),
            }
      )
    );
  };

  const removeCalibration = (sensorId: number, rowId: number) => {
    setSensors((prev) =>
      prev.map((sensor) =>
        sensor.id === sensorId
          ? {
              ...sensor,
              calibrationRows: sensor.calibrationRows.filter(
                (row) => row.id !== rowId
              ),
            }
          : sensor
      )
    );
  };

  const resetForm = () => {
    setDevice(initialDevice);
    setSensors([]);
    setEditingSensorId(null);
    setNotice("");
  };

  const importFromInventory = () => {
    if (!inventoryImei) return;

    updateDevice("imei", inventoryImei);
    setInventoryImei("");
    setShowInventory(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      ...device,
      sensors,
    };

    // Yahan apni Create Device API call karna.
    console.log("Device Payload:", payload);
    setNotice("Form data console mein available hai.");
  };

  const activeSensor = sensors.find(
    (sensor) => sensor.id === editingSensorId
  );

  const deviceCheckboxes = [
    ["active", "Active"],
    ["ignitionPositive", "Ignition wire connected in (+)ve"],
    ["ignitionNotConnected", "Ignition wire not connected"],
    ["acPositive", "Air condition wire connected in (+)ve"],
    ["attendance", "Attendance"],
    ["timezone", "Timezone Setting"],
  ] as const;

  const sensorCheckboxes = [
    ["inverse", "Inverse"],
    ["rs232", "RS232"],
    ["showOnDashboard", "Show On Dashboard"],
  ] as const;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-6 bg-white p-4 text-gray-800 md:p-7"
    >
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("device")}
          className={`border px-4 py-4 text-lg font-semibold ${
            activeTab === "device"
              ? "rounded-t-md border-gray-200 bg-blue-50"
              : "border-transparent text-gray-500"
          }`}
        >
          Add Device
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sensorDetails")}
          className={`border px-4 py-4 text-lg font-semibold ${
            activeTab === "sensorDetails"
              ? "rounded-t-md border-gray-200 bg-gray-50"
              : "border-transparent text-gray-500"
          }`}
        >
          Add Sensor Details
        </button>
      </div>

      {/* ADD DEVICE FORM */}
      {activeTab === "device" && (
        <section className="space-y-7 pt-2">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Imei"
              required
              hint="Max 30 characters allowed"
            >
              <button
                type="button"
                className="mb-2 text-blue-600 underline"
                onClick={() => setShowInventory(true)}
              >
                Import from Inventory
              </button>

              <input
                className={inputClass}
                placeholder="Imei"
                value={device.imei}
                maxLength={30}
                onChange={(e) =>
                  updateDevice("imei", e.target.value.slice(0, 30))
                }
                required
              />
            </Field>

            <Field
              label="Sim Number"
              required
              hint="Only contains 24 digit"
            >
              <input
                className={inputClass}
                placeholder="Sim Number"
                inputMode="numeric"
                maxLength={24}
                value={device.simNumber}
                onChange={(e) =>
                  updateDevice(
                    "simNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 24)
                  )
                }
                required
              />
            </Field>

            <Field label="Sim Operator" required>
              <SelectField
                value={device.simOperator}
                onChange={(v) => updateDevice("simOperator", v)}
                options={[
                  "Airtel Gprs (airtelgprs.com)",
                  "Jio",
                  "Vodafone Idea",
                  "BSNL",
                ]}
                required
              />
            </Field>

            <Field
              label="Secondary Sim Number"
              hint="Only contains 24 digit"
            >
              <input
                className={inputClass}
                placeholder="Sim Number"
                inputMode="numeric"
                maxLength={24}
                value={device.secondarySimNumber}
                onChange={(e) =>
                  updateDevice(
                    "secondarySimNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 24)
                  )
                }
              />
            </Field>

            <Field label="Secondary Sim Operator">
              <SelectField
                value={device.secondarySimOperator}
                onChange={(v) =>
                  updateDevice("secondarySimOperator", v)
                }
                options={[
                  "Airtel Gprs (airtelgprs.com)",
                  "Jio",
                  "Vodafone Idea",
                  "BSNL",
                ]}
              />
            </Field>

            <Field label="Device Type" required>
              <SelectField
                value={device.deviceType}
                onChange={(v) => updateDevice("deviceType", v)}
                options={[
                  "Concox (8505)",
                  "Concox (GT06)",
                  "Teltonika",
                  "Queclink",
                ]}
                required
              />
            </Field>

            <Field label="Client" required>
              <SelectField
                value={device.client}
                onChange={(v) => updateDevice("client", v)}
                placeholder="Select Client"
                options={["Client 1", "Client 2", "Client 3"]}
                required
              />
            </Field>

            <Field label="Password (Optional)">
              <input
                className={inputClass}
                type="password"
                placeholder="Password"
                value={device.password}
                onChange={(e) =>
                  updateDevice("password", e.target.value)
                }
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            {deviceCheckboxes.map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3"
              >
                <input
                  type="checkbox"
                  className="h-6 w-6 accent-[#482064]"
                  checked={device[key]}
                  onChange={(e) =>
                    updateDevice(key, e.target.checked)
                  }
                />
                <span className={key === "active" ? "font-semibold" : ""}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* ADD SENSOR DETAILS */}
      {activeTab === "sensorDetails" && (
        <section className="space-y-5">
          <div className="flex items-center justify-between border border-gray-200 bg-gray-50 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-600">
              Add Sensor Details
            </h2>

            <button
              type="button"
              className={buttonClass}
              onClick={addSensor}
            >
              <Plus size={18} />
              Add Sensor
            </button>
          </div>

          {sensors.length > 0 && (
            <div className="space-y-3">
              {sensors.map((sensor, index) => (
                <div
                  key={sensor.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {sensor.name || `Sensor ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sensor.sensorType || "Sensor type not selected"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border px-4 py-2"
                      onClick={() => setEditingSensorId(sensor.id)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="rounded border p-2 text-red-600"
                      onClick={() => deleteSensor(sensor.id)}
                      aria-label="Delete sensor"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sensors.length === 0 && (
            <div className="border border-dashed p-10 text-center text-gray-500">
              No sensors added. Click Add Sensor to continue.
            </div>
          )}

          {/* SENSOR FORM + CALIBRATION */}
          {activeSensor && (
            <div className="grid grid-cols-1 gap-6 border-t pt-6 xl:grid-cols-2">
              <div className="space-y-5">
                <Field label="Name" required>
                  <input
                    className={inputClass}
                    placeholder="Enter Name"
                    value={activeSensor.name}
                    onChange={(e) =>
                      updateSensor(activeSensor.id, "name", e.target.value)
                    }
                    required
                  />
                </Field>

                <Field label="Sensor Types" required>
                  <SelectField
                    value={activeSensor.sensorType}
                    onChange={(v) =>
                      updateSensor(activeSensor.id, "sensorType", v)
                    }
                    options={[
                      "Fuel",
                      "Voltage",
                      "Temperature",
                      "Humidity",
                      "Digital Input",
                      "Analog Input",
                    ]}
                    required
                  />
                </Field>

                <Field label="Connected To" required>
                  <SelectField
                    value={activeSensor.connectedTo}
                    onChange={(v) =>
                      updateSensor(activeSensor.id, "connectedTo", v)
                    }
                    options={[
                      "Fuel",
                      "Voltage",
                      "Digital Input 1",
                      "Digital Input 2",
                      "Analog Input 1",
                      "RS232",
                    ]}
                    required
                  />
                </Field>

                <Field label="Formula">
                  <input
                    className={inputClass}
                    placeholder="x/100"
                    value={activeSensor.formula}
                    onChange={(e) =>
                      updateSensor(activeSensor.id, "formula", e.target.value)
                    }
                  />
                </Field>

                <Field label="Value">
                  <input
                    className={inputClass}
                    placeholder="Value"
                    value={activeSensor.value}
                    onChange={(e) =>
                      updateSensor(activeSensor.id, "value", e.target.value)
                    }
                  />
                </Field>

                <div className="space-y-4">
                  {sensorCheckboxes.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-6 w-6 accent-[#482064]"
                        checked={activeSensor[key]}
                        onChange={(e) =>
                          updateSensor(
                            activeSensor.id,
                            key,
                            e.target.checked
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <Field label="Type" required>
                  <SelectField
                    value={activeSensor.type}
                    onChange={(v) =>
                      updateSensor(activeSensor.id, "type", v)
                    }
                    options={["Analog", "Digital", "Text", "Fuel", "Voltage"]}
                    required
                  />
                </Field>

                <Field label="Unit Of Measurement">
                  <input
                    className={inputClass}
                    placeholder="Unit Of Measurement"
                    value={activeSensor.unitOfMeasurement}
                    onChange={(e) =>
                      updateSensor(
                        activeSensor.id,
                        "unitOfMeasurement",
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field label="If sensor 1 (text)">
                  <input
                    className={inputClass}
                    placeholder="If sensor 1 (text)"
                    value={activeSensor.sensor1Text}
                    onChange={(e) =>
                      updateSensor(activeSensor.id, "sensor1Text", e.target.value)
                    }
                  />
                </Field>

                <Field label="If sensor 0 (text)">
                  <input
                    className={inputClass}
                    placeholder="If sensor 0 (text)"
                    value={activeSensor.sensor0Text}
                    onChange={(e) =>
                      updateSensor(activeSensor.id, "sensor0Text", e.target.value)
                    }
                  />
                </Field>
              </div>

              {/* CALIBRATION VALUES */}
              <div className="min-w-0 border-2 border-[#e7cbd5]">
                <h3 className="border-b border-[#e7cbd5] py-4 text-center text-2xl font-semibold">
                  Calibration Values
                </h3>

                <div className="flex flex-wrap justify-center gap-2 p-4">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => addCalibrationRow(activeSensor.id)}
                  >
                    <Plus size={18} />
                    ADD CALIBRATED ROW
                  </button>

                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => setNotice("Connect Demo to your template/API.")}
                  >
                    <Download size={18} />
                    Demo
                  </button>

                  <label className={`${buttonClass} cursor-pointer`}>
                    <Upload size={18} />
                    Upload
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNotice(
                            `Selected ${file.name}. File parsing needs to be added.`
                          );
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="mb-4 flex items-center justify-center gap-3">
                  <span>Desc.</span>
                  <button
                    type="button"
                    className={`relative h-7 w-12 rounded-full ${
                      activeSensor.descending
                        ? "bg-[#a491b4]"
                        : "bg-gray-300"
                    }`}
                    onClick={() =>
                      updateSensor(
                        activeSensor.id,
                        "descending",
                        !activeSensor.descending
                      )
                    }
                    aria-label="Toggle descending"
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white ${
                        activeSensor.descending ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {activeSensor.calibrationRows.length === 0 ? (
                  <div className="mx-auto grid max-w-lg grid-cols-2 gap-4 p-4">
                    {["FUEL", "VOLTAGE", "Actual Value", "Expected Value"].map(
                      (label) => (
                        <div
                          key={label}
                          className="rounded-md border border-gray-100 p-4 text-center font-semibold text-gray-300"
                        >
                          {label}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {activeSensor.calibrationRows.map((row, index) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-2"
                      >
                        <input
                          className={inputClass}
                          placeholder="FUEL"
                          aria-label={`Row ${index + 1} fuel`}
                          value={row.fuel}
                          onChange={(e) =>
                            updateCalibration(
                              activeSensor.id,
                              row.id,
                              "fuel",
                              e.target.value
                            )
                          }
                        />

                        <input
                          className={inputClass}
                          placeholder="VOLTAGE"
                          aria-label={`Row ${index + 1} voltage`}
                          value={row.voltage}
                          onChange={(e) =>
                            updateCalibration(
                              activeSensor.id,
                              row.id,
                              "voltage",
                              e.target.value
                            )
                          }
                        />

                        <input
                          className={inputClass}
                          placeholder="Actual Value"
                          aria-label={`Row ${index + 1} actual value`}
                          value={row.actualValue}
                          onChange={(e) =>
                            updateCalibration(
                              activeSensor.id,
                              row.id,
                              "actualValue",
                              e.target.value
                            )
                          }
                        />

                        <input
                          className={inputClass}
                          placeholder="Expected Value"
                          aria-label={`Row ${index + 1} expected value`}
                          value={row.expectedValue}
                          onChange={(e) =>
                            updateCalibration(
                              activeSensor.id,
                              row.id,
                              "expectedValue",
                              e.target.value
                            )
                          }
                        />

                        <button
                          type="button"
                          className="flex items-center gap-2 text-red-600"
                          onClick={() =>
                            removeCalibration(activeSensor.id, row.id)
                          }
                        >
                          <Trash2 size={18} />
                          Remove Row
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* FORM BUTTONS */}
      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        <button
          type="button"
          className="rounded-md bg-gray-500 px-5 py-3 text-white"
          onClick={resetForm}
        >
          Reset
        </button>

        {activeTab === "sensorDetails" && (
          <>
            <button
              type="button"
              className={buttonClass}
              onClick={() => setNotice("Connect Values to your export API.")}
            >
              <Download size={18} />
              Values
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={() => setNotice("Connect View Parameter to your dialog.")}
            >
              View Parameter
            </button>

            <button
              type="button"
              className={buttonClass}
              onClick={() => setNotice("Connect Import Sensor to your API.")}
            >
              Import Sensor
            </button>
          </>
        )}

        <button type="submit" className={buttonClass}>
          Save
        </button>
      </div>

      {notice && (
        <div className="rounded-md border border-purple-200 bg-purple-50 p-3 text-[#482064]">
          {notice}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setNotice("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* IMPORT FROM INVENTORY DRAWER */}
      {showInventory && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowInventory(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-[#482064] px-4 py-3 text-white">
              <h2 className="text-xl font-semibold">
                Import From Inventory
              </h2>

              <button
                type="button"
                onClick={() => setShowInventory(false)}
                aria-label="Close"
              >
                <X size={25} />
              </button>
            </div>

            <div className="p-4">
              <Field label="Imei" required>
                <SelectField
                  value={inventoryImei}
                  onChange={setInventoryImei}
                  placeholder="Select imei"
                  options={[
                    "352093081234567",
                    "352093081234568",
                    "352093081234569",
                  ]}
                  required
                />
              </Field>

              <div className="mt-14 flex justify-center">
                <button
                  type="button"
                  className={buttonClass}
                  onClick={importFromInventory}
                  disabled={!inventoryImei}
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
