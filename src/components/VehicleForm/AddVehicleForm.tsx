import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { CalendarDays, Eye, EyeOff, Info, Plus, Search, X } from "lucide-react";
import { AddDevice } from "@/components/VehicleForm/AddDeviceForm";
import { AddSensorForm } from "@/components/VehicleForm/AddSensorForm";
import { AddVehicle } from "@/components/VehicleForm/AddVehicle";
import { Payment } from "@/components/VehicleForm/Payment";
import { addVehicleFields, type VehicleFieldConfig } from "@/interfaces/AddVehicleFields";
import { addDeviceFields } from "@/interfaces/AddDeviceFields";
import { useGetLanguagesQuery, useGetTimezonesQuery } from "@/store/services/api/Master";

const fallbackTimezones = ["(GMT+5:30) Asia/Calcutta", "(GMT+0:00) UTC", "(GMT-5:00) America/New_York"];
const fallbackLanguages = ["English", "Hindi"];

type VehicleFormValues = Record<string, string>;

type AddVehicleFormProps = {
	onClose: () => void;
	onSubmit: (values: VehicleFormValues) => void;
};

type FieldConfig = VehicleFieldConfig;

const tabs = [
	"Add Transporter",
	"Transporter Access Manage",
	"Add Device",
	"Add Sensor Details",
	"Add Vehicle",
	"Payment Details (Optional)",
	"Custom Fields (Optional)",
];

const transporterRoles = [
	"Basic reports",
	"Geofence Access Full",
	"Geofence reports",
	"Schedule Parking",
	"Sim Tracking",
	"Tickets",
	"User Change Password",
	"Vehicle Lock",
	"Users & group access",
	"Analytics dashboard Access",
	"No Dashboard Access",
	"History No Access",
	"Live_Trip_Dashboard_Only",
	"No Driver Access",
	"No History Access",
	"No Notification Access",
	"No Parking Access",
	"No Service Reminder Access",
	"No Setting Access",
	"No Share Access",
];

const defaultRolePermissions: Record<string, boolean> = {
	"Basic reports": true,
	"Tickets": true,
	"User Change Password": true,
	"Vehicle Lock": true,
	"Users & group access": true,
	"Analytics dashboard Access": true,
};

const fieldsByTab: Record<string, FieldConfig[]> = {
	"Add Transporter": [
		{ name: "username", label: "Username", placeholder: "Username", required: true, helper: "Only contains [ A-z, 0-9, _, -, *, @ ]" },
		{ name: "password", label: "Password", placeholder: "Password", type: "password", required: true },
		{ name: "confirmPassword", label: "Confirm Password", placeholder: "Confirm Password", type: "password", required: true },
		{ name: "company", label: "Company Name", placeholder: "Company Name", required: true },
		{ name: "client", label: "Client", placeholder: "Select Client", type: "select", required: true, options: ["Select Client", "Default Client"] },
		{ name: "timezone", label: "Timezone", type: "select", required: true, options: fallbackTimezones },
		{ name: "inactiveTime", label: "Inactive Time", type: "select", required: true, options: ["12", "24", "48", "72"] },
		{ name: "language", label: "Language", type: "select", required: true, options: fallbackLanguages },
		{ name: "name", label: "Name", placeholder: "Name", optional: true },
		{ name: "email", label: "Email", placeholder: "Email", type: "email", optional: true },
		{ name: "phone", label: "Phone", placeholder: "Phone", type: "tel", optional: true },
		{ name: "address", label: "Address", placeholder: "Address", optional: true },
		{ name: "subscriptionStart", label: "Subscription Start Date", type: "date", required: true },
		{ name: "subscriptionDue", label: "Subscription Due Date", type: "date", required: true },
		{ name: "subscriptionExtend", label: "Subscription Extend Date", type: "date", optional: true },
		{ name: "subscriptionExpiryCount", label: "Subscription Expiry Count", placeholder: "10", type: "number", optional: true },
		{ name: "maxPoiRadius", label: "Maximum Radius For Nearest POI (in Km)", type: "number", info: true },
		{ name: "minAddressDistance", label: "Minimum Distance For Address (in Km)", type: "number", info: true },
		{ name: "dataRestriction", label: "Data Restriction (in Days)", type: "number", optional: true, info: true },
		{ name: "active", label: "Active", type: "checkbox" },
		{ name: "overwriteSubscription", label: "Overwrite Subscription for all vehicles", type: "checkbox" },
		{ name: "inactiveAfterExpiry", label: "Should vehicle inactive after subscription expire", type: "checkbox" },
	],
	"Transporter Access Manage": [],
	"Add Device": [],
	"Add Sensor Details": [],
	"Add Vehicle": [],
	"Payment Details (Optional)": [
		{ name: "paymentType", label: "Type", type: "select" },
		{ name: "paymentTransporter", label: "Transporter", type: "select", required: true },
		{ name: "sellingPrice", label: "Selling Price", type: "number" },
		{ name: "paymentTerm", label: "Payment Term", type: "select", required: true },
		{ name: "installationDate", label: "Installation Date", type: "date" },
		{ name: "rentalDueDate", label: "Rental Due Date", type: "date" },
		{ name: "technicianName", label: "Technician Name" },
		{ name: "rental", label: "Rental" },
		{ name: "paymentRemark", label: "Remark" },
	],
	"Custom Fields (Optional)": [
		{ name: "customField1", label: "Custom Field 1", placeholder: "Enter value", optional: true },
		{ name: "customField2", label: "Custom Field 2", placeholder: "Enter value", optional: true },
		{ name: "customField3", label: "Custom Field 3", placeholder: "Enter value", optional: true },
		{ name: "customField4", label: "Custom Field 4", placeholder: "Enter value", optional: true },
	],
};

function FormField({
	field,
	value,
	onChange,
	onAction,
	isDark,
	disabled,
}: {
	field: FieldConfig;
	value: string;
	onChange: (value: string) => void;
	onAction?: () => void;
	isDark: boolean;
	disabled?: boolean;
}) {
	const [passwordVisible, setPasswordVisible] = useState(false);
	const inputType = field.type === "password" && passwordVisible ? "text" : field.type ?? "text";
	const inputClasses = `h-[37px] w-full rounded-lg border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;

	return (
		<label className={`block min-w-0 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
			<span className="mb-1.5 flex items-center justify-between gap-1.5">
				<span className="flex items-center gap-1.5">
					{field.label}{" "}
					{field.required ? <span className="text-rose-400">*</span> : field.optional ? <span className={`font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}>(Optional)</span> : null}
				</span>
				{field.actionLabel && (
					<button
						type="button"
						onClick={onAction}
						className={`shrink-0 text-[11px] font-medium underline underline-offset-2 ${
							isDark ? "text-cyan-300 hover:text-cyan-200" : "text-cyan-700 hover:text-cyan-800"
						}`}
					>
						{field.actionLabel}
					</button>
				)}
				{field.info && (
					<Info
						aria-label={`Information about ${field.label}`}
						aria-labelledby={field.label}
						className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}
					/>
				)}
			</span>
			<span className="relative flex">
				{field.type === "select" ? (
					<select
						value={value}
						required={field.required}
						disabled={disabled}
						onChange={(event) => onChange(event.target.value)}
						className={`${inputClasses} appearance-none pr-9`}
					>
						{field.options?.map((option, index) => (
							<option key={option} value={index === 0 && option?.startsWith("Select ") ? "" : option}>
								{option}
							</option>
						))}
					</select>
				) : (
					<>
						<input
							type={inputType}
							value={value}
							required={field.required}
							placeholder={field.placeholder}
							maxLength={field.maxLength}
							inputMode={field.inputMode}
							pattern={field.pattern}
							onChange={(event) => onChange(event.target.value)}
							className={`${inputClasses} min-w-0`}
						/>
						{field.type === "password" && (
							<button
								type="button"
								onClick={() => setPasswordVisible((visible) => !visible)}
								aria-label={passwordVisible ? "Hide password" : "Show password"}
								className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg border-l ${
									isDark
										? "border-white/[0.09] bg-white/[0.04] text-slate-400 hover:text-cyan-100"
										: "border-slate-200 bg-slate-50 text-slate-600 hover:text-cyan-700"
								}`}
							>
								{passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						)}
					</>
				)}
				{field.type === "select" && (
					<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>⌄</span>
				)}
				{field.type === "date" && <CalendarDays className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-500"}`} />}
			</span>
			{field.helper && <span className={`mt-1 block text-[11px] font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}>{field.helper}</span>}
		</label>
	);
}

export function AddVehicleForm({ onClose, onSubmit }: AddVehicleFormProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: languages = [], isLoading: languagesLoading } = useGetLanguagesQuery();
	const { data: timezones = [], isLoading: timezonesLoading } = useGetTimezonesQuery();
	const languageOptions = useMemo(
		() =>
			languages.length > 0
				? languages.map((item) => item.language)
				: fallbackLanguages,
		[languages],
	);
	const timezoneOptions = useMemo(
		() =>
			timezones.length > 0
				? timezones.map((item) => item.timezone ?? "").filter(Boolean)
				: fallbackTimezones,
		[timezones],
	);
	const fieldsByTabWithMaster = useMemo(() => {
		const transporterFields = fieldsByTab["Add Transporter"].map((field) => {
			if (field.name === "language") return { ...field, options: languageOptions };
			if (field.name === "timezone") return { ...field, options: timezoneOptions };
			return field;
		});
		return { ...fieldsByTab, "Add Transporter": transporterFields };
	}, [languageOptions, timezoneOptions]);
	const [activeTab, setActiveTab] = useState(tabs[0]);
	const [formError, setFormError] = useState("");
	const [showAddSensorDialog, setShowAddSensorDialog] = useState(false);
	const [pendingConfirmation, setPendingConfirmation] = useState<FieldConfig | null>(null);
	const [roleSearch, setRoleSearch] = useState("");
	const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>(
		() => Object.fromEntries(transporterRoles.map((role) => [role, defaultRolePermissions[role] ?? false])),
	);
	const [values, setValues] = useState<VehicleFormValues>({
		timezone: "(GMT+5:30) Asia/Calcutta",
		inactiveTime: "12",
		language: "English",
		accessTimezone: "(GMT+5:30) Asia/Calcutta",
		accessInactiveTime: "12",
		accessLanguage: "English",
		mileage: "1",
		vehicleType: "",
		subscriptionStart: "2026-10-05",
		subscriptionDue: "2027-10-05",
		subscriptionExtend: "2027-05-10",
		subscriptionExpiryCount: "10",
		active: "true",
		simOperator: "Airtel Gprs (airtelgprs.com)",
		secondarySimOperator: "Airtel Gprs (airtelgprs.com)",
		deviceType: "Concox (8505)",
		deviceActive: "true",
		sellingPrice: "0",
		installationDate: "2026-05-10",
		rentalDueDate: "2026-05-10",
	});

	useEffect(() => {
		setValues((current) => ({
			...current,
			language: current.language || languageOptions[0] || "",
			timezone: current.timezone || timezoneOptions[0] || "",
			accessLanguage: current.accessLanguage || languageOptions[0] || "",
			accessTimezone: current.accessTimezone || timezoneOptions[0] || "",
		}));
	}, [languageOptions, timezoneOptions]);

	const visibleFields = fieldsByTabWithMaster[activeTab];
	const regularFields = visibleFields.filter((field) => field.type !== "checkbox");
	const checkboxFields = visibleFields.filter((field) => field.type === "checkbox");
	const activeTabIndex = tabs.indexOf(activeTab);
	const filteredRoles = transporterRoles.filter((role) =>
		role.toLowerCase().includes(roleSearch.trim().toLowerCase()),
	);
	const confirmationDescription = (() => {
		switch (pendingConfirmation?.name) {
			case "overwriteSubscription":
				return "This will overwrite the current subscription settings for all vehicles assigned to this transporter. Do you want to continue?";
			case "inactiveAfterExpiry":
				return "Vehicles will automatically become inactive when their subscription expires. Do you want to enable this setting?";
			case "ignitionPositive":
				return "This setting indicates that the ignition wire is connected to positive (+). Do you want to enable it?";
			case "ignitionDisconnected":
				return "This setting indicates that no ignition wire is connected. Do you want to enable it?";
			default:
				return "";
		}
	})();

	const resetCurrentTab = () => {
		if (activeTab === "Transporter Access Manage") {
			setRoleSearch("");
			setRolePermissions(
				Object.fromEntries(transporterRoles.map((role) => [role, defaultRolePermissions[role] ?? false])),
			);
			setFormError("");
			return;
		}
		const fieldsToReset = activeTab === "Add Vehicle"
			? addVehicleFields
			: activeTab === "Add Device"
				? addDeviceFields
				: visibleFields;
		setValues((current) => {
			const nextValues = { ...current };
			fieldsToReset.forEach((field) => {
				nextValues[field.name] =
					field.name === "active" || field.name === "deviceActive"
						? "true"
						: field.name === "sellingPrice"
							? "0"
							: field.name === "installationDate" || field.name === "rentalDueDate"
								? "2026-05-10"
								: field.type === "select"
									? field.options?.[0]?.startsWith("Select ")
										? ""
										: field.options?.[0] ?? ""
									: "";
			});
			return nextValues;
		});
		setFormError("");
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const requiredVehicleField = addVehicleFields.find(
			(field) => field.required && !values[field.name]?.trim(),
		);
		if (requiredVehicleField) {
			setActiveTab("Add Vehicle");
			setFormError(`${requiredVehicleField.label} is required.`);
			return;
		}
		const paymentFields = fieldsByTab["Payment Details (Optional)"];
		const paymentStarted = [
			"paymentType",
			"paymentTransporter",
			"paymentTerm",
			"technicianName",
			"rental",
			"paymentRemark",
		].some((name) => values[name]?.trim()) || (values.sellingPrice ?? "0") !== "0";
		if (paymentStarted) {
			const requiredPaymentField = paymentFields.find(
				(field) => field.required && !values[field.name]?.trim(),
			);
			if (requiredPaymentField) {
				setActiveTab("Payment Details (Optional)");
				setFormError(`${requiredPaymentField.label} is required when payment details are provided.`);
				return;
			}
		}
		if (values.password && values.password !== values.confirmPassword) {
			setActiveTab("Add Transporter");
			setFormError("Password and Confirm Password must match.");
			return;
		}
		const submittedValues = { ...values };
		transporterRoles.forEach((role, index) => {
			submittedValues[`rolePermission${index + 1}`] = String(rolePermissions[role] ?? false);
		});
		onSubmit(submittedValues);
	};

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${
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
				onSubmit={handleSubmit}
				noValidate
				className={`flex max-h-[96vh] w-full max-w-[1160px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
				}`}
				aria-labelledby="vehicle-add-title"
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${
					isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"
				}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<h2 id="vehicle-add-title" className="text-[15px] font-semibold">Add vehicle</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close vehicle form" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<nav aria-label="Vehicle setup sections" className="shrink-0 overflow-x-auto px-5 pt-4 sm:px-6">
					<div className={`flex min-w-max border-b ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
						{tabs.map((tab) => (
							<button
								key={tab}
								type="button"
								onClick={() => {
									setActiveTab(tab);
									setFormError("");
								}}
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
					{activeTab === "Transporter Access Manage" ? (
						<section aria-label="Transporter role access">
							<label className="relative mb-3 block max-w-sm">
								<Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
								<input
									type="search"
									value={roleSearch}
									onChange={(event) => setRoleSearch(event.target.value)}
									placeholder="Search roles"
									aria-label="Search roles"
									className={`h-9 w-full rounded-lg border pl-9 pr-3 text-xs outline-none transition ${
										isDark
											? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35"
											: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400"
									}`}
								/>
							</label>
							<div className={`overflow-hidden rounded-xl border ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
								<div className={`grid grid-cols-[1fr_100px] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
									isDark ? "bg-[#08142e] text-slate-400" : "bg-slate-100 text-slate-600"
								}`}>
									<span>Role Name</span>
									<span className="text-center">Assign</span>
								</div>
								<div className="max-h-[55vh] overflow-y-auto">
									{filteredRoles.map((role, index) => (
										<div
											key={role}
											className={`grid grid-cols-[1fr_100px] items-center px-4 py-2 text-xs ${
												isDark
													? index % 2 === 0 ? "bg-white/[0.035] text-slate-300" : "bg-transparent text-slate-300"
													: index % 2 === 0 ? "bg-slate-50 text-slate-700" : "bg-white text-slate-700"
											}`}
										>
											<span>{role}</span>
											<span className="flex justify-center">
												<button
													type="button"
													role="switch"
													aria-checked={rolePermissions[role] ?? false}
													aria-label={`Assign ${role}`}
													onClick={() =>
														setRolePermissions((current) => ({
															...current,
															[role]: !current[role],
														}))
													}
													className={`relative h-[18px] w-[34px] rounded-full transition ${
														rolePermissions[role]
															? isDark ? "bg-cyan-400" : "bg-cyan-600"
															: isDark ? "bg-slate-700" : "bg-slate-300"
													}`}
												>
													<span className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-all ${
														rolePermissions[role] ? "left-[18px]" : "left-[3px]"
													}`} />
												</button>
											</span>
										</div>
									))}
									{filteredRoles.length === 0 && (
										<p className={`px-4 py-8 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
											No roles match your search.
										</p>
									)}
								</div>
							</div>
						</section>
					) : activeTab === "Add Sensor Details" ? (
						<div className="flex min-h-[220px] items-center justify-center">
							<button
								type="button"
								onClick={() => setShowAddSensorDialog(true)}
								className={`inline-flex h-11 items-center gap-2 rounded-lg border px-5 text-sm font-semibold transition ${
									isDark
										? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
										: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
								}`}
							>
								<Plus className="h-4 w-4" />
								Add Sensor
							</button>
						</div>
					) : activeTab === "Add Device" ? (
						<AddDevice
							isDark={isDark}
							values={values}
							onChange={(name, value) => {
								setValues((current) => ({ ...current, [name]: value }));
								setFormError("");
							}}
							onConfirm={setPendingConfirmation}
						/>
					) : activeTab === "Add Vehicle" ? (
						<AddVehicle
							isDark={isDark}
							values={values}
							onChange={(name, value) => {
								setValues((current) => ({ ...current, [name]: value }));
								setFormError("");
							}}
						/>
					) : activeTab === "Payment Details (Optional)" ? (
						<Payment
							isDark={isDark}
							values={values}
							onChange={(name, value) => {
								setValues((current) => ({ ...current, [name]: value }));
								setFormError("");
							}}
						/>
					) : (
						<>
							<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
								{regularFields.map((field) => (
									<FormField
										key={field.name}
										field={field}
										value={values[field.name] ?? ""}
										isDark={isDark}
										disabled={
											(field.name === "language" && languagesLoading) ||
											(field.name === "timezone" && timezonesLoading)
										}
										onAction={
											field.actionLabel
												? () => setFormError("Inventory import is not available yet.")
												: undefined
										}
										onChange={(value) => {
											setValues((current) => ({ ...current, [field.name]: value }));
											setFormError("");
											if (field.name === "vehicleNo") setFormError("");
										}}
									/>
								))}
							</div>
							{checkboxFields.length > 0 && (
						<div className="mt-6 flex flex-col items-start gap-3">
							{checkboxFields.map((field) => (
								<div key={field.name}>
									<label
										className={`flex cursor-pointer items-center gap-2.5 text-[12px] font-medium ${
											isDark ? "text-slate-300" : "text-slate-700"
										}`}
									>
										<input
											type="checkbox"
											checked={values[field.name] === "true"}
											onChange={(event) => {
												if (
													event.target.checked &&
													(
														field.name === "overwriteSubscription" ||
														field.name === "inactiveAfterExpiry"
													)
												) {
													setPendingConfirmation(field);
													return;
												}
												setValues((current) => ({
													...current,
													[field.name]: String(event.target.checked),
												}));
											}}
											className="h-4 w-4 rounded border-slate-400 accent-cyan-500"
										/>
										{field.label}
									</label>
								</div>
							))}
						</div>
							)}
						</>
					)}
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-3 border-t px-5 py-3 ${
					isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
				}`}>
					<div className="flex gap-2">
						<button type="submit" className={`h-9 rounded-lg border px-4 text-[12px] font-semibold transition ${
							isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
						}`}>
							Save
						</button>
						{activeTab !== "Transporter Access Manage" && (
							<button type="button" onClick={resetCurrentTab} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${
								isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
							}`}>
								Reset
							</button>
						)}
						<button
							type="button"
							onClick={() => {
								if (activeTabIndex < tabs.length - 1) {
									setActiveTab(tabs[activeTabIndex + 1]);
									setFormError("");
								}
							}}
							disabled={activeTabIndex === tabs.length - 1}
							className={`h-9 rounded-lg border px-4 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
								isDark
									? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
									: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
							}`}
						>
							Skip
						</button>
					</div>
				</footer>
			</form>
			{showAddSensorDialog && (
				<AddSensorForm
					onClose={() => setShowAddSensorDialog(false)}
					onSubmit={(sensorValues) => {
						setValues((current) => ({ ...current, ...sensorValues }));
						setFormError("");
						setShowAddSensorDialog(false);
					}}
				/>
			)}
			{pendingConfirmation && (
				<div
					className="fixed inset-0 z-[810] flex items-center justify-center bg-[#020718]/60 p-4 backdrop-blur-sm"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) setPendingConfirmation(null);
					}}
				>
					<section
						role="alertdialog"
						aria-modal="true"
						aria-labelledby="transporter-setting-confirm-title"
						aria-describedby="transporter-setting-confirm-description"
						className={`w-full max-w-md rounded-2xl border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
						}`}
					>
						<h3 id="transporter-setting-confirm-title" className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
							Confirm setting
						</h3>
						<p id="transporter-setting-confirm-description" className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							{confirmationDescription}
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setPendingConfirmation(null)}
								className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${
									isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
								}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									if (pendingConfirmation) {
										setValues((current) => ({ ...current, [pendingConfirmation.name]: "true" }));
									}
									setPendingConfirmation(null);
								}}
								className={`h-9 rounded-lg border px-4 text-[12px] font-semibold transition ${
									isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
								}`}
							>
								Save
							</button>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
