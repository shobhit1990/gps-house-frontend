import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { SimOperator } from "@/enums/SimOperator";
import type { CreateDeviceRequest } from "@/interfaces/AddDevice";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import {
	useCreateDeviceMutation,
	useLazyGetAvailableDeviceInventoryQuery,
	useLazyGetDeviceInventoryByImeiQuery,
} from "@/store/services/api/AddDevice";
import { useGetClientMasterQuery, useGetDeviceTypeMasterQuery } from "@/store/services/api/Master";

type AddDeviceFormProps = {
	isDark: boolean;
	onClose?: () => void;
	onSaved?: (externalId: string) => void;
};

const simOperators = Object.values(SimOperator);

const initialDevice = {
	imei: "",
	simNumber: "",
	simOperator: SimOperator.AIRTEL_GPRS,
	secondarySimNumber: "",
	secondarySimOperator: SimOperator.AIRTEL_GPRS,
	deviceType: "",
	client: "",
	password: "",
	active: true,
	ignitionPositive: false,
	ignitionNotConnected: false,
	acPositive: false,
	attendance: false,
	timezone: false,
};

const refId = (value: unknown): string => {
	if (typeof value === "string" || typeof value === "number") return String(value);
	if (value && typeof value === "object") {
		const record = value as { externalId?: string; id?: string | number };
		return String(record.externalId ?? record.id ?? "");
	}
	return "";
};

function Field({
	label,
	required,
	children,
	hint,
	isDark,
	action,
}: {
	label: string;
	required?: boolean;
	children: ReactNode;
	hint?: string;
	isDark: boolean;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-w-0 flex-col">
			<div className="mb-1.5 flex min-h-5 items-center justify-between gap-2">
				<label className={`text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
					{label}
					{required ? <span className="ml-0.5 text-rose-400">*</span> : null}
				</label>
				{action}
			</div>
			{children}
			<p className={`mt-1 min-h-4 text-[11px] ${hint ? "text-slate-500" : "invisible"}`}>{hint || " "}</p>
		</div>
	);
}

function SelectField({
	value,
	onChange,
	options,
	placeholder = "Select",
	required = false,
	inputClass,
	disabled = false,
}: {
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	placeholder?: string;
	required?: boolean;
	inputClass: string;
	disabled?: boolean;
}) {
	return (
		<div className="relative">
			<select
				className={`${inputClass} appearance-none pr-9`}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				required={required}
				disabled={disabled}
			>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<ChevronDown
				size={16}
				className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
			/>
		</div>
	);
}

export default function AddDeviceForm({ isDark, onClose, onSaved }: AddDeviceFormProps) {
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const { data: deviceTypes = [], isLoading: deviceTypesLoading } = useGetDeviceTypeMasterQuery();
	const [createDevice, { isLoading: isSaving }] = useCreateDeviceMutation();
	const [getAvailableInventory, { data: availableInventory = [], isFetching: isLoadingInventory }] =
		useLazyGetAvailableDeviceInventoryQuery();
	const [getInventoryByImei, { isFetching: isImporting }] = useLazyGetDeviceInventoryByImeiQuery();

	const [showInventory, setShowInventory] = useState(false);
	const [inventoryImei, setInventoryImei] = useState("");
	const [inventoryError, setInventoryError] = useState("");
	const [formError, setFormError] = useState("");
	const [device, setDevice] = useState(initialDevice);

	const deviceTypeOptions = useMemo(
		() =>
			deviceTypes
				.map((item) => ({
					value: String(item.externalId ?? item.id ?? ""),
					label: item.deviceName ?? item.deviceTypeName ?? "",
				}))
				.filter((item) => item.value && item.label),
		[deviceTypes],
	);

	const clientOptions = useMemo(
		() =>
			clients
				.map((client) => ({
					value: String(client.id ?? ""),
					label: client.name ?? "",
				}))
				.filter((client) => client.value && client.label),
		[clients],
	);

	const inventoryOptions = useMemo(
		() =>
			availableInventory
				.map((item) => {
					const value = String(item.externalId ?? item.id ?? "");
					const label = item.imei || value;
					return { value, label };
				})
				.filter((item) => item.value && item.label),
		[availableInventory],
	);

	const inputClass = `h-10 w-full rounded-lg border px-3 text-[12px] outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;

	const primaryBtn = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
		isDark
			? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.2]"
			: "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
	}`;

	const secondaryBtn = `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-4 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
		isDark
			? "border-white/[0.10] text-slate-300 hover:bg-white/[0.04]"
			: "border-slate-200 text-slate-700 hover:bg-slate-50"
	}`;

	const updateDevice = (field: keyof typeof initialDevice, value: string | boolean) => {
		setDevice((prev) => ({ ...prev, [field]: value }));
		setFormError("");
	};

	const resetForm = () => {
		setDevice(initialDevice);
		setFormError("");
		setInventoryError("");
		setInventoryImei("");
	};

	const openInventory = () => {
		setInventoryImei("");
		setInventoryError("");
		setShowInventory(true);
		void getAvailableInventory()
			.unwrap()
			.catch((error: unknown) => {
				setInventoryError(apiErrorMessage(error, "Could not load available inventory."));
			});
	};

	const importFromInventory = async () => {
		if (!inventoryImei) return;
		setInventoryError("");
		try {
			const inventory = await getInventoryByImei(inventoryImei).unwrap();
			const selected = availableInventory.find(
				(item) => String(item.externalId ?? item.id ?? "") === inventoryImei,
			);
			setDevice((prev) => ({
				...prev,
				imei: inventory.imei ?? selected?.imei ?? prev.imei,
				simNumber: inventory.simNumber ?? "",
				simOperator: (inventory.simOperator as SimOperator) || prev.simOperator,
				secondarySimNumber: inventory.secondarySimNumber ?? "",
				secondarySimOperator:
					(inventory.secondarySimOperator as SimOperator) || prev.secondarySimOperator,
				deviceType: refId(inventory.deviceType) || prev.deviceType,
				client: refId(inventory.client) || prev.client,
				password: inventory.password ?? "",
				ignitionPositive: Boolean(inventory.ignitionWireConnected),
				ignitionNotConnected: Boolean(inventory.ignitionWireNotConnected),
				acPositive: Boolean(inventory.airConditionWireConnected),
				attendance: Boolean(inventory.attendance),
				timezone: Boolean(inventory.timezoneSetting),
				active: inventory.active ?? true,
			}));
			setShowInventory(false);
			setInventoryImei("");
			toast.success("Inventory details imported.");
		} catch (error) {
			setInventoryError(apiErrorMessage(error, "Could not import this IMEI from inventory."));
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!device.imei.trim()) {
			setFormError("Imei is required.");
			return;
		}
		if (!device.simNumber.trim()) {
			setFormError("Sim Number is required.");
			return;
		}
		if (!device.simOperator) {
			setFormError("Sim Operator is required.");
			return;
		}
		if (!device.deviceType) {
			setFormError("Device Type is required.");
			return;
		}
		if (!device.client) {
			setFormError("Client is required.");
			return;
		}

		const body: CreateDeviceRequest = {
			imei: device.imei.trim(),
			simNumber: device.simNumber.trim(),
			simOperator: device.simOperator,
			secondarySimNumber: device.secondarySimNumber.trim(),
			secondarySimOperator: device.secondarySimOperator,
			deviceType: device.deviceType,
			client: device.client,
			password: device.password,
			ignitionWireConnected: device.ignitionPositive,
			ignitionWireNotConnected: device.ignitionNotConnected,
			airConditionWireConnected: device.acPositive,
			attendance: device.attendance,
			timezoneSetting: device.timezone,
		};

		try {
			const saved = await createDevice(body).unwrap();
			toast.success("Device added.");
			onSaved?.(saved.externalId);
			onClose?.();
		} catch (error) {
			console.error("Failed to create device.", error);
			setFormError(apiErrorMessage(error, "Could not create the device. Please try again."));
		}
	};

	const deviceCheckboxes = [
		["active", "Active"],
		["ignitionPositive", "Ignition wire connected in (+)ve"],
		["ignitionNotConnected", "Ignition wire not connected"],
		["acPositive", "Air condition wire connected in (+)ve"],
		["attendance", "Attendance"],
		["timezone", "Timezone Setting"],
	] as const;

	return (
		<form
			onSubmit={handleSubmit}
			noValidate
			className={`flex max-h-[96vh] w-full flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
				isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
			}`}
		>
			<header
				className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${
					isDark ? "border-white/[0.08] bg-[#08142e]" : "border-slate-200 bg-white"
				}`}
			>
				<div>
					<p
						className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
							isDark ? "text-cyan-200/70" : "text-cyan-700"
						}`}
					>
						Fleet operations
					</p>
					<h2 className="text-[15px] font-semibold">Add Device</h2>
				</div>
				{onClose ? (
					<button
						type="button"
						onClick={onClose}
						disabled={isSaving}
						aria-label="Close device form"
						className={`rounded-lg p-1.5 transition disabled:opacity-40 ${
							isDark
								? "text-slate-400 hover:bg-white/[0.06] hover:text-white"
								: "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
						}`}
					>
						<X className="h-5 w-5" />
					</button>
				) : null}
			</header>

			<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
				{formError ? (
					<p
						role="alert"
						className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${
							isDark
								? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200"
								: "border-rose-200 bg-rose-50 text-rose-700"
						}`}
					>
						{formError}
					</p>
				) : null}

				<section className="space-y-7">
					<div className="grid grid-cols-1 items-start gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
						<Field
							label="Imei"
							required
							hint="Max 30 characters allowed"
							isDark={isDark}
							action={
								<button
									type="button"
									className={`shrink-0 text-[11px] font-medium underline ${
										isDark ? "text-cyan-300" : "text-cyan-700"
									}`}
									onClick={openInventory}
									disabled={isSaving}
								>
									Import from Inventory
								</button>
							}
						>
							<input
								className={inputClass}
								placeholder="Imei"
								value={device.imei}
								maxLength={30}
								onChange={(event) => updateDevice("imei", event.target.value.slice(0, 30))}
								required
								disabled={isSaving}
							/>
						</Field>

						<Field label="Sim Number" required hint="Only contains 24 digit" isDark={isDark}>
							<input
								className={inputClass}
								placeholder="Sim Number"
								inputMode="numeric"
								maxLength={24}
								value={device.simNumber}
								onChange={(event) =>
									updateDevice("simNumber", event.target.value.replace(/\D/g, "").slice(0, 24))
								}
								required
								disabled={isSaving}
							/>
						</Field>

						<Field label="Sim Operator" required isDark={isDark}>
							<SelectField
								value={device.simOperator}
								onChange={(value) => updateDevice("simOperator", value)}
								options={simOperators.map((operator) => ({ value: operator, label: operator }))}
								required
								inputClass={inputClass}
								disabled={isSaving}
							/>
						</Field>

						<Field label="Secondary Sim Number" hint="Only contains 24 digit" isDark={isDark}>
							<input
								className={inputClass}
								placeholder="Sim Number"
								inputMode="numeric"
								maxLength={24}
								value={device.secondarySimNumber}
								onChange={(event) =>
									updateDevice(
										"secondarySimNumber",
										event.target.value.replace(/\D/g, "").slice(0, 24),
									)
								}
								disabled={isSaving}
							/>
						</Field>

						<Field label="Secondary Sim Operator" isDark={isDark}>
							<SelectField
								value={device.secondarySimOperator}
								onChange={(value) => updateDevice("secondarySimOperator", value)}
								options={simOperators.map((operator) => ({ value: operator, label: operator }))}
								inputClass={inputClass}
								disabled={isSaving}
							/>
						</Field>

						<Field label="Device Type" required isDark={isDark}>
							<SelectField
								value={device.deviceType}
								onChange={(value) => updateDevice("deviceType", value)}
								options={deviceTypeOptions}
								placeholder={deviceTypesLoading ? "Loading..." : "Select Device Type"}
								required
								inputClass={inputClass}
								disabled={isSaving || deviceTypesLoading}
							/>
						</Field>

						<Field label="Client" required isDark={isDark}>
							<SelectField
								value={device.client}
								onChange={(value) => updateDevice("client", value)}
								placeholder={clientsLoading ? "Loading..." : "Select Client"}
								options={clientOptions}
								required
								inputClass={inputClass}
								disabled={isSaving || clientsLoading}
							/>
						</Field>

						<Field label="Password (Optional)" isDark={isDark}>
							<input
								className={inputClass}
								type="password"
								placeholder="Password"
								value={device.password}
								onChange={(event) => updateDevice("password", event.target.value)}
								disabled={isSaving}
							/>
						</Field>
					</div>

					<div className="flex flex-col gap-3.5">
						{deviceCheckboxes.map(([key, label]) => (
							<label
								key={key}
								className={`flex cursor-pointer items-center gap-2.5 text-[12px] font-medium ${
									isDark ? "text-slate-300" : "text-slate-700"
								}`}
							>
								<input
									type="checkbox"
									className="h-4 w-4 shrink-0 accent-cyan-500"
									checked={device[key]}
									onChange={(event) => updateDevice(key, event.target.checked)}
									disabled={isSaving}
								/>
								<span className={key === "active" ? "font-semibold" : ""}>{label}</span>
							</label>
						))}
					</div>
				</section>
			</div>

			<footer
				className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${
					isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
				}`}
			>
				<button type="button" className={secondaryBtn} onClick={resetForm} disabled={isSaving}>
					Reset
				</button>
				<button type="submit" className={primaryBtn} disabled={isSaving}>
					{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
					Save
				</button>
			</footer>

			{showInventory ? (
				<div
					className={`fixed inset-0 z-[900] flex justify-end ${
						isDark ? "bg-[#020718]/80" : "bg-slate-900/50"
					}`}
					onMouseDown={(event) => {
						if (event.target === event.currentTarget && !isImporting) setShowInventory(false);
					}}
				>
					<div
						role="dialog"
						aria-modal="true"
						className={`flex h-full w-full max-w-md flex-col border-l shadow-2xl ${
							isDark
								? "border-white/[0.10] bg-[#0a1630] text-white"
								: "border-slate-200 bg-white text-slate-900"
						}`}
					>
						<div
							className={`flex items-center justify-between border-b px-4 py-3 ${
								isDark ? "border-white/[0.08] bg-[#08142e]" : "border-slate-200"
							}`}
						>
							<h3 className="text-[15px] font-semibold">Import From Inventory</h3>
							<button
								type="button"
								onClick={() => setShowInventory(false)}
								disabled={isImporting}
								aria-label="Close"
								className={`rounded-lg p-1.5 transition disabled:opacity-40 ${
									isDark
										? "text-slate-400 hover:bg-white/[0.06]"
										: "text-slate-500 hover:bg-slate-100"
								}`}
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="p-5">
							{inventoryError ? (
								<p
									role="alert"
									className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${
										isDark
											? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200"
											: "border-rose-200 bg-rose-50 text-rose-700"
									}`}
								>
									{inventoryError}
								</p>
							) : null}

							<Field label="Imei" required isDark={isDark}>
								<SelectField
									value={inventoryImei}
									onChange={setInventoryImei}
									placeholder={
										isLoadingInventory ? "Loading inventory..." : "Select imei"
									}
									options={inventoryOptions}
									required
									inputClass={inputClass}
									disabled={isLoadingInventory || isImporting}
								/>
							</Field>

							<div className="mt-10 flex justify-center">
								<button
									type="button"
									className={primaryBtn}
									onClick={() => void importFromInventory()}
									disabled={!inventoryImei || isImporting || isLoadingInventory}
								>
									{isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
									Import
								</button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</form>
	);
}
