import { useEffect, useState, type ChangeEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Eye, EyeOff, Loader2, Plus } from "lucide-react";
import { addDeviceFields, DEVICE_TYPE_ID } from "@/interfaces/AddDeviceFields";
import type { VehicleFieldConfig } from "@/interfaces/AddVehicleFields";
import type { Device } from "@/interfaces/AddDevice";
import { useGetClientMasterQuery, useGetDeviceMasterQuery, useGetDeviceTypeMasterQuery } from "@/store/services/api/Master";
import {
	useLazyGetAvailableDeviceInventoryQuery,
	useLazyGetDeviceByIdQuery,
	useLazyGetDeviceInventoryByImeiQuery,
} from "@/store/services/api/AddDevice";
import { apiErrorMessage } from "@/lib/apiErrorMessage";

const confirmOnEnable = new Set(["ignitionPositive", "ignitionDisconnected"]);

type AddDeviceProps = {
	isDark: boolean;
	values: Record<string, string>;
	onChange: (name: string, value: string) => void;
	selectedDeviceId: string;
	onSelectDevice: (device: Device) => void;
	onAddNew: () => void;
	onConfirm?: (field: VehicleFieldConfig) => void;
};

const referenceValue = (value: unknown): string => {
	if (typeof value === "string" || typeof value === "number") return String(value);
	if (value && typeof value === "object") {
		const reference = value as { externalId?: string; id?: string | number };
		return String(reference.externalId ?? reference.id ?? "");
	}
	return "";
};

export function AddDevice({
	isDark,
	values,
	onChange,
	selectedDeviceId,
	onSelectDevice,
	onAddNew,
	onConfirm,
}: AddDeviceProps) {
	const [inventoryOpen, setInventoryOpen] = useState(false);
	const [selectedDeviceValue, setSelectedDeviceValue] = useState(selectedDeviceId);
	const [formOpen, setFormOpen] = useState(Boolean(selectedDeviceId));
	const { data: clients = [] } = useGetClientMasterQuery();
	const {
		data: deviceMaster = [],
		isLoading: devicesLoading,
		isError: devicesError,
	} = useGetDeviceMasterQuery();
	const {
		data: deviceTypeMaster = [],
		isLoading: deviceTypesLoading,
		isError: deviceTypesError,
	} = useGetDeviceTypeMasterQuery();
	const deviceTypeOptions = deviceTypeMaster
		.map((deviceType) => ({
			value: String(deviceType.externalId ?? deviceType.id ?? ""),
			label: deviceType.deviceName ?? deviceType.deviceTypeName ?? "",
		}))
		.filter((deviceType) => deviceType.value && deviceType.label);
	const [selectedInventoryId, setSelectedInventoryId] = useState("");
	const [inventoryError, setInventoryError] = useState("");
	const [deviceError, setDeviceError] = useState("");
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [getDevice, { isFetching: isLoadingDevice }] = useLazyGetDeviceByIdQuery();
	const [getAvailableInventory, { data: availableInventory = [], isFetching: isLoadingInventory }] =
		useLazyGetAvailableDeviceInventoryQuery();
	const [getInventoryByImei, { isFetching: isImporting }] = useLazyGetDeviceInventoryByImeiQuery();

	useEffect(() => {
		setSelectedDeviceValue(selectedDeviceId);
	}, [selectedDeviceId]);

	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;

	const selectDevice = async (deviceId: string) => {
		setDeviceError("");
		if (!deviceId) return;
		setSelectedDeviceValue(deviceId);

		try {
			const device = await getDevice(deviceId).unwrap();
			const importedValues: Record<string, string> = {
				externalId: device.externalId,
				imei: device.imei ?? "",
				sim: device.simNumber ?? "",
				simOperator: device.simOperator ?? "",
				secondarySim: device.secondarySimNumber ?? "",
				secondarySimOperator: device.secondarySimOperator ?? "",
				deviceType: referenceValue(device.deviceType) || DEVICE_TYPE_ID,
				deviceClient: referenceValue(device.client),
				devicePassword: device.password ?? "",
				ignitionPositive: String(device.ignitionWireConnected ?? false),
				ignitionDisconnected: String(device.ignitionWireNotConnected ?? false),
				airConditionPositive: String(device.airConditionWireConnected ?? false),
				attendance: String(device.attendance ?? false),
				timezoneSetting: String(device.timezoneSetting ?? false),
			};
			Object.entries(importedValues).forEach(([name, value]) => onChange(name, value));
			onSelectDevice(device);
			setFormOpen(true);
		} catch (error) {
			setSelectedDeviceValue(selectedDeviceId);
			console.error("Failed to load device details from master.", error);
			setDeviceError(apiErrorMessage(error, "Could not load this device. Please try again."));
		}
	};

	const startNewDevice = () => {
		setDeviceError("");
		setSelectedDeviceValue("");
		setSelectedInventoryId("");
		setFormOpen(true);
		onAddNew();
	};

	const openInventory = () => {
		setSelectedInventoryId("");
		setInventoryError("");
		setInventoryOpen(true);
		void getAvailableInventory()
			.unwrap()
			.catch((error: unknown) => setInventoryError(apiErrorMessage(error, "Could not load available inventory.")));
	};

	const selectInventoryItem = async (inventoryId: string) => {
		if (!inventoryId) {
			return;
		}
		setSelectedInventoryId(inventoryId);
		setInventoryError("");
		try {
			const inventory = await getInventoryByImei(inventoryId).unwrap();
			const deviceType =
				typeof inventory.deviceType === "string"
					? inventory.deviceType
					: inventory.deviceType?.externalId ?? inventory.deviceType?.id;
			const client =
				typeof inventory.client === "string"
					? inventory.client
					: inventory.client?.externalId ?? inventory.client?.id;
			const importedValues: Record<string, string> = {
				externalId: inventory.externalId ?? "",
				imei: inventory.imei ?? availableInventory.find((item) => String(item.id ?? item.externalId ?? "") === inventoryId)?.imei ?? "",
				sim: inventory.simNumber ?? "",
				simOperator: inventory.simOperator ?? "",
				secondarySim: inventory.secondarySimNumber ?? "",
				secondarySimOperator: inventory.secondarySimOperator ?? "",
				deviceType: String(deviceType ?? DEVICE_TYPE_ID),
				deviceClient: String(client ?? ""),
				devicePassword: inventory.password ?? "",
				ignitionPositive: String(inventory.ignitionWireConnected ?? false),
				ignitionDisconnected: String(inventory.ignitionWireNotConnected ?? false),
				airConditionPositive: String(inventory.airConditionWireConnected ?? false),
				attendance: String(inventory.attendance ?? false),
				timezoneSetting: String(inventory.timezoneSetting ?? false),
			};
			Object.entries(importedValues).forEach(([name, value]) => onChange(name, value));
			setInventoryOpen(false);
		} catch (error) {
			setInventoryError(apiErrorMessage(error, "Could not import this IMEI from inventory."));
		}
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
							className={`shrink-0 text-[11px] font-medium  ${
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
							{field.name === "deviceType" && <option value="">Select Device Type</option>}
							{(field.name === "deviceClient"
								? ["Select Client", ...clients.map((client) => client.id)]
								: field.name === "deviceType"
									? deviceTypeOptions.map((deviceType) => deviceType.value)
								: field.options ?? []
							).map((option) => (
								<option key={option} value={option.startsWith("Select ") ? "" : option}>
									{field.name === "deviceClient"
										? clients.find((client) => client.id === option)?.name ?? option
										: field.name === "deviceType"
											? deviceTypeOptions.find((deviceType) => deviceType.value === option)?.label ?? option
										: field.optionLabels?.[option] ?? option}
								</option>
							))}
							{field.name === "deviceType" && deviceTypeOptions.length === 0 && (
								<option value="">
									{deviceTypesLoading ? "Loading device types..." : "No device types available"}
								</option>
							)}
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
				{field.name === "deviceType" && deviceTypesError && (
					<span role="alert" className="mt-1 block text-[11px] text-rose-500">
						Could not load device types.
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
			<div className="mb-2 max-w-[250px]">
				<label htmlFor="device-master-select" className={`text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
					Device
				</label>
				<div className="flex justify-end">
					<button
						type="button"
						onClick={startNewDevice}
						className={`inline-flex items-end gap-0 text-[12px] font-medium transition ${
							isDark ? "text-cyan-300 hover:text-cyan-200" : "text-cyan-700 hover:text-cyan-800"
						}`}
					>
						Add New
					</button>
				</div>
				<select
					id="device-master-select"
					value={selectedDeviceValue}
					disabled={devicesLoading || isLoadingDevice}
					onChange={(event) => void selectDevice(event.target.value)}
					className={`h-[37px] w-full rounded-lg border px-3 text-[12px] outline-none transition disabled:opacity-60 ${
						isDark
							? "border-white/[0.09] bg-[#03091c]/70 text-white focus:border-cyan-300/35"
							: "border-slate-200 bg-white text-slate-900 focus:border-cyan-400"
					}`}
				>
					<option value="">
						{devicesLoading ? "Loading devices..." : "Select Device"}
					</option>
					{deviceMaster.map((device) => (
						<option
							key={device.externalId ?? device.id}
							value={device.externalId ?? device.id}
						>
							{device.name}
						</option>
					))}
				</select>
				{devicesError && (
					<span role="alert" className="mt-1 block text-[11px] text-rose-500">
						Could not load devices from master.
					</span>
				)}
				{deviceError && (
					<span role="alert" className="mt-1 block text-[11px] text-rose-500">
						{deviceError}
					</span>
				)}
			</div>

			{isLoadingDevice && (
				<p className={`mb-4 inline-flex items-center gap-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
					<Loader2 className="h-3 w-3 animate-spin" /> Loading device details...
				</p>
			)}
			{formOpen && (
				<>
					<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
						{textFields.map(renderField)}
					</div>
					<div className="mt-5 flex flex-col items-start gap-3">
						{checkboxFields.map(renderField)}
					</div>
				</>
			)}

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
									value={selectedInventoryId}
									onChange={(event) => void selectInventoryItem(event.target.value)}
									disabled={isLoadingInventory || isImporting}
									className={`${inputClass} appearance-none pr-9`}
									aria-invalid={inventoryError ? true : undefined}
									>
										<option value="">
											{isLoadingInventory ? "Loading available inventory..." : "Select IMEI"}
										</option>
										{availableInventory.map((item) => item.imei && (
											<option
												key={item.externalId ?? item.id ?? item.imei}
												value={String(item.id ?? item.externalId ?? "")}
											>
												{item.imei}
											</option>
										))}
									</select>
									<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>⌄</span>
								</span>
							</label>
							{isImporting && (
								<p className={`mt-2 inline-flex items-center gap-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
									<Loader2 className="h-3 w-3 animate-spin" /> Loading device details...
								</p>
							)}
							{!isLoadingInventory && availableInventory.length === 0 && !inventoryError && (
								<p className="mt-2 text-[11px] text-slate-500">No available inventory found.</p>
							)}
							{inventoryError && (
								<p role="alert" className="mt-2 text-[11px] text-rose-400">{inventoryError}</p>
							)}
						</div>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</section>
	);
}
