import { useEffect, useId, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { Download, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";

export type UploadedDriver = {
	name: string;
	vehicle: string;
	active: boolean;
	assigned: boolean;
	joiningDate: string;
	leavingDate: string;
	insuranceNo: string;
	insuranceExpiry: string;
	licenseAvailable: boolean;
	licenseNumber: string;
	licenseType: string;
	licenseIssue: string;
	licenseExpiry: string;
	mediclaimNo: string;
	mediclaimExpiry: string;
	experience: number;
	age: number;
	phone: string;
	address: string;
	bloodGroup: string;
	supervisorName: string;
	supervisorPhone: string;
};

export type UploadDriverValues = {
	client: string;
	transporter: string;
	drivers: UploadedDriver[];
};

type UploadDriverFormProps = {
	onClose: () => void;
	onSubmit: (values: UploadDriverValues) => void;
};

const clients = ["arun.singh", "tushar.shukla"];
const transporters = ["Aviator", "vicky.9", "vga", "rahul.sharma"];

const templateColumns = [
	"Name",
	"Vehicle",
	"Active",
	"Assigned",
	"D.O.J",
	"D.O.L",
	"Insurance No",
	"Insurance Expiry Date",
	"License Available",
	"License Number",
	"License Type",
	"License Issue",
	"License Expiry Date",
	"Mediclaim No",
	"Mediclaim Expiry Date",
	"Experience",
	"Age",
	"Phone No",
	"Address",
	"Blood Group",
	"Supervisor Name",
	"Supervisor Phone No.",
] as const;

const sampleRow: Record<(typeof templateColumns)[number], string> = {
	Name: "Rahul Verma",
	Vehicle: "UP32HN8013",
	Active: "Yes",
	Assigned: "No",
	"D.O.J": "22/10/2026",
	"D.O.L": "22/10/2026",
	"Insurance No": "",
	"Insurance Expiry Date": "22/10/2026",
	"License Available": "Yes",
	"License Number": "",
	"License Type": "LMV",
	"License Issue": "22/10/2026",
	"License Expiry Date": "22/10/2026",
	"Mediclaim No": "",
	"Mediclaim Expiry Date": "22/10/2026",
	Experience: "0",
	Age: "18",
	"Phone No": "",
	Address: "",
	"Blood Group": "",
	"Supervisor Name": "",
	"Supervisor Phone No.": "",
};

const cell = (row: Record<string, unknown>, key: string) => String(row[key] ?? "").trim();

const toIsoDate = (value: string) => {
	const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
	if (!match) return value;
	return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
};

const asYes = (value: string) => /^(y|yes|true|1|active)$/i.test(value);
const asNumber = (value: string) => {
	const number = Number(value);
	return Number.isFinite(number) ? number : 0;
};

const readDrivers = async (file: File) => {
	const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
	const sheet = workbook.Sheets[workbook.SheetNames[0]];
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
	return rows
		.map((row) => ({
			name: cell(row, "Name"),
			vehicle: cell(row, "Vehicle"),
			active: asYes(cell(row, "Active")),
			assigned: asYes(cell(row, "Assigned")),
			joiningDate: toIsoDate(cell(row, "D.O.J")),
			leavingDate: toIsoDate(cell(row, "D.O.L")),
			insuranceNo: cell(row, "Insurance No"),
			insuranceExpiry: toIsoDate(cell(row, "Insurance Expiry Date")),
			licenseAvailable: asYes(cell(row, "License Available")),
			licenseNumber: cell(row, "License Number"),
			licenseType: cell(row, "License Type"),
			licenseIssue: toIsoDate(cell(row, "License Issue")),
			licenseExpiry: toIsoDate(cell(row, "License Expiry Date")),
			mediclaimNo: cell(row, "Mediclaim No"),
			mediclaimExpiry: toIsoDate(cell(row, "Mediclaim Expiry Date")),
			experience: asNumber(cell(row, "Experience")),
			age: asNumber(cell(row, "Age")),
			phone: cell(row, "Phone No"),
			address: cell(row, "Address"),
			bloodGroup: cell(row, "Blood Group"),
			supervisorName: cell(row, "Supervisor Name"),
			supervisorPhone: cell(row, "Supervisor Phone No."),
		}))
		.filter((driver) => driver.name);
};

export function UploadDriverForm({ onClose, onSubmit }: UploadDriverFormProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [client, setClient] = useState("");
	const [transporter, setTransporter] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [formError, setFormError] = useState("");

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const inputClass = `h-[37px] w-full rounded-lg border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-900 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `block min-w-0 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const downloadDemo = () => {
		const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: [...templateColumns] });
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Drivers");
		XLSX.writeFile(workbook, "driver-upload-demo.xlsx");
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!client || !transporter || !file) {
			setFormError("Client, Transporter, and a file are required.");
			return;
		}
		try {
			const drivers = await readDrivers(file);
			if (drivers.length === 0) {
				setFormError("The file has no driver names. Use the Demo file as the column layout.");
				return;
			}
			onSubmit({ client, transporter, drivers });
		} catch {
			setFormError("That file could not be read. Choose an Excel or CSV file.");
		}
	};

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<form
				onSubmit={handleSubmit}
				className={`flex max-h-[96vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
				aria-labelledby={titleId}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<h2 id={titleId} className="text-[15px] font-semibold">Upload Driver</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close upload driver form" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
					<p className={`rounded-lg border px-4 py-3 text-[12px] ${isDark ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
						Upload the excel file to add drivers.
					</p>
					{formError && (
						<p role="alert" className={`mt-4 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
							{formError}
						</p>
					)}
					<div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
						<label className={labelClass}>
							<span className="mb-1.5 flex items-center gap-1">Client <span className="text-rose-400">*</span></span>
							<select required value={client} onChange={(event) => { setClient(event.target.value); setFormError(""); }} className={inputClass}>
								<option value="">Select Client</option>
								{clients.map((option) => <option key={option} value={option}>{option}</option>)}
							</select>
						</label>
						<label className={labelClass}>
							<span className="mb-1.5 flex items-center gap-1">Transporter <span className="text-rose-400">*</span></span>
							<select required value={transporter} onChange={(event) => { setTransporter(event.target.value); setFormError(""); }} className={inputClass}>
								<option value="">Select Transporter</option>
								{transporters.map((option) => <option key={option} value={option}>{option}</option>)}
							</select>
						</label>
						<label className={labelClass}>
							<span className="mb-1.5 flex items-center gap-1">Select File <span className="text-rose-400">*</span></span>
							<input
								required
								type="file"
								accept=".xlsx,.xls,.csv"
								aria-label="Select File"
								onChange={(event) => { setFile(event.target.files?.[0] ?? null); setFormError(""); }}
								className={`h-[37px] w-full rounded-lg border px-2 text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:text-[12px] file:font-medium ${isDark ? "border-white/[0.09] bg-[#03091c]/70 text-slate-400 file:text-slate-200" : "border-slate-200 bg-white text-slate-600 file:text-slate-700"}`}
							/>
						</label>
					</div>
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button type="button" onClick={downloadDemo} className={`flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
						<Download className="h-3.5 w-3.5" /> Demo
					</button>
					<button type="submit" className={`flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						<Upload className="h-3.5 w-3.5" /> Upload
					</button>
				</footer>
			</form>
		</div>
	);
}
