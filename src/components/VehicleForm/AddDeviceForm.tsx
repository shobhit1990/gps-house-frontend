import { useState, type ChangeEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Eye, EyeOff } from "lucide-react";
import { addDeviceFields } from "@/interfaces/AddDeviceFields";
import type { VehicleFieldConfig } from "@/interfaces/AddVehicleFields";

const inventoryImeis = [
	"358657100887871",
	"356857100874929",
	"354778340022949",
	"867230520231296",
];

const confirmOnEnable = new Set(["ignitionPositive", "ignitionDisconnected"]);

type AddDeviceProps = {
	isDark: boolean;
	values: Record<string, string>;
	onChange: (name: string, value: string) => void;
	onConfirm?: (field: VehicleFieldConfig) => void;
};

export function AddDevice({ isDark, values, onChange, onConfirm }: AddDeviceProps) {
	const [inventoryOpen, setInventoryOpen] = useState(false);
	const [selectedImei, setSelectedImei] = useState("");
	const [inventoryError, setInventoryError] = useState("");
	const [passwordVisible, setPasswordVisible] = useState(false);

	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;

	const openInventory = () => {
		setSelectedImei("");
		setInventoryError("");
		setInventoryOpen(true);
	};

	const importImei = () => {
		if (!selectedImei) {
			setInventoryError("Select an IMEI to import.");
			return;
		}
		onChange("imei", selectedImei);
		setInventoryOpen(false);
	};

	const renderField = (field: VehicleFieldConfig) => {
		const value = values[field.name] ?? "";

		if (field.type === "checkbox") {
			return (
				<label
					key={field.name}
					className={`flex cursor-pointer items-center gap-2.5 text-[12px] font-medium ${
						isDark ? "text-slate-300" : "text-slate-700"
					}`}
				>
					<input
						type="checkbox"
						checked={value === "true"}
						onChange={(event: ChangeEvent<HTMLInputElement>) => {
							if (event.target.checked && confirmOnEnable.has(field.name) && onConfirm) {
								onConfirm(field);
								return;
							}
							onChange(field.name, String(event.target.checked));
						}}
						className="h-4 w-4 rounded border-slate-400 accent-cyan-500"
					/>
					{field.label}
				</label>
			);
		}

		return (
			<label key={field.name} className="block min-w-0">
				<span className={`mb-1.5 flex items-center justify-between gap-2 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
					<span>
						{field.label}
						{field.required && <span className="ml-0.5 text-rose-500">*</span>}
						{field.optional && (
							<span className={`ml-1 font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}>(Optional)</span>
						)}
					</span>
					{field.actionLabel && (
						<button
							type="button"
							onClick={openInventory}
							className={`shrink-0 text-[11px] font-medium underline underline-offset-2 ${
								isDark ? "text-cyan-300 hover:text-cyan-200" : "text-cyan-700 hover:text-cyan-800"
							}`}
						>
							{field.actionLabel}
						</button>
					)}
				</span>
				{field.type === "select" ? (
					<span className="relative block">
						<select
							value={value}
							required={field.required}
							onChange={(event) => onChange(field.name, event.target.value)}
							className={`${inputClass} appearance-none pr-9`}
						>
							{field.options?.map((option, index) => (
								<option key={option} value={index === 0 && option.startsWith("Select ") ? "" : option}>
									{option}
								</option>
							))}
						</select>
						<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>⌄</span>
					</span>
				) : (
					<span className="relative flex">
						<input
							type={field.type === "password" && passwordVisible ? "text" : field.type ?? "text"}
							value={value}
							required={field.required}
							placeholder={field.placeholder}
							maxLength={field.maxLength}
							inputMode={field.inputMode}
							pattern={field.pattern}
							onChange={(event) => {
								const nextValue = field.inputMode === "numeric"
									? event.target.value.replace(/\D/g, "").slice(0, field.maxLength)
									: event.target.value;
								onChange(field.name, nextValue);
							}}
							className={`${inputClass} min-w-0 ${field.type === "password" ? "pr-11" : ""}`}
						/>
						{field.type === "password" && (
							<button
								type="button"
								onClick={() => setPasswordVisible((visible) => !visible)}
								aria-label={passwordVisible ? "Hide password" : "Show password"}
								className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md ${
									isDark ? "text-slate-400 hover:text-cyan-100" : "text-slate-500 hover:text-cyan-700"
								}`}
							>
								{passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						)}
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

	const textFields = addDeviceFields.filter((field) => field.type !== "checkbox");
	const checkboxFields = addDeviceFields.filter((field) => field.type === "checkbox");

	return (
		<section aria-label="Add device">
			<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
				{textFields.map(renderField)}
			</div>
			<div className="mt-5 flex flex-col items-start gap-3">
				{checkboxFields.map(renderField)}
			</div>

			<DialogPrimitive.Root open={inventoryOpen} onOpenChange={setInventoryOpen}>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="fixed inset-0 z-[860] bg-[#020718]/70 backdrop-blur-sm" />
					<DialogPrimitive.Content
						onOpenAutoFocus={(event) => event.preventDefault()}
						aria-describedby="import-inventory-description"
						className={`fixed left-1/2 top-1/2 z-[870] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
						}`}
					>
						<header className={`flex items-center justify-between border-b px-5 py-4 ${
							isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-slate-50 text-slate-900"
						}`}>
							<div>
								<DialogPrimitive.Title className="text-[15px] font-semibold">Import From Inventory</DialogPrimitive.Title>
								<DialogPrimitive.Description id="import-inventory-description" className={`mt-0.5 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
									Choose an IMEI from stock and import it into this device.
								</DialogPrimitive.Description>
							</div>
							<DialogPrimitive.Close
								type="button"
								aria-label="Close import from inventory"
								className={`rounded-lg p-1.5 transition ${
									isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
								}`}
							>
								<span aria-hidden="true" className="text-xl leading-none">×</span>
							</DialogPrimitive.Close>
						</header>

						<div className="px-5 pb-8 pt-5">
							<label className="block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									Imei <span className="text-rose-500">*</span>
								</span>
								<span className="relative block">
									<select
										value={selectedImei}
										onChange={(event) => {
											setSelectedImei(event.target.value);
											setInventoryError("");
										}}
										className={`${inputClass} appearance-none pr-9`}
										aria-invalid={inventoryError ? true : undefined}
									>
										<option value="">Select imei</option>
										{inventoryImeis.map((imei) => (
											<option key={imei} value={imei}>{imei}</option>
										))}
									</select>
									<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>⌄</span>
								</span>
							</label>
							{inventoryError && (
								<p role="alert" className="mt-2 text-[11px] text-rose-400">{inventoryError}</p>
							)}
							<div className="mt-10 flex justify-center">
								<button
									type="button"
									onClick={importImei}
									className={`h-10 min-w-[132px] rounded-lg border px-6 text-[13px] font-semibold transition ${
										isDark
											? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
											: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
									}`}
								>
									Import
								</button>
							</div>
						</div>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</section>
	);
}
