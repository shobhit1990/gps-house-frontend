import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import type { VehicleFieldConfig } from "@/interfaces/AddVehicleFields";
import { addVehicleFields } from "@/interfaces/AddVehicleFields";
import type { MasterOption } from "@/interfaces/EntityMaster";
import { useGetClientMasterQuery, useGetDeviceMasterQuery, useGetTransporterMasterQuery } from "@/store/services/api/Master";
import { digitsOnly } from "@/lib/formValidation";

type AddVehicleProps = {
	isDark: boolean;
	values: Record<string, string>;
	onChange: (name: string, value: string) => void;
};

/** Backend accepts only these lowercase values for ownedBy. */
const ownedByOptions = [
	{ value: "market", label: "Market" },
	{ value: "example", label: "Example" },
] as const;
const bodyOptions = ["Lowbed", "Open", "Container", "Trailer"];

export const vehicleDetailDefaults = {
	ownerName: "",
	ownedBy: "",
	vehicleBrand: "",
	vehicleModel: "",
	vehicleBody: "",
	capacity: "0",
	manufactureDate: "",
	purchaseDate: "",
};

/** Keep the currently selected relation visible even when master list omits it. */
const withSelectedOption = (
	options: MasterOption[],
	selectedId?: string,
	selectedLabel?: string,
): MasterOption[] => {
	const id = selectedId?.trim();
	if (!id) return options;
	if (options.some((option) => option.id === id || option.externalId === id)) return options;
	return [...options, { id, name: selectedLabel?.trim() || id }];
};

const resolveSelectValue = (options: MasterOption[], selectedId: string): string => {
	if (!selectedId) return "";
	const match = options.find((option) => option.id === selectedId || option.externalId === selectedId);
	return match?.id ?? selectedId;
};

export function AddVehicle({ isDark, values, onChange }: AddVehicleProps) {
	const [detailOpen, setDetailOpen] = useState(false);
	const { data: clients = [] } = useGetClientMasterQuery();
	const {
		data: devices = [],
		isLoading: devicesLoading,
		isError: devicesError,
	} = useGetDeviceMasterQuery();
	const { data: transporters = [] } = useGetTransporterMasterQuery();
	const masterOptions = useMemo(
		() => ({
			vehicleClient: withSelectedOption(clients, values.vehicleClient, values.vehicleClientLabel),
			vehicleDevice: withSelectedOption(devices, values.vehicleDevice, values.vehicleDeviceLabel),
			vehicleTransporter: withSelectedOption(
				transporters,
				values.vehicleTransporter,
				values.vehicleTransporterLabel,
			),
		}),
		[
			clients,
			devices,
			transporters,
			values.vehicleClient,
			values.vehicleClientLabel,
			values.vehicleDevice,
			values.vehicleDeviceLabel,
			values.vehicleTransporter,
			values.vehicleTransporterLabel,
		],
	);
	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;

	const renderField = (field: VehicleFieldConfig) => {
		const value = values[field.name] ?? "";
		const label = (
			<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
				{field.label}{field.required && <span className="ml-0.5 text-rose-500">*</span>}
			</span>
		);

		if (field.type === "checkbox") {
			return (
				<label key={field.name} className={`flex cursor-pointer items-center gap-2.5 text-[12px] font-medium ${
					isDark ? "text-slate-300" : "text-slate-700"
				}`}>
					<input
						type="checkbox"
						checked={value === "true"}
						onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(field.name, String(event.target.checked))}
						className="h-4 w-4 rounded border-slate-400 accent-cyan-500"
					/>
					{field.label}
				</label>
			);
		}

		const relationOptions = masterOptions[field.name as keyof typeof masterOptions];
		const selectValue = relationOptions ? resolveSelectValue(relationOptions, value) : value;

		return (
			<label key={field.name} className="block min-w-0">
				{label}
				{field.type === "select" ? (
					<span className="relative block">
						<select
							value={selectValue}
							required={field.required}
							disabled={field.name === "vehicleDevice" && devicesLoading}
							onChange={(event) => onChange(field.name, event.target.value)}
							className={`${inputClass} appearance-none pr-9`}
						>
							{field.options?.map((option, index) => (
								<option key={option} value={index === 0 && option.startsWith("Select ") ? "" : option}>
									{field.optionLabels?.[option] ?? option}
								</option>
							))}
							{relationOptions?.map((option) => (
								<option key={option.id} value={option.id}>{option.name}</option>
							))}
						</select>
						<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>⌄</span>
					</span>
				) : (
					<input
						type={field.type ?? "text"}
						value={value}
						required={field.required}
						placeholder={field.placeholder}
						onChange={(event) => onChange(field.name, event.target.value)}
						className={inputClass}
					/>
				)}
				{field.name === "vehicleDevice" && devicesError && (
					<span role="alert" className="mt-1 block text-[11px] text-rose-500">
						Could not load devices.
					</span>
				)}
				{field.helper && (
					<span className={`mt-1 block text-[11px] font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}>
						{field.helper}
					</span>
				)}
			</label>
		);
	};

	const detailValue = (name: keyof typeof vehicleDetailDefaults) => values[name] ?? vehicleDetailDefaults[name];

	const detailField = (label: string, control: ReactNode) => (
		<label className="block min-w-0">
			<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
			{control}
		</label>
	);

	const detailSelect = (
		name: keyof typeof vehicleDetailDefaults,
		placeholder: string,
		options: readonly string[] | readonly { value: string; label: string }[],
	) => (
		<span className="relative block">
			<select
				value={detailValue(name)}
				onChange={(event) => onChange(name, event.target.value)}
				className={`${inputClass} appearance-none pr-9`}
			>
				<option value="">{placeholder}</option>
				{options.map((option) => {
					const value = typeof option === "string" ? option : option.value;
					const label = typeof option === "string" ? option : option.label;
					return (
						<option key={value} value={value}>{label}</option>
					);
				})}
			</select>
			<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">⌄</span>
		</span>
	);

	return (
		<section aria-label="Add vehicle details">
			<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
				{addVehicleFields.filter((field) => field.type !== "checkbox").map(renderField)}
			</div>
			<div className="mt-4 flex flex-col items-start gap-3">
				{addVehicleFields.filter((field) => field.type === "checkbox").map(renderField)}
			</div>

			<p className={`mt-4 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
				Note : (*) marked are mandatory fields.
			</p>

			<div className={`mt-3 overflow-hidden rounded-lg border ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
				<button
					type="button"
					onClick={() => setDetailOpen((open) => !open)}
					aria-expanded={detailOpen}
					className={`flex h-11 w-full items-center justify-between px-4 text-left text-[13px] font-semibold ${
						isDark ? "bg-white/[0.04] text-slate-100 hover:bg-white/[0.06]" : "bg-slate-100 text-slate-800 hover:bg-slate-200/70"
					}`}
				>
					Add Vehicle Detail
					{detailOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
				</button>
				{detailOpen && (
					<div className={`grid grid-cols-1 gap-x-6 gap-y-4 border-t px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
						{detailField("Owner Name", (
							<input
								value={detailValue("ownerName")}
								placeholder="Owner Name"
								onChange={(event) => onChange("ownerName", event.target.value)}
								className={inputClass}
							/>
						))}
						{detailField("Owned By", detailSelect("ownedBy", "Select", ownedByOptions))}
						{detailField("Vehicle Brand", (
							<input
								value={detailValue("vehicleBrand")}
								placeholder="Vehicle Brand"
								onChange={(event) => onChange("vehicleBrand", event.target.value)}
								className={inputClass}
							/>
						))}
						{detailField("Vehicle Model", (
							<input
								value={detailValue("vehicleModel")}
								placeholder="Vehicle Model"
								onChange={(event) => onChange("vehicleModel", event.target.value)}
								className={inputClass}
							/>
						))}
						{detailField("Vehicle Body", detailSelect("vehicleBody", "Select", bodyOptions))}
						{detailField("Capacity", (
							<input
								type="text"
								inputMode="numeric"
								value={detailValue("capacity")}
								onChange={(event) => onChange("capacity", digitsOnly(event.target.value))}
								className={inputClass}
							/>
						))}
						{detailField("Manufacture Date", (
							<input
								type="date"
								value={detailValue("manufactureDate")}
								onChange={(event) => onChange("manufactureDate", event.target.value)}
								className={inputClass}
							/>
						))}
						{detailField("Purchase Date", (
							<input
								type="date"
								value={detailValue("purchaseDate")}
								onChange={(event) => onChange("purchaseDate", event.target.value)}
								className={inputClass}
							/>
						))}
					</div>
				)}
			</div>
		</section>
	);
}