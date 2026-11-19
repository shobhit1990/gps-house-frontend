import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { CloudUpload, X } from "lucide-react";

type CertificateValues = {
	vehicleNumber: string;
	deviceImei: string;
	deviceType: string;
	chassisNumber: string;
	engineNumber: string;
	customerName: string;
	customerPhone: string;
	customerAddress: string;
	registrationDate: string;
	invoiceNumber: string;
	invoiceDate: string;
	dueDate: string;
};

type CertificateFiles = {
	chassisImage: File | null;
	engineImage: File | null;
	imeiImage: File | null;
	vehicleImage: File | null;
};

type VehicleCertificateDialogProps = {
	vehicleNo: string;
	imei?: string;
	deviceType?: string;
	onClose: () => void;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const textFields: {
	name: keyof CertificateValues;
	label: string;
	placeholder: string;
	required?: boolean;
	type?: "text" | "date" | "tel";
}[] = [
	{ name: "vehicleNumber", label: "Vehicle Number", placeholder: "Vehicle Number", required: true },
	{ name: "deviceImei", label: "Device Imei", placeholder: "Device Imei" },
	{ name: "deviceType", label: "Device Type", placeholder: "Device Type" },
	{ name: "chassisNumber", label: "Chassis Number", placeholder: "Chassis Number" },
	{ name: "engineNumber", label: "Engine Number", placeholder: "Engine Number" },
	{ name: "customerName", label: "Customer Name", placeholder: "Customer Name" },
	{ name: "customerPhone", label: "Customer Phone No.", placeholder: "Customer Phone No.", type: "tel" },
	{ name: "customerAddress", label: "Customer Address", placeholder: "Customer Address" },
	{ name: "registrationDate", label: "Registration Date", placeholder: "", type: "date" },
	{ name: "invoiceNumber", label: "Invoice Number", placeholder: "Invoice Number" },
	{ name: "invoiceDate", label: "Invoice Date", placeholder: "", type: "date" },
	{ name: "dueDate", label: "Due Date", placeholder: "", type: "date" },
];

const fileFields: { name: keyof CertificateFiles; label: string }[] = [
	{ name: "chassisImage", label: "Chassis Number Image" },
	{ name: "engineImage", label: "Engine Number Image" },
	{ name: "imeiImage", label: "Imei No. Image" },
	{ name: "vehicleImage", label: "Vehicle Number Image" },
];

export function VehicleCertificateDialog({
	vehicleNo,
	imei = "",
	deviceType = "",
	onClose,
}: VehicleCertificateDialogProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [values, setValues] = useState<CertificateValues>({
		vehicleNumber: vehicleNo === "—" ? "" : vehicleNo,
		deviceImei: imei === "—" ? "" : imei,
		deviceType: deviceType === "—" ? "" : deviceType,
		chassisNumber: "",
		engineNumber: "",
		customerName: "",
		customerPhone: "",
		customerAddress: "",
		registrationDate: todayInputValue(),
		invoiceNumber: "",
		invoiceDate: todayInputValue(),
		dueDate: "",
	});
	const [files, setFiles] = useState<CertificateFiles>({
		chassisImage: null,
		engineImage: null,
		imeiImage: null,
		vehicleImage: null,
	});

	const setValue = (name: keyof CertificateValues, value: string) => {
		setValues((current) => ({ ...current, [name]: value }));
	};

	const setFile = (name: keyof CertificateFiles, event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;
		setFiles((current) => ({ ...current, [name]: file }));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		// API not wired yet — UI only.
		onClose();
	};

	const inputClass = `h-10 w-full rounded-lg border px-3 text-xs outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `mb-1.5 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;
	const fileCardClass = `rounded-xl border p-3 ${
		isDark ? "border-white/[0.08] bg-[#08142e]/60" : "border-slate-200 bg-slate-50"
	}`;

	return (
		<div
			className={`fixed inset-0 z-[830] flex items-center justify-center p-3 backdrop-blur-sm sm:p-4 ${
				isDark ? "bg-[#020718]/80" : "bg-slate-900/50"
			}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape") onClose();
			}}
		>
			<form
				role="dialog"
				aria-modal="true"
				aria-labelledby="vehicle-certificate-title"
				onSubmit={handleSubmit}
				className={`flex max-h-[96vh] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
				}`}
			>
				<header
					className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${
						isDark ? "border-white/[0.08] bg-[#08142e]" : "border-slate-200 bg-slate-50"
					}`}
				>
					<h2
						id="vehicle-certificate-title"
						className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
					>
						Certificate Add
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close certificate dialog"
						className={`rounded-lg p-1.5 transition ${
							isDark
								? "text-slate-400 hover:bg-white/[0.06] hover:text-white"
								: "text-slate-500 hover:bg-slate-200"
						}`}
					>
						<X className="h-4 w-4" />
					</button>
				</header>

				<div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
					<div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
						{textFields.map((field) => (
							<label key={field.name} className="block min-w-0">
								<span className={labelClass}>
									{field.label}
									{field.required ? <span className="ml-0.5 text-rose-500">*</span> : null}
								</span>
								<input
									required={field.required}
									type={field.type ?? "text"}
									value={values[field.name]}
									onChange={(event) => setValue(field.name, event.target.value)}
									placeholder={field.placeholder}
									className={inputClass}
								/>
							</label>
						))}
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						{fileFields.map((field) => (
							<div key={field.name} className={fileCardClass}>
								<div className="mb-2 flex items-center justify-between gap-2">
									<span className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
										{field.label}
									</span>
									<span
										className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
											isDark
												? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200"
												: "border-cyan-200 bg-cyan-50 text-cyan-700"
										}`}
										aria-hidden
									>
										<CloudUpload className="h-3.5 w-3.5" />
									</span>
								</div>
								<label className="block">
									<span className="sr-only">{field.label}</span>
									<input
										type="file"
										accept="image/*"
										onChange={(event) => setFile(field.name, event)}
										className={`block w-full text-[11px] file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold ${
											isDark
												? "text-slate-400 file:bg-cyan-300/[0.12] file:text-cyan-100"
												: "text-slate-600 file:bg-cyan-50 file:text-cyan-700"
										}`}
									/>
									{files[field.name] ? (
										<span className={`mt-1.5 block text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
											{files[field.name]?.name}
										</span>
									) : null}
								</label>
							</div>
						))}
					</div>
				</div>

				<footer
					className={`flex shrink-0 justify-end gap-2 border-t px-5 py-3 ${
						isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
					}`}
				>
					<button
						type="button"
						onClick={onClose}
						className={`h-9 rounded-lg border px-4 text-xs font-medium ${
							isDark
								? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]"
								: "border-slate-200 text-slate-700 hover:bg-slate-50"
						}`}
					>
						Cancel
					</button>
					<button
						type="submit"
						className={`h-9 rounded-lg border px-4 text-xs font-semibold ${
							isDark
								? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
								: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
						}`}
					>
						Save And Print
					</button>
				</footer>
			</form>
		</div>
	);
}
