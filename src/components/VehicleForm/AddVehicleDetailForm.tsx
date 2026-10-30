import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import { useGetClientMasterQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import { ServiceMaintenanceForm, type ServiceMaintenanceHandle, type ServiceMaintenanceValues } from "@/components/VehicleForm/ServiceMaintenanceForm";

export type VehicleDetailFormValues = {
	client: string;
	transporter: string;
	vehicleNo: string;
	ownerName: string;
	ownedBy: string;
	vehicleBrand: string;
	vehicleModel: string;
	vehicleBody: string;
	capacity: string;
	manufactureDate: string;
	purchaseDate: string;
};

type AddVehicleDetailFormProps = {
	onClose: () => void;
	onSubmit: (values: VehicleDetailFormValues) => void;
	onSaveService: (values: ServiceMaintenanceValues) => void;
};

const tabs = ["Add Vehicle Detail", "Service And Maintenance"] as const;
type DetailTab = (typeof tabs)[number];

const ownedByOptions = ["market", "own"];
const bodyOptions = ["Lowbed", "Open", "Container", "Trailer"];

const today = () => {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
};

const detailDefaults = (): VehicleDetailFormValues => ({
	client: "",
	transporter: "",
	vehicleNo: "",
	ownerName: "",
	ownedBy: "",
	vehicleBrand: "",
	vehicleModel: "",
	vehicleBody: "",
	capacity: "0",
	manufactureDate: today(),
	purchaseDate: today(),
});

export function AddVehicleDetailForm({ onClose, onSubmit, onSaveService }: AddVehicleDetailFormProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const serviceRef = useRef<ServiceMaintenanceHandle>(null);
	const { data: clients = [] } = useGetClientMasterQuery();
	const { data: transporters = [] } = useGetTransporterMasterQuery();
	const { data: vehicles = [] } = useGetVehicleMasterQuery();
	const [activeTab, setActiveTab] = useState<DetailTab>(tabs[0]);
	const [values, setValues] = useState<VehicleDetailFormValues>(detailDefaults);
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
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08] [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `block min-w-0 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const update = (name: keyof VehicleDetailFormValues, value: string) => {
		setValues((current) => ({ ...current, [name]: value }));
		setFormError("");
	};

	const resetTab = () => {
		if (activeTab === "Service And Maintenance") serviceRef.current?.reset();
		else setValues(detailDefaults());
		setFormError("");
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (activeTab === "Service And Maintenance") {
			const result = serviceRef.current?.submit();
			if (!result || "error" in result) {
				setFormError(result && "error" in result ? result.error : "Select a type.");
				return;
			}
			onSaveService(result.values);
			return;
		}
		if (!values.client || !values.transporter || !values.vehicleNo) {
			setFormError("Client, Transporter, and Vehicle are required.");
			return;
		}
		onSubmit({ ...values, capacity: values.capacity.trim() || "0" });
	};

	const field = (label: string, control: ReactNode, required?: boolean) => (
		<label className={labelClass}>
			<span className="mb-1.5 flex items-center gap-1">
				{label}
				{required ? <span className="text-rose-400">*</span> : null}
			</span>
			{control}
		</label>
	);

	const select = (name: keyof VehicleDetailFormValues, placeholder: string, options: string[], required?: boolean) => (
		<select required={required} value={values[name]} onChange={(event) => update(name, event.target.value)} className={inputClass}>
			<option value="">{placeholder}</option>
			{options.map((option) => <option key={option} value={option}>{option}</option>)}
		</select>
	);

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<form
				onSubmit={handleSubmit}
				className={`flex max-h-[96vh] w-full max-w-[1160px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
				aria-labelledby={titleId}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<h2 id={titleId} className="text-[15px] font-semibold">Add Vehicle Detail</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close vehicle detail form" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<nav aria-label="Vehicle detail sections" className="shrink-0 overflow-x-auto px-5 pt-4 sm:px-6">
					<div className={`flex min-w-max border-b ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
						{tabs.map((tab) => (
							<button
								key={tab}
								type="button"
								onClick={() => { setActiveTab(tab); setFormError(""); }}
								aria-current={activeTab === tab ? "step" : undefined}
								className={`min-h-[36px] whitespace-nowrap border-b px-4 text-[12px] transition ${
									activeTab === tab
										? isDark
											? "border-cyan-300/40 bg-cyan-300/[0.08] font-semibold text-cyan-100"
											: "border-cyan-500 bg-cyan-50 font-semibold text-cyan-800"
										: isDark
											? "border-transparent font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
											: "border-transparent font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
								}`}
							>
								{tab}
							</button>
						))}
					</div>
				</nav>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
					{formError && (
						<p role="alert" className={`mb-5 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
							{formError}
						</p>
					)}
					{activeTab === "Add Vehicle Detail" ? (
						<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
							{field("Client", select("client", "Select Client", clients.map((client) => client.name), true), true)}
							{field("Transporter", select("transporter", "Select Transporter", transporters.map((transporter) => transporter.name), true), true)}
							{field("Vehicle", select("vehicleNo", "Select", vehicles.map((vehicle) => vehicle.name), true), true)}
							{field("Owner Name", <input value={values.ownerName} placeholder="Owner Name" onChange={(event) => update("ownerName", event.target.value)} className={inputClass} />)}
							{field("Owned By", select("ownedBy", "Select", ownedByOptions))}
							{field("Vehicle Brand", <input value={values.vehicleBrand} placeholder="Vehicle Brand" onChange={(event) => update("vehicleBrand", event.target.value)} className={inputClass} />)}
							{field("Vehicle Model", <input value={values.vehicleModel} placeholder="Vehicle Model" onChange={(event) => update("vehicleModel", event.target.value)} className={inputClass} />)}
							{field("Vehicle Body", select("vehicleBody", "Select", bodyOptions))}
							{field("Capacity", <input type="number" min={0} value={values.capacity} onChange={(event) => update("capacity", event.target.value)} className={inputClass} />)}
							{field("Manufacture Date", <input type="date" value={values.manufactureDate} onChange={(event) => update("manufactureDate", event.target.value)} className={inputClass} />)}
							{field("Purchase Date", <input type="date" value={values.purchaseDate} onChange={(event) => update("purchaseDate", event.target.value)} className={inputClass} />)}
						</div>
					) : (
						<ServiceMaintenanceForm ref={serviceRef} />
					)}
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button type="button" onClick={resetTab} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
						Reset
					</button>
					<button type="submit" className={`h-9 rounded-lg border px-4 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						Save
					</button>
				</footer>
			</form>
		</div>
	);
}
