import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { buildTransporterPayload } from "@/components/VehicleForm/vehiclePayloads";
import { Status } from "@/enums/Status";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useCreateBillingDetailsMutation } from "@/store/services/api/BillingDetails";
import { useGetClientMasterQuery, useGetLanguagesQuery, useGetTimezonesQuery } from "@/store/services/api/Master";
import { useCreateTransporterMutation } from "@/store/services/api/Transporter";
import { CalendarDays, Eye, EyeOff, Info, Search, X } from "lucide-react";

const fallbackTimezones = ["(GMT+5:30) Asia/Calcutta", "(GMT+0:00) UTC", "(GMT-5:00) America/New_York"];
const fallbackLanguages = ["English", "Hindi"];
const inactiveTimes = ["6", "12", "24", "48", "72"];
const tabs = ["Add Transporter", "Access Management", "Billing Detail"] as const;
type TransporterTab = (typeof tabs)[number];

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
	Tickets: true,
	"User Change Password": true,
	"Vehicle Lock": true,
	"Users & group access": true,
	"Analytics dashboard Access": true,
};

const usernamePattern = /^[A-Za-z0-9_\-*@]+$/;

type FormState = {
	username: string;
	password: string;
	confirmPassword: string;
	company: string;
	client: string;
	timezone: string;
	inactiveTime: string;
	language: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	subscriptionStart: string;
	subscriptionDue: string;
	subscriptionExtend: string;
	subscriptionExpiryCount: string;
	maxPoiRadius: string;
	minAddressDistance: string;
	dataRestriction: string;
	active: string;
	overwriteSubscription: string;
	inactiveAfterExpiry: string;
	billingName: string;
	gstNumber: string;
	billingEmail: string;
	billingPhone: string;
	billingAddress: string;
	paymentMode: string;
};

function localDate(yearsAhead = 0) {
	const date = new Date();
	date.setFullYear(date.getFullYear() + yearsAhead);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

function createEmptyForm(timezone: string, language: string): FormState {
	return {
		username: "",
		password: "",
		confirmPassword: "",
		company: "",
		client: "",
		timezone,
		inactiveTime: "12",
		language,
		name: "",
		email: "",
		phone: "",
		address: "",
		subscriptionStart: localDate(),
		subscriptionDue: localDate(1),
		subscriptionExtend: localDate(1),
		subscriptionExpiryCount: "10",
		maxPoiRadius: "",
		minAddressDistance: "",
		dataRestriction: "",
		active: "true",
		overwriteSubscription: "false",
		inactiveAfterExpiry: "false",
		billingName: "",
		gstNumber: "",
		billingEmail: "",
		billingPhone: "",
		billingAddress: "",
		paymentMode: "",
	};
}

function FieldLabel({
	label,
	required,
	optional,
	info,
	isDark,
}: {
	label: string;
	required?: boolean;
	optional?: boolean;
	info?: string;
	isDark: boolean;
}) {
	return (
		<span className={`mb-1.5 flex items-center justify-between gap-2 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
			<span>
				{label}
				{required ? <span className="text-rose-400"> *</span> : null}
				{optional ? <span className={`font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}> (Optional)</span> : null}
			</span>
			{info ? <span title={info} className="inline-flex"><Info aria-label={info} className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`} /></span> : null}
		</span>
	);
}

export function AddTransporterDialog({
	isDark,
	onClose,
	onSave,
}: {
	isDark: boolean;
	onClose: () => void;
	onSave: () => void;
}) {
	const [createTransporter, { isLoading: creatingTransporter }] = useCreateTransporterMutation();
	const [createBillingDetails, { isLoading: creatingBilling }] = useCreateBillingDetailsMutation();
	const isSaving = creatingTransporter || creatingBilling;
	const { data: languages = [], isLoading: languagesLoading } = useGetLanguagesQuery();
	const { data: timezones = [], isLoading: timezonesLoading } = useGetTimezonesQuery();
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const languageOptions = useMemo(
		() => (languages.length > 0 ? languages.map((item) => item.language).filter(Boolean) : fallbackLanguages),
		[languages],
	);
	const timezoneOptions = useMemo(
		() => (timezones.length > 0 ? timezones.map((item) => item.timezone ?? "").filter(Boolean) : fallbackTimezones),
		[timezones],
	);
	const [activeTab, setActiveTab] = useState<TransporterTab>("Add Transporter");
	const [formError, setFormError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [pendingSetting, setPendingSetting] = useState<"overwriteSubscription" | "inactiveAfterExpiry" | null>(null);
	const [roleSearch, setRoleSearch] = useState("");
	const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>(() =>
		Object.fromEntries(transporterRoles.map((role) => [role, defaultRolePermissions[role] ?? false])),
	);
	const [values, setValues] = useState<FormState>(() => createEmptyForm(fallbackTimezones[0], fallbackLanguages[0]));

	useEffect(() => {
		setValues((current) => ({
			...current,
			timezone: current.timezone || timezoneOptions[0] || "",
			language: current.language || languageOptions[0] || "",
		}));
	}, [languageOptions, timezoneOptions]);

	const inputClass = `h-[37px] w-full rounded-lg border px-3 text-[12px] outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08] [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100 [color-scheme:light]"
	}`;
	const filteredRoles = transporterRoles.filter((role) => role.toLowerCase().includes(roleSearch.trim().toLowerCase()));

	const update = (name: keyof FormState, value: string) => {
		setValues((current) => ({ ...current, [name]: value }));
		setFormError("");
	};

	const resetForm = () => {
		if (activeTab === "Access Management") {
			setRoleSearch("");
			setRolePermissions(Object.fromEntries(transporterRoles.map((role) => [role, defaultRolePermissions[role] ?? false])));
			return;
		}
		if (activeTab === "Billing Detail") {
			setValues((current) => ({
				...current,
				billingName: "",
				gstNumber: "",
				billingEmail: "",
				billingPhone: "",
				billingAddress: "",
				paymentMode: "",
			}));
			return;
		}
		setValues(createEmptyForm(timezoneOptions[0] || fallbackTimezones[0], languageOptions[0] || fallbackLanguages[0]));
		setShowPassword(false);
		setShowConfirmPassword(false);
		setFormError("");
	};

	const save = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!values.username.trim() || !values.password || !values.confirmPassword || !values.company.trim() || !values.client || !values.timezone || !values.inactiveTime || !values.language || !values.subscriptionStart || !values.subscriptionDue) {
			setActiveTab("Add Transporter");
			setFormError("Fill the required transporter fields before saving.");
			return;
		}
		if (!usernamePattern.test(values.username.trim())) {
			setActiveTab("Add Transporter");
			setFormError("Username can only contain A-z, 0-9, _, -, *, @.");
			return;
		}
		if (values.password !== values.confirmPassword) {
			setActiveTab("Add Transporter");
			setFormError("Password and Confirm Password must match.");
			return;
		}
		const hasBilling = [values.billingName, values.gstNumber, values.billingEmail, values.billingPhone, values.billingAddress, values.paymentMode].some((value) => value.trim());
		if (hasBilling && !values.billingName.trim()) {
			setActiveTab("Billing Detail");
			setFormError("Billing Name is required to save billing details.");
			return;
		}

		let transporterId: string;
		try {
			const saved = await createTransporter(buildTransporterPayload(values, transporterRoles.filter((role) => rolePermissions[role]))).unwrap();
			transporterId = saved.externalId;
		} catch (error) {
			console.error("Failed to create transporter.", error);
			setFormError(apiErrorMessage(error, "Could not save the transporter. Please try again."));
			return;
		}

		if (hasBilling) {
			try {
				await createBillingDetails({
					transporter: transporterId,
					billingName: values.billingName.trim(),
					gstNumber: values.gstNumber.trim() || undefined,
					billingEmail: values.billingEmail.trim() || undefined,
					billingPhone: values.billingPhone.trim() || undefined,
					billingAddress: values.billingAddress.trim() || undefined,
					paymentMode: values.paymentMode || undefined,
					status: Status.ACTIVE,
				}).unwrap();
			} catch (error) {
				console.error("Failed to create billing details.", error);
				toast.error(apiErrorMessage(error, "Transporter saved, but billing details could not be saved."));
				onSave();
				return;
			}
		}

		toast.success("Transporter saved.");
		onSave();
	};

	const control = (node: ReactNode, hint?: string) => (
		<label className="block min-w-0">
			{node}
			{hint ? <span className={`mt-1 block text-[11px] font-normal ${isDark ? "text-slate-500" : "text-slate-500"}`}>{hint}</span> : null}
		</label>
	);

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape") onClose();
			}}
		>
			<form
				onSubmit={save}
				noValidate
				role="dialog"
				aria-modal="true"
				aria-labelledby="transporter-add-title"
				className={`flex max-h-[96vh] w-full max-w-[1160px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<h2 id="transporter-add-title" className="text-[15px] font-semibold">Transporter Add</h2>
					<button type="button" onClick={onClose} aria-label="Close dialog" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5" />
					</button>
				</header>

				<div className={`grid shrink-0 grid-cols-3 border-b text-center text-[12px] ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
					{tabs.map((tab) => (
						<button
							key={tab}
							type="button"
							onClick={() => {
								setActiveTab(tab);
								setFormError("");
							}}
							aria-current={activeTab === tab ? "page" : undefined}
							className={`min-h-10 px-2 transition ${
								activeTab === tab
									? isDark
										? "bg-cyan-300/[0.12] font-semibold text-cyan-50"
										: "bg-cyan-50 font-semibold text-cyan-800"
									: isDark
										? "font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
										: "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
							}`}
						>
							{tab}
						</button>
					))}
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
					{formError ? (
						<p role="alert" className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
							{formError}
						</p>
					) : null}

					{activeTab === "Add Transporter" ? (
						<>
							<div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
								{control(
									<>
										<FieldLabel label="Username" required isDark={isDark} />
										<input value={values.username} onChange={(event) => update("username", event.target.value)} placeholder="Username" className={inputClass} />
									</>,
									"Only contains [ A-z, 0-9, _, -, *, @ ]",
								)}
								{control(
									<>
										<FieldLabel label="Password" required isDark={isDark} />
										<span className="relative block">
											<input type={showPassword ? "text" : "password"} value={values.password} onChange={(event) => update("password", event.target.value)} placeholder="Password" className={`${inputClass} pr-11`} />
											<button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center ${isDark ? "text-slate-400 hover:text-cyan-100" : "text-slate-500 hover:text-cyan-700"}`}>
												{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
											</button>
										</span>
									</>,
								)}
								{control(
									<>
										<FieldLabel label="Confirm Password" required isDark={isDark} />
										<span className="relative block">
											<input type={showConfirmPassword ? "text" : "password"} value={values.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} placeholder="Confirm Password" className={`${inputClass} pr-11`} />
											<button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center ${isDark ? "text-slate-400 hover:text-cyan-100" : "text-slate-500 hover:text-cyan-700"}`}>
												{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
											</button>
										</span>
									</>,
								)}
								{control(
									<>
										<FieldLabel label="Company Name" required isDark={isDark} />
										<input value={values.company} onChange={(event) => update("company", event.target.value)} placeholder="Company Name" className={inputClass} />
									</>,
								)}
								{control(
									<>
										<FieldLabel label="Client" required isDark={isDark} />
										<span className="relative block">
											<select value={values.client} disabled={clientsLoading} onChange={(event) => update("client", event.target.value)} className={`${inputClass} appearance-none pr-9`}>
												<option value="">{clientsLoading ? "Loading clients…" : "Select Client"}</option>
												{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
											</select>
											<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>⌄</span>
										</span>
									</>,
								)}
								{control(
									<>
										<FieldLabel label="Timezone" required isDark={isDark} />
										<span className="relative block">
											<select value={values.timezone} disabled={timezonesLoading} onChange={(event) => update("timezone", event.target.value)} className={`${inputClass} appearance-none pr-9`}>
												{timezoneOptions.map((timezone) => <option key={timezone}>{timezone}</option>)}
											</select>
											<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>⌄</span>
										</span>
									</>,
								)}
								{control(
									<>
										<FieldLabel label="Inactive Time" required isDark={isDark} />
										<span className="relative block">
											<select value={values.inactiveTime} onChange={(event) => update("inactiveTime", event.target.value)} className={`${inputClass} appearance-none pr-9`}>
												{inactiveTimes.map((hours) => <option key={hours} value={hours}>{hours}</option>)}
											</select>
											<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>⌄</span>
										</span>
									</>,
								)}
								{control(
									<>
										<FieldLabel label="Language" required isDark={isDark} />
										<span className="relative block">
											<select value={values.language} disabled={languagesLoading} onChange={(event) => update("language", event.target.value)} className={`${inputClass} appearance-none pr-9`}>
												{languageOptions.map((language) => <option key={language}>{language}</option>)}
											</select>
											<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>⌄</span>
										</span>
									</>,
								)}
								{control(<><FieldLabel label="Name" optional isDark={isDark} /><input value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="Name" className={inputClass} /></>)}
								{control(<><FieldLabel label="Email" optional isDark={isDark} /><input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="Email" className={inputClass} /></>)}
								{control(<><FieldLabel label="Phone" optional isDark={isDark} /><input type="tel" value={values.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone" className={inputClass} /></>)}
								{control(<><FieldLabel label="Address" optional isDark={isDark} /><input value={values.address} onChange={(event) => update("address", event.target.value)} placeholder="Address" className={inputClass} /></>)}
								{control(
									<>
										<FieldLabel label="Subscription Start Date" required isDark={isDark} />
										<span className="relative block">
											<input type="date" value={values.subscriptionStart} onChange={(event) => update("subscriptionStart", event.target.value)} className={`${inputClass} pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`} />
											<CalendarDays className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
										</span>
									</>,
								)}
								{control(
									<>
										<FieldLabel label="Subscription Due Date" required isDark={isDark} />
										<span className="relative block">
											<input type="date" value={values.subscriptionDue} onChange={(event) => update("subscriptionDue", event.target.value)} className={`${inputClass} pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`} />
											<CalendarDays className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
										</span>
									</>,
								)}
								{control(
									<>
										<FieldLabel label="Subscription Extend Date" optional isDark={isDark} />
										<span className="relative block">
											<input type="date" value={values.subscriptionExtend} onChange={(event) => update("subscriptionExtend", event.target.value)} className={`${inputClass} pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`} />
											<CalendarDays className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
										</span>
									</>,
								)}
								{control(<><FieldLabel label="Subscription Expiry Count" optional isDark={isDark} /><input type="number" min="0" value={values.subscriptionExpiryCount} onChange={(event) => update("subscriptionExpiryCount", event.target.value)} placeholder="10" className={inputClass} /></>)}
								{control(<><FieldLabel label="Maximum Radius For Nearest POI (in Km)" info="Radius used to match the nearest point of interest." isDark={isDark} /><input type="number" min="0" value={values.maxPoiRadius} onChange={(event) => update("maxPoiRadius", event.target.value)} className={inputClass} /></>)}
								{control(<><FieldLabel label="Minimum Distance For Address (in Km)" info="Minimum distance before an address is resolved." isDark={isDark} /><input type="number" min="0" value={values.minAddressDistance} onChange={(event) => update("minAddressDistance", event.target.value)} className={inputClass} /></>)}
								{control(<><FieldLabel label="Data Restriction (in Days)" optional info="How many days of history this transporter can view." isDark={isDark} /><input type="number" min="0" value={values.dataRestriction} onChange={(event) => update("dataRestriction", event.target.value)} className={inputClass} /></>)}
							</div>
							<div className="mt-5 flex flex-col items-start gap-3">
								<label className={`flex cursor-pointer items-center gap-2.5 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									<input type="checkbox" checked={values.active === "true"} onChange={(event) => update("active", String(event.target.checked))} className="h-4 w-4 accent-cyan-500" />
									Active
								</label>
								<label className={`flex cursor-pointer items-center gap-2.5 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									<input
										type="checkbox"
										checked={values.overwriteSubscription === "true"}
										onChange={(event) => {
											if (event.target.checked) {
												setPendingSetting("overwriteSubscription");
												return;
											}
											update("overwriteSubscription", "false");
										}}
										className="h-4 w-4 accent-cyan-500"
									/>
									Overwrite Subscription for all vehicles
								</label>
								<label className={`flex cursor-pointer items-center gap-2.5 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									<input
										type="checkbox"
										checked={values.inactiveAfterExpiry === "true"}
										onChange={(event) => {
											if (event.target.checked) {
												setPendingSetting("inactiveAfterExpiry");
												return;
											}
											update("inactiveAfterExpiry", "false");
										}}
										className="h-4 w-4 accent-cyan-500"
									/>
									Should vehicle inactive after subscription expire
								</label>
							</div>
						</>
					) : null}

					{activeTab === "Access Management" ? (
						<section aria-label="Transporter role access">
							<label className="relative mb-3 block max-w-sm">
								<Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
								<input type="search" value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder="Search roles" aria-label="Search roles" className={`${inputClass} pl-9`} />
							</label>
							<div className={`overflow-hidden rounded-xl border ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
								<div className={`grid grid-cols-[1fr_100px] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? "bg-[#08142e] text-slate-400" : "bg-slate-100 text-slate-600"}`}>
									<span>Role Name</span>
									<span className="text-center">Assign</span>
								</div>
								<div className="max-h-[50vh] overflow-y-auto">
									{filteredRoles.map((role, index) => (
										<div key={role} className={`grid grid-cols-[1fr_100px] items-center px-4 py-2 text-xs ${isDark ? (index % 2 === 0 ? "bg-white/[0.035] text-slate-300" : "text-slate-300") : index % 2 === 0 ? "bg-slate-50 text-slate-700" : "bg-white text-slate-700"}`}>
											<span>{role}</span>
											<span className="flex justify-center">
												<button
													type="button"
													role="switch"
													aria-checked={rolePermissions[role] ?? false}
													aria-label={`Assign ${role}`}
													onClick={() => setRolePermissions((current) => ({ ...current, [role]: !current[role] }))}
													className={`relative h-[18px] w-[34px] rounded-full transition ${rolePermissions[role] ? (isDark ? "bg-cyan-400" : "bg-cyan-600") : isDark ? "bg-slate-700" : "bg-slate-300"}`}
												>
													<span className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-all ${rolePermissions[role] ? "left-[18px]" : "left-[3px]"}`} />
												</button>
											</span>
										</div>
									))}
								</div>
							</div>
						</section>
					) : null}

					{activeTab === "Billing Detail" ? (
						<div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
							{control(<><FieldLabel label="Billing Name" optional isDark={isDark} /><input value={values.billingName} onChange={(event) => update("billingName", event.target.value)} placeholder="Billing Name" className={inputClass} /></>)}
							{control(<><FieldLabel label="GST Number" optional isDark={isDark} /><input value={values.gstNumber} onChange={(event) => update("gstNumber", event.target.value)} placeholder="GST Number" className={inputClass} /></>)}
							{control(<><FieldLabel label="Billing Email" optional isDark={isDark} /><input type="email" value={values.billingEmail} onChange={(event) => update("billingEmail", event.target.value)} placeholder="Billing Email" className={inputClass} /></>)}
							{control(<><FieldLabel label="Billing Phone" optional isDark={isDark} /><input type="tel" value={values.billingPhone} onChange={(event) => update("billingPhone", event.target.value)} placeholder="Billing Phone" className={inputClass} /></>)}
							{control(<><FieldLabel label="Billing Address" optional isDark={isDark} /><input value={values.billingAddress} onChange={(event) => update("billingAddress", event.target.value)} placeholder="Billing Address" className={inputClass} /></>)}
							{control(
								<>
									<FieldLabel label="Payment Mode" optional isDark={isDark} />
									<span className="relative block">
										<select value={values.paymentMode} onChange={(event) => update("paymentMode", event.target.value)} className={`${inputClass} appearance-none pr-9`}>
											<option value="">Select</option>
											<option value="cash">Cash</option>
											<option value="online">Online</option>
											<option value="cheque">Cheque</option>
										</select>
										<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>⌄</span>
									</span>
								</>,
							)}
						</div>
					) : null}
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button type="button" onClick={resetForm} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-white/[0.10] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
						Reset
					</button>
					<button type="submit" disabled={isSaving} className={`h-9 rounded-lg border px-4 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]" : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"}`}>
						{isSaving ? "Saving…" : "Save"}
					</button>
				</footer>
			</form>

			{pendingSetting ? (
				<div className="fixed inset-0 z-[810] flex items-center justify-center bg-[#020718]/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingSetting(null); }}>
					<section role="alertdialog" aria-modal="true" aria-labelledby="transporter-setting-title" className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
						<h3 id="transporter-setting-title" className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Confirm setting</h3>
						<p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							{pendingSetting === "overwriteSubscription"
								? "This will overwrite the current subscription settings for all vehicles assigned to this transporter."
								: "Vehicles will become inactive when their subscription expires."}
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button type="button" onClick={() => setPendingSetting(null)} className={`h-9 rounded-lg border px-4 text-[12px] ${isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"}`}>Cancel</button>
							<button
								type="button"
								onClick={() => {
									update(pendingSetting, "true");
									setPendingSetting(null);
								}}
								className={`h-9 rounded-lg border px-4 text-[12px] font-semibold ${isDark ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50" : "border-cyan-300 bg-cyan-50 text-cyan-800"}`}
							>
								Save
							</button>
						</div>
					</section>
				</div>
			) : null}
		</div>
	);
}
