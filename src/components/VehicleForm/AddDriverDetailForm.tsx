import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { digitsOnly, isValidPhone, PHONE_MAX_LENGTH, phoneErrorMessage } from "@/lib/formValidation";
import type { DriverDetail } from "@/interfaces/DriverDetail";
import type { MasterOption } from "@/interfaces/EntityMaster";
import { Status } from "@/enums/Status";
import { useGetClientMasterQuery, useGetTransporterMasterQuery } from "@/store/services/api/Master";
import { useGetLicensesQuery } from "@/store/services/api/License";

export type DriverDocumentValues = {
	id: number;
	name: string;
	fileName: string;
	file?: File;
};

export type DriverDetailFormValues = {
	client: string;
	transporter: string;
	firstName: string;
	lastName: string;
	deviceId: string;
	joiningDate: string;
	leavingDate: string;
	dateOfBirth: string;
	experience: string;
	salary: string;
	phone: string;
	licenseNumber: string;
	licenseIssue: string;
	licenseExpiry: string;
	insuranceNo: string;
	insuranceExpiry: string;
	mediclaimNo: string;
	mediclaimExpiry: string;
	bloodGroup: string;
	supervisorName: string;
	supervisorPhone: string;
	address: string;
	active: boolean;
	licenseAvailable: boolean;
	licenseVerified: boolean;
	geoAttendance: boolean;
	licenseToDrive: string;
	geofences: string;
	reason: string;
	documents: DriverDocumentValues[];
};

type AddDriverDetailFormProps = {
	onClose: () => void;
	onSubmit: (values: DriverDetailFormValues, externalId?: string) => Promise<string>;
	driver?: DriverDetail;
};

const tabs = ["Add Driver Detail", "Upload Documents"] as const;
type DriverTab = (typeof tabs)[number];

const isoDate = (date: Date) => {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
};

const today = () => isoDate(new Date());

const yearsAgo = (years: number) => {
	const date = new Date();
	date.setFullYear(date.getFullYear() - years);
	return isoDate(date);
};

const isAtLeastEighteen = (dateOfBirth: string) => {
	if (!dateOfBirth) return false;
	const birthDate = new Date(`${dateOfBirth}T00:00:00`);
	if (Number.isNaN(birthDate.getTime())) return false;
	const minimumBirthDate = new Date();
	minimumBirthDate.setHours(0, 0, 0, 0);
	minimumBirthDate.setFullYear(minimumBirthDate.getFullYear() - 18);
	return birthDate <= minimumBirthDate;
};

const detailDefaults = () => ({
	client: "",
	transporter: "",
	firstName: "",
	lastName: "",
	deviceId: "",
	joiningDate: today(),
	leavingDate: today(),
	dateOfBirth: yearsAgo(18),
	experience: "0",
	salary: "0",
	phone: "",
	licenseNumber: "",
	licenseIssue: today(),
	licenseExpiry: today(),
	insuranceNo: "",
	insuranceExpiry: today(),
	mediclaimNo: "",
	mediclaimExpiry: today(),
	bloodGroup: "",
	supervisorName: "",
	supervisorPhone: "",
	address: "",
	active: true,
	licenseAvailable: true,
	licenseVerified: false,
	geoAttendance: false,
	licenseToDrive: "",
	geofences: "",
	reason: "",
});

/** API ISO / datetime → `YYYY-MM-DD` for `<input type="date">`. */
const toDateInputValue = (value?: string) => {
	const day = value?.trim().slice(0, 10) ?? "";
	return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
};

const resolveMasterId = (value: string, options: MasterOption[], nameHint?: string) => {
	const raw = value.trim();
	const hint = nameHint?.trim().toLowerCase() ?? "";
	if (raw) {
		const byId = options.find(
			(option) => option.id === raw || String(option.externalId ?? "") === raw,
		);
		if (byId) return byId.id;
	}
	if (hint) {
		const byName = options.find((option) => option.name?.trim().toLowerCase() === hint);
		if (byName) return byName.id;
	}
	return raw;
};

const resolveLicenseId = (values: string[], options: MasterOption[]) => {
	for (const raw of values.map((value) => String(value ?? "").trim()).filter(Boolean)) {
		const byId = options.find((option) => option.id === raw || String(option.externalId ?? "") === raw);
		if (byId) return byId.id;
		const byName = options.find((option) => option.name?.trim().toLowerCase() === raw.toLowerCase());
		if (byName) return byName.id;
	}
	return values[0] ? String(values[0]) : "";
};

const toFormValues = (
	driver: DriverDetail,
	clients: MasterOption[] = [],
	transporters: MasterOption[] = [],
	licenses: MasterOption[] = [],
): ReturnType<typeof detailDefaults> => ({
	...detailDefaults(),
	client: resolveMasterId(String(driver.client ?? ""), clients, driver.clientName),
	transporter: resolveMasterId(String(driver.transporter ?? ""), transporters, driver.transporterName),
	firstName: driver.firstName ?? "",
	lastName: driver.lastName ?? "",
	deviceId: driver.deviceId ?? "",
	joiningDate: toDateInputValue(driver.dateOfJoining) || today(),
	leavingDate: toDateInputValue(driver.dateOfLeaving) || today(),
	dateOfBirth: toDateInputValue(driver.dateOfBirth) || yearsAgo(18),
	experience: String(driver.experience ?? 0),
	salary: String(driver.salary ?? 0),
	phone: digitsOnly(String(driver.phoneNumber ?? ""), PHONE_MAX_LENGTH),
	licenseNumber: driver.licenseNumber ?? "",
	licenseIssue: toDateInputValue(driver.licenseIssueDate) || today(),
	licenseExpiry: toDateInputValue(driver.licenseExpiryDate) || today(),
	insuranceNo: driver.lifeInsuranceNumber ?? "",
	insuranceExpiry: toDateInputValue(driver.lifeInsuranceExpiryDate) || today(),
	mediclaimNo: driver.mediclaimNumber ?? "",
	mediclaimExpiry: toDateInputValue(driver.mediclaimExpiryDate) || today(),
	bloodGroup: driver.bloodGroup ?? "",
	supervisorName: driver.supervisorName ?? "",
	supervisorPhone: digitsOnly(String(driver.supervisorPhoneNumber ?? ""), PHONE_MAX_LENGTH),
	address: driver.address ?? "",
	active: String(driver.status ?? "").toLowerCase() !== Status.INACTIVE,
	licenseAvailable: driver.licenseAvailable ?? false,
	licenseVerified: driver.licenseVerified ?? false,
	geoAttendance: driver.enableGeoVerifiedAttendance ?? false,
	licenseToDrive: resolveLicenseId(driver.licenseToDrive ?? [], licenses),
	geofences: (driver.geofences ?? []).filter(Boolean).join(", "),
	reason: driver.reason ?? "",
});

export function AddDriverDetailForm({ onClose, onSubmit, driver }: AddDriverDetailFormProps) {
	const { data: clientMaster = [] } = useGetClientMasterQuery();
	const clients = clientMaster;
	const { data: transporterMaster = [] } = useGetTransporterMasterQuery();
	const transporters = transporterMaster;
	const { data: licenses = [], isLoading: licensesLoading } = useGetLicensesQuery();
	const licenseOptions: MasterOption[] = useMemo(
		() =>
			licenses.map((item) => ({
				id: item.externalId,
				externalId: item.externalId,
				name: item.license,
			})),
		[licenses],
	);
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const nextDocumentId = useRef(1);
	const [activeTab, setActiveTab] = useState<DriverTab>(tabs[0]);
	const [values, setValues] = useState(() =>
		driver ? toFormValues(driver, clients, transporters, licenseOptions) : detailDefaults(),
	);
	const [documents, setDocuments] = useState<DriverDocumentValues[]>([]);
	const [formError, setFormError] = useState("");
	const [detailsSaved, setDetailsSaved] = useState(Boolean(driver?.externalId));
	const [savedDriverId, setSavedDriverId] = useState(driver?.externalId ?? "");
	const [isSavingDetails, setIsSavingDetails] = useState(false);
	const isEditMode = Boolean(driver?.externalId);
	const driverKey = driver?.externalId ?? "";

	useEffect(() => {
		if (!driverKey || !driver) {
			setValues(detailDefaults());
			setSavedDriverId("");
			setDetailsSaved(false);
			setActiveTab(tabs[0]);
			setDocuments([]);
			setFormError("");
			return;
		}
		setValues(toFormValues(driver, clients, transporters, licenseOptions));
		setSavedDriverId(driver.externalId);
		setDetailsSaved(true);
		setActiveTab(tabs[0]);
		setDocuments([]);
		setFormError("");
		// Only re-seed when switching driver records.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- masters rematch in the next effect
	}, [driverKey]);

	useEffect(() => {
		if (!driverKey || !driver) return;
		if (!clients.length && !transporters.length && !licenseOptions.length) return;
		setValues((current) => {
			const clientMatched = clients.some((option) => option.id === current.client);
			const transporterMatched = transporters.some((option) => option.id === current.transporter);
			const licenseMatched =
				!current.licenseToDrive ||
				licenseOptions.some((option) => option.id === current.licenseToDrive);
			if (clientMatched && transporterMatched && licenseMatched) return current;
			const next = toFormValues(driver, clients, transporters, licenseOptions);
			return {
				...current,
				client: clientMatched ? current.client : next.client || current.client,
				transporter: transporterMatched ? current.transporter : next.transporter || current.transporter,
				licenseToDrive: licenseMatched ? current.licenseToDrive : next.licenseToDrive || current.licenseToDrive,
			};
		});
	}, [driver, driverKey, clients, transporters, licenseOptions]);

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
	const fileClass = `h-[37px] min-w-0 flex-1 rounded-lg border px-2 text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:text-[12px] file:font-medium ${
		isDark ? "border-white/[0.09] bg-[#03091c]/70 text-slate-400 file:text-slate-200" : "border-slate-200 bg-white text-slate-600 file:text-slate-700"
	}`;

	const update = (name: keyof ReturnType<typeof detailDefaults>, value: string | boolean) => {
		setValues((current) => ({ ...current, [name]: value }));
		setFormError("");
	};

	const addDocument = () => {
		const id = nextDocumentId.current;
		nextDocumentId.current += 1;
		setDocuments((current) => [...current, { id, name: "", fileName: "" }]);
		setFormError("");
	};

	const patchDocument = (id: number, patch: Partial<DriverDocumentValues>) => {
		setDocuments((current) => current.map((document) => (document.id === id ? { ...document, ...patch } : document)));
		setFormError("");
	};

	const validateDetails = () => {
		if (!values.client || !values.transporter || !values.firstName.trim() || !values.lastName.trim()) {
			setActiveTab("Add Driver Detail");
			setFormError("Client, Transporter, First Name, and Last Name are required.");
			return false;
		}
		if (!isAtLeastEighteen(values.dateOfBirth)) {
			setActiveTab("Add Driver Detail");
			setFormError("Driver must be above 18 years");
			return false;
		}
		if (!isValidPhone(values.phone) || !isValidPhone(values.supervisorPhone)) {
			setActiveTab("Add Driver Detail");
			setFormError(phoneErrorMessage);
			return false;
		}
		return true;
	};

	const detailPayload = (): DriverDetailFormValues => ({
		...values,
		firstName: values.firstName.trim(),
		lastName: values.lastName.trim(),
		experience: values.experience.trim() || "0",
		salary: values.salary.trim() || "0",
		documents: [],
	});

	/** Create on Continue for new drivers; update immediately for edit so autofilled changes persist. */
	const persistDetails = async (): Promise<string | null> => {
		if (!isEditMode && detailsSaved && savedDriverId) return savedDriverId;
		setIsSavingDetails(true);
		try {
			const driverId = await onSubmit(
				detailPayload(),
				isEditMode ? driver?.externalId || savedDriverId || undefined : undefined,
			);
			setSavedDriverId(driverId);
			setDetailsSaved(true);
			return driverId;
		} catch (error) {
			setFormError(apiErrorMessage(error, `Unable to ${isEditMode ? "update" : "save"} driver details.`));
			return null;
		} finally {
			setIsSavingDetails(false);
		}
	};

	const openUploadDocumentsTab = async () => {
		if (!validateDetails()) return false;
		const driverId = await persistDetails();
		if (!driverId) return false;
		setFormError("");
		setActiveTab("Upload Documents");
		return true;
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError("");

		if (activeTab === "Add Driver Detail") {
			if (isEditMode) {
				if (!validateDetails()) return;
				const driverId = await persistDetails();
				if (!driverId) return;
				onClose();
				return;
			}
			await openUploadDocumentsTab();
			return;
		}

		if (documents.length > 0) {
			if (documents.some((document) => !document.name.trim() || !document.fileName)) {
				setFormError("Each document needs a name and a file.");
				return;
			}
			if (documents.some((document) => !document.file)) {
				setFormError("Please select a file for each document.");
				return;
			}
		}

		const driverId = savedDriverId || driver?.externalId || "";
		if (!driverId) {
			setFormError("Save driver details before uploading documents.");
			setActiveTab("Add Driver Detail");
			return;
		}

		try {
			setIsSavingDetails(true);
			await onSubmit(
				{
					...detailPayload(),
					documents,
				},
				driverId,
			);
			setDetailsSaved(true);
			setIsSavingDetails(false);
			onClose();
		} catch (error) {
			setIsSavingDetails(false);
			setFormError(apiErrorMessage(error, "Unable to update driver details."));
		}
	};

	const field = (label: string, control: ReactNode, required?: boolean, className?: string) => (
		<label className={`${labelClass} ${className ?? ""}`}>
			<span className="mb-1.5 flex items-center gap-1">
				{label}
				{required ? <span className="text-rose-400">*</span> : null}
			</span>
			{control}
		</label>
	);

	const text = (name: keyof ReturnType<typeof detailDefaults>, placeholder: string, required?: boolean) => (
		<input required={required} value={String(values[name])} placeholder={placeholder} onChange={(event) => update(name, event.target.value)} className={inputClass} />
	);

	const phone = (name: "phone" | "supervisorPhone", placeholder: string) => (
		<input
			type="tel"
			inputMode="numeric"
			maxLength={PHONE_MAX_LENGTH}
			value={String(values[name])}
			placeholder={placeholder}
			onChange={(event) => update(name, digitsOnly(event.target.value, PHONE_MAX_LENGTH))}
			className={inputClass}
		/>
	);

	const select = (name: keyof ReturnType<typeof detailDefaults>, placeholder: string, options: MasterOption[], required?: boolean) => (
		<select required={required} value={String(values[name])} onChange={(event) => update(name, event.target.value)} className={inputClass}>
			<option value="">{placeholder}</option>
			{options.map((option) => (
				<option key={option.id} value={option.id}>{option.name}</option>
			))}
		</select>
	);

	const date = (name: keyof ReturnType<typeof detailDefaults>) => (
		<input
			type="date"
			value={String(values[name])}
			max={name === "dateOfBirth" ? yearsAgo(18) : undefined}
			onChange={(event) => update(name, event.target.value)}
			className={inputClass}
		/>
	);

	const check = (name: "licenseAvailable" | "licenseVerified" | "geoAttendance", label: string) => (
		<label className={`flex items-center gap-2 ${labelClass}`}>
			<input type="checkbox" checked={values[name]} onChange={(event) => update(name, event.target.checked)} className="h-4 w-4 accent-cyan-500" />
			{label}
		</label>
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
						<h2 id={titleId} className="text-[15px] font-semibold">{isEditMode ? "Edit Driver Detail" : "Add Driver Detail"}</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close driver detail form" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<nav aria-label="Driver detail sections" className="shrink-0 overflow-x-auto px-5 pt-4 sm:px-6">
					<div className={`flex min-w-max border-b ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
						{tabs.map((tab) => (
							<button
								key={tab}
								type="button"
								disabled={!isEditMode && detailsSaved && tab === "Add Driver Detail"}
								onClick={() => {
									if (tab === "Upload Documents") {
										void openUploadDocumentsTab();
									} else {
										setActiveTab(tab);
										setFormError("");
									}
								}}
								aria-current={activeTab === tab ? "step" : undefined}
								className={`min-h-[36px] flex-1 whitespace-nowrap border-b px-4 text-[12px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
					{activeTab === "Add Driver Detail" ? (
						<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
							{field("Client", select("client", "Select Client", clients, true), true)}
							{field("Transporter", select("transporter", "Select", transporters))}
							{field("First Name", text("firstName", "First Name", true), true)}
							{field("Last Name", text("lastName", "Last Name", true), true)}
							{field("Device Id", text("deviceId", "Device Id"))}
							{field("Date of joining", date("joiningDate"))}
							{field("Date of leaving", date("leavingDate"))}
							{field("D.O.B", date("dateOfBirth"))}
							{field("Experience", <input type="text" inputMode="numeric" value={values.experience} onChange={(event) => update("experience", digitsOnly(event.target.value))} className={inputClass} />)}
							{field("Salary", <input type="text" inputMode="numeric" value={values.salary} onChange={(event) => update("salary", digitsOnly(event.target.value))} className={inputClass} />)}
							{field("Phone No.", phone("phone", "10 digit phone"))}
							{field("License Number", text("licenseNumber", "License Number"))}
							{field(
								"License to Drive",
								<select
									value={values.licenseToDrive}
									disabled={licensesLoading}
									onChange={(event) => update("licenseToDrive", event.target.value)}
									className={inputClass}
								>
									<option value="">{licensesLoading ? "Loading licenses…" : "Select License"}</option>
									{licenseOptions.map((option) => (
										<option key={option.id} value={option.id}>{option.name}</option>
									))}
								</select>,
							)}
							{field("License issue date", date("licenseIssue"))}
							{field("License expiry date", date("licenseExpiry"))}
							{field("Life insurance No.", text("insuranceNo", "Life insurance No."))}
							{field("Life insurance expiry date", date("insuranceExpiry"))}
							{field("Mediclaim No.", text("mediclaimNo", "Mediclaim No."))}
							{field("Mediclaim expiry date", date("mediclaimExpiry"))}
							{field("Blood Group", text("bloodGroup", "Blood Group"))}
							{field("Supervisor Name", text("supervisorName", "Supervisor Name"))}
							{field("Supervisor Phone No.", phone("supervisorPhone", "10 digit phone"))}
							{field("Address", text("address", "Address"), false, "xl:col-span-2")}
							{field("Geofence IDs (comma-separated)", text("geofences", "Geofence IDs"), false, "xl:col-span-2")}
							{field("Reason", text("reason", "Reason"), false, "xl:col-span-2")}
							<div className="flex flex-col gap-3 sm:col-span-2 xl:col-span-4">
								{check("licenseAvailable", "License available")}
								{check("licenseVerified", "License verified")}
								{check("geoAttendance", "Enable Geo-verified Attendance")}
							</div>
						</div>
					) : (
						<div className="flex min-h-[280px] flex-col gap-5">
							{documents.length > 0 ? (
								<div className="space-y-5">
									{documents.map((document) => (
										<div key={document.id} className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
											<label className={labelClass}>
												<span className="mb-1.5 flex items-center gap-1">
													Document Name <span className="text-rose-400">*</span>
												</span>
												<input
													value={document.name}
													placeholder="Document Name"
													onChange={(event) => patchDocument(document.id, { name: event.target.value })}
													className={inputClass}
												/>
											</label>
											<div>
												<span className={`mb-1.5 flex items-center gap-1 ${labelClass}`}>
													Upload Document <span className="text-rose-400">*</span>
												</span>
												<div className="flex items-center gap-3">
													<input
														type="file"
														aria-label={`Upload document ${document.name || document.id}`}
														onChange={(event) => {
															const file = event.target.files?.[0];
															patchDocument(document.id, { file, fileName: file?.name ?? "" });
														}}
														className={fileClass}
													/>
													<button
														type="button"
														aria-label={`Remove document ${document.name || document.id}`}
														onClick={() => {
															setDocuments((current) => current.filter((item) => item.id !== document.id));
															setFormError("");
														}}
														className={`flex h-[37px] w-[37px] shrink-0 items-center justify-center rounded-lg border transition ${
															isDark
																? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-200 hover:bg-cyan-300/[0.18]"
																: "border-cyan-200 bg-cyan-50 text-cyan-600 hover:bg-cyan-100"
														}`}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							) : null}
							<button
								type="button"
								onClick={addDocument}
								className={`inline-flex h-9 w-fit items-center gap-2 rounded-lg border px-3 text-[12px] font-semibold transition ${
									isDark
										? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
										: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
								}`}
							>
								<Plus className="h-3.5 w-3.5" /> Add Document
							</button>
						</div>
					)}
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					{activeTab === "Add Driver Detail" && (
						<button
							type="button"
							onClick={() => {
								setValues(
									driver
										? toFormValues(driver, clients, transporters, licenseOptions)
										: detailDefaults(),
								);
								setFormError("");
							}}
							disabled={isSavingDetails}
							className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition disabled:opacity-60 ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
						>
							Reset
						</button>
					)}
					{isEditMode && activeTab === "Add Driver Detail" ? (
						<button
							type="button"
							disabled={isSavingDetails}
							onClick={() => void openUploadDocumentsTab()}
							className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition disabled:opacity-60 ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
						>
							Documents
						</button>
					) : null}
					<button type="submit" disabled={isSavingDetails} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						{isSavingDetails && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
						{isSavingDetails
							? "Saving..."
							: activeTab === "Add Driver Detail"
								? isEditMode
									? "Update"
									: "Save & Continue"
								: "Save"}
					</button>
				</footer>
			</form>
		</div>
	);
}
