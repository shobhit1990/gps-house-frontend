import { useRef, useState, type FormEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTheme } from "next-themes";
import { Download, Plus, Upload } from "lucide-react";

type CalibrationRow = {
	id: number;
	fuel: string;
	voltage: string;
	actualValue: string;
	expectedValue: string;
	descending: boolean;
};

type AddSensorFormProps = {
	onClose: () => void;
	onSubmit: (values: Record<string, string>) => void;
};

const sensorTypes = ["Fuel", "Temperature", "Door", "Voltage", "Digital Input", "Analog Input"];
const connectedOptions = ["Main Device", "GPS Device", "Secondary Device"];
const measurementTypes = ["Analog", "Digital", "Pulse", "Counter"];

export function AddSensorForm({ onClose, onSubmit }: AddSensorFormProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const fileInputRef = useRef<HTMLInputElement>(null);
	const sensorInputRef = useRef<HTMLInputElement>(null);
	const [values, setValues] = useState({
		name: "",
		sensorType: "",
		connectedTo: "",
		formula: "",
		value: "",
		inverse: false,
		rs232: false,
		showOnDashboard: false,
		type: "",
		unit: "",
		ifSensor1: "",
		ifSensor0: "",
	});
	const [rows, setRows] = useState<CalibrationRow[]>([
		{ id: 1, fuel: "", voltage: "", actualValue: "", expectedValue: "", descending: false },
	]);
	const [nextRowId, setNextRowId] = useState(2);
	const [message, setMessage] = useState("");
	const [showParameters, setShowParameters] = useState(false);

	const fieldClass = `h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.10] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-cyan-300/10"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-100"
	}`;
	const labelClass = `mb-1.5 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;
	const updateValue = (key: keyof typeof values, value: string | boolean) => {
		setValues((current) => ({ ...current, [key]: value }));
	};

	const addCalibrationRow = () => {
		setRows((current) => [
			...current,
			{ id: nextRowId, fuel: "", voltage: "", actualValue: "", expectedValue: "", descending: false },
		]);
		setNextRowId((current) => current + 1);
	};

	const updateRow = (id: number, key: keyof Omit<CalibrationRow, "id">, value: string | boolean) => {
		setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
	};

	const resetForm = () => {
		setValues({
			name: "",
			sensorType: "",
			connectedTo: "",
			formula: "",
			value: "",
			inverse: false,
			rs232: false,
			showOnDashboard: false,
			type: "",
			unit: "",
			ifSensor1: "",
			ifSensor0: "",
		});
		setRows([{ id: 1, fuel: "", voltage: "", actualValue: "", expectedValue: "", descending: false }]);
		setNextRowId(2);
		setMessage("");
		setShowParameters(false);
	};

	const downloadValues = () => {
		const content = JSON.stringify({
			...values,
			calibrationValues: rows.map(({ id: _id, ...row }) => row),
		}, null, 2);
		const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
		const link = document.createElement("a");
		link.href = url;
		link.download = `${values.name.trim() || "sensor"}-values.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const importSensorFile = async (file: File) => {
		try {
			const imported = JSON.parse(await file.text()) as Record<string, unknown>;
			const importedValues: Partial<typeof values> = {};
			const importedString = (key: string) => {
				const value = imported[key];
				return typeof value === "string" ? value : undefined;
			};
			const importedBoolean = (key: string) => {
				const value = imported[key];
				return typeof value === "boolean" ? value : typeof value === "string" ? value === "true" : undefined;
			};
			const name = importedString("sensorName");
			const sensorType = importedString("sensorType");
			const connectedTo = importedString("sensorConnectedTo");
			const formula = importedString("sensorFormula");
			const sensorValue = importedString("sensorValue");
			const inverse = importedBoolean("sensorInverse");
			const rs232 = importedBoolean("sensorRs232");
			const showOnDashboard = importedBoolean("sensorShowOnDashboard");
			const type = importedString("sensorMeasurementType");
			const unit = importedString("sensorUnit");
			const ifSensor1 = importedString("sensorIfSensor1");
			const ifSensor0 = importedString("sensorIfSensor0");
			if (name !== undefined) importedValues.name = name;
			if (sensorType !== undefined) importedValues.sensorType = sensorType;
			if (connectedTo !== undefined) importedValues.connectedTo = connectedTo;
			if (formula !== undefined) importedValues.formula = formula;
			if (sensorValue !== undefined) importedValues.value = sensorValue;
			if (inverse !== undefined) importedValues.inverse = inverse;
			if (rs232 !== undefined) importedValues.rs232 = rs232;
			if (showOnDashboard !== undefined) importedValues.showOnDashboard = showOnDashboard;
			if (type !== undefined) importedValues.type = type;
			if (unit !== undefined) importedValues.unit = unit;
			if (ifSensor1 !== undefined) importedValues.ifSensor1 = ifSensor1;
			if (ifSensor0 !== undefined) importedValues.ifSensor0 = ifSensor0;
			const calibrationRows = imported.sensorCalibrationValues;
			if (typeof calibrationRows === "string") {
				const parsedRows: unknown = JSON.parse(calibrationRows);
				if (!Array.isArray(parsedRows)) throw new Error("Sensor calibration values must be a list.");
				setRows(parsedRows.map((row, index) => {
					if (typeof row !== "object" || row === null) throw new Error("Invalid calibration row.");
					const item = row as Record<string, unknown>;
					return {
						id: index + nextRowId,
						fuel: typeof item.fuel === "string" ? item.fuel : "",
						voltage: typeof item.voltage === "string" ? item.voltage : "",
						actualValue: typeof item.actualValue === "string" ? item.actualValue : "",
						expectedValue: typeof item.expectedValue === "string" ? item.expectedValue : "",
						descending: item.descending === true || item.descending === "true",
					};
				}));
				setNextRowId((current) => current + parsedRows.length);
			}
			setValues((current) => ({ ...current, ...importedValues }));
			setMessage("Sensor settings imported.");
		} catch (error) {
			setMessage(error instanceof Error ? `Could not import sensor: ${error.message}` : "Could not import sensor file.");
		}
	};

	const importCalibrationFile = async (file: File) => {
		try {
			const lines = (await file.text()).trim().split(/\r?\n/);
			if (lines.length < 2) {
				setMessage("The CSV must include a header and at least one calibration row.");
				return;
			}

			const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
			const column = (name: string) => headers.indexOf(name);
			const fuelIndex = column("fuel");
			const voltageIndex = column("voltage");
			const actualIndex = column("actual value");
			const expectedIndex = column("expected value");
			const descendingIndex = column("desc");
			if ([fuelIndex, voltageIndex, actualIndex, expectedIndex].some((index) => index < 0)) {
				setMessage("CSV columns must be Fuel, Voltage, Actual Value, and Expected Value.");
				return;
			}

			const importedRows = lines.slice(1).filter((line) => line.trim()).map((line, index) => {
				const cells = line.split(",").map((cell) => cell.trim());
				return {
					id: nextRowId + index,
					fuel: cells[fuelIndex] ?? "",
					voltage: cells[voltageIndex] ?? "",
					actualValue: cells[actualIndex] ?? "",
					expectedValue: cells[expectedIndex] ?? "",
					descending: descendingIndex >= 0 && /^(true|yes|1)$/i.test(cells[descendingIndex] ?? ""),
				};
			});
			if (importedRows.length === 0) {
				setMessage("No calibration rows were found in the CSV.");
				return;
			}
			setRows(importedRows);
			setNextRowId(nextRowId + importedRows.length);
			setMessage(`Imported ${importedRows.length} calibration row${importedRows.length === 1 ? "" : "s"}.`);
		} catch {
			setMessage("Could not read the selected CSV file.");
		}
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSubmit({
			sensorName: values.name.trim(),
			sensorType: values.sensorType,
			sensorConnectedTo: values.connectedTo,
			sensorFormula: values.formula,
			sensorValue: values.value,
			sensorInverse: String(values.inverse),
			sensorRs232: String(values.rs232),
			sensorShowOnDashboard: String(values.showOnDashboard),
			sensorMeasurementType: values.type,
			sensorUnit: values.unit,
			sensorIfSensor1: values.ifSensor1,
			sensorIfSensor0: values.ifSensor0,
			sensorCalibrationValues: JSON.stringify(rows.map(({ id: _id, ...row }) => row)),
		});
	};

	return (
		<DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-[850] bg-slate-950/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
				<DialogPrimitive.Content
					onOpenAutoFocus={(event) => event.preventDefault()}
					className={`fixed left-1/2 top-1/2 z-[900] flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
						isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
					}`}
					aria-describedby="add-sensor-description"
				>
					<header className={`flex shrink-0 items-center justify-between border-b px-5 py-4 ${
						isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-slate-50 text-slate-900"
					}`}>
						<div>
							<DialogPrimitive.Title className="text-base font-semibold">Add Sensor</DialogPrimitive.Title>
							<DialogPrimitive.Description id="add-sensor-description" className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
								Configure sensor details and calibration values.
							</DialogPrimitive.Description>
						</div>
						<DialogPrimitive.Close
							type="button"
							onClick={onClose}
							aria-label="Close add sensor form"
							className={`rounded-lg p-2 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"}`}
						>
							<span aria-hidden="true" className="text-xl leading-none">×</span>
						</DialogPrimitive.Close>
					</header>

					<form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
						<div className="min-h-0 flex-1 overflow-y-auto p-5">
							<div className="grid items-start gap-6 lg:grid-cols-2">
								<section aria-label="Sensor details" className="grid content-start gap-3">
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Name <span className="text-rose-500">*</span></span>
										<input required value={values.name} onChange={(event) => updateValue("name", event.target.value)} placeholder="Enter Name" className={fieldClass} />
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Sensor Types <span className="text-rose-500">*</span></span>
										<select required value={values.sensorType} onChange={(event) => updateValue("sensorType", event.target.value)} className={fieldClass}>
											<option value="">Select</option>
											{sensorTypes.map((type) => <option key={type}>{type}</option>)}
										</select>
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Connected To <span className="text-rose-500">*</span></span>
										<select required value={values.connectedTo} onChange={(event) => updateValue("connectedTo", event.target.value)} className={fieldClass}>
											<option value="">Select</option>
											{connectedOptions.map((option) => <option key={option}>{option}</option>)}
										</select>
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Formula</span>
										<input value={values.formula} onChange={(event) => updateValue("formula", event.target.value)} placeholder="x/100" className={fieldClass} />
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Value</span>
										<input value={values.value} onChange={(event) => updateValue("value", event.target.value)} placeholder="Value" className={fieldClass} />
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Inverse</span>
										<input type="checkbox" checked={values.inverse} onChange={(event) => updateValue("inverse", event.target.checked)} className="h-4 w-4 rounded accent-cyan-500" />
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>RS232</span>
										<input type="checkbox" checked={values.rs232} onChange={(event) => updateValue("rs232", event.target.checked)} className="h-4 w-4 rounded accent-cyan-500" />
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Show On Dashboard</span>
										<input type="checkbox" checked={values.showOnDashboard} onChange={(event) => updateValue("showOnDashboard", event.target.checked)} className="h-4 w-4 rounded accent-cyan-500" />
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Type <span className="text-rose-500">*</span></span>
										<select required value={values.type} onChange={(event) => updateValue("type", event.target.value)} className={fieldClass}>
											<option value="">Select</option>
											{measurementTypes.map((type) => <option key={type}>{type}</option>)}
										</select>
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>Unit Of Measurement</span>
										<input value={values.unit} onChange={(event) => updateValue("unit", event.target.value)} placeholder="Unit Of Measurement" className={fieldClass} />
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>If sensor 1 (text)</span>
										<input value={values.ifSensor1} onChange={(event) => updateValue("ifSensor1", event.target.value)} placeholder="If sensor 1 (text)" className={fieldClass} />
									</label>
									<label className="grid items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
										<span className={`${labelClass} mb-0`}>If sensor 0 (text)</span>
										<input value={values.ifSensor0} onChange={(event) => updateValue("ifSensor0", event.target.value)} placeholder="If sensor 0 (text)" className={fieldClass} />
									</label>
								</section>

								<section aria-label="Calibration values" className={`min-h-[420px] rounded-xl border p-4 ${
									isDark ? "border-white/[0.10]" : "border-slate-200"
								}`}>
									<h3 className={`mb-4 text-center text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>Calibration Values</h3>
									<div className="mb-4 flex flex-wrap justify-center gap-2">
										<button type="button" onClick={addCalibrationRow} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold uppercase tracking-wide transition ${
											isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
										}`}>
											<Plus className="h-3.5 w-3.5" /> Add Calibrated Row
										</button>
										<button type="button" onClick={() => {
											setRows([{ id: nextRowId, fuel: "0", voltage: "0", actualValue: "0", expectedValue: "0", descending: false }]);
											setNextRowId((current) => current + 1);
											setMessage("Demo calibration values added.");
										}} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition ${
											isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
										}`}>
											<Download className="h-3.5 w-3.5" /> Demo
										</button>
										<button type="button" onClick={() => fileInputRef.current?.click()} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition ${
											isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
										}`}>
											<Upload className="h-3.5 w-3.5" /> Upload
										</button>
										<input
											ref={fileInputRef}
											type="file"
											accept=".csv,text/csv"
											className="sr-only"
											onChange={(event) => {
												const file = event.target.files?.[0];
												if (file) void importCalibrationFile(file);
												event.target.value = "";
											}}
										/>
									</div>
									<div className="space-y-3">
										{rows.map((row, index) => (
											<div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
												<input value={row.fuel} onChange={(event) => updateRow(row.id, "fuel", event.target.value)} placeholder="FUEL" aria-label={`Fuel, row ${index + 1}`} className={fieldClass} />
												<input value={row.voltage} onChange={(event) => updateRow(row.id, "voltage", event.target.value)} placeholder="Voltage" aria-label={`Voltage, row ${index + 1}`} className={fieldClass} />
												<button
													type="button"
													role="switch"
													aria-checked={row.descending}
													aria-label={`Descending, row ${index + 1}`}
													onClick={() => updateRow(row.id, "descending", !row.descending)}
													className="flex items-center gap-2 self-center text-[11px]"
												>
													<span className={isDark ? "text-slate-400" : "text-slate-500"}>Desc.</span>
													<span className={`relative h-[18px] w-[34px] rounded-full transition ${row.descending ? (isDark ? "bg-cyan-400" : "bg-cyan-600") : (isDark ? "bg-slate-700" : "bg-slate-300")}`}>
														<span className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-all ${row.descending ? "left-[18px]" : "left-[3px]"}`} />
													</span>
												</button>
												<input value={row.actualValue} onChange={(event) => updateRow(row.id, "actualValue", event.target.value)} placeholder="Actual Value" aria-label={`Actual value, row ${index + 1}`} className={fieldClass} />
												<input value={row.expectedValue} onChange={(event) => updateRow(row.id, "expectedValue", event.target.value)} placeholder="Expected Value" aria-label={`Expected value, row ${index + 1}`} className={fieldClass} />
											</div>
										))}
									</div>
									{message && <p role="status" className={`mt-3 text-xs ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{message}</p>}
								</section>
							</div>
							{showParameters && (
								<pre className={`mt-5 overflow-x-auto rounded-lg border p-4 text-xs ${
									isDark ? "border-white/[0.10] bg-[#03091c]/70 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"
								}`}>
									{JSON.stringify({ ...values, calibrationValues: rows.map(({ id: _id, ...row }) => row) }, null, 2)}
								</pre>
							)}
						</div>

						<footer className={`flex shrink-0 justify-end gap-2 border-t px-5 py-3 ${
							isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
						}`}>
							<button type="button" onClick={resetForm} className={`h-9 rounded-lg border px-4 text-xs font-medium transition ${
								isDark ? "border-white/[0.10] text-slate-300 hover:bg-white/[0.05]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
							}`}>Reset</button>
							<button type="button" onClick={downloadValues} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-xs font-semibold transition ${
								isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
							}`}><Download className="h-3.5 w-3.5" />Values</button>
							<button type="button" onClick={() => setShowParameters((visible) => !visible)} className={`h-9 rounded-lg border px-4 text-xs font-semibold transition ${
								isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
							}`}>{showParameters ? "Hide Parameter" : "View Parameter"}</button>
							<button type="button" onClick={() => sensorInputRef.current?.click()} className={`h-9 rounded-lg border px-4 text-xs font-semibold transition ${
								isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
							}`}>Import Sensor</button>
							<input
								ref={sensorInputRef}
								type="file"
								accept=".json,application/json"
								className="sr-only"
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (file) void importSensorFile(file);
									event.target.value = "";
								}}
							/>
							<button type="submit" className={`h-9 rounded-lg border px-4 text-xs font-semibold transition ${
								isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
							}`}>Save</button>
						</footer>
					</form>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}