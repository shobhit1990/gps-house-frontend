import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ChevronDown, Eye, EyeOff, Info, Loader2, X } from "lucide-react";
import { groupAssignedToOptions } from "@/components/UserGroups/AddGroups";
import { Status } from "@/enums/Status";
import { UserType, userTypeOptions } from "@/enums/UserType";
import type { User } from "@/interfaces/User";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { digitsOnly, isValidPhone, PHONE_MAX_LENGTH, phoneErrorMessage } from "@/lib/formValidation";
import { useCreateGroupMutation, useGetGroupsQuery } from "@/store/services/api/Group";
import { useGetTimezonesQuery, useGetTransporterMasterQuery, useGetVehicleMasterQuery } from "@/store/services/api/Master";
import {
	useCreateUserMutation,
	useLazyGetUserByIdQuery,
	useUpdateUserMutation,
} from "@/store/services/api/User";

export type UserGroupValues = {
	name: string;
	assignedTo: string;
	vehicle: string;
	transporter: string;
};

export type UserFormValues = {
	username: string;
	password: string;
	confirmPassword: string;
	contactPerson: string;
	group: string;
	userType: string;
	timezone: string;
	company: string;
	companyAddress: string;
	phone: string;
	dataRestriction: string;
	active: boolean;
	schoolUser: boolean;
};

type AddUserProps = {
	onClose: () => void;
	onSubmit: () => void;
	/** When set, dialog opens in edit mode and saves via PUT `/user/update/:externalId`. */
	user?: User | null;
};

const tabs = ["Add Group", "Add User"] as const;
type UserTab = (typeof tabs)[number];

const usernamePattern = /^[A-Za-z0-9_.*@-]+$/;

const emptyGroup = (): UserGroupValues => ({ name: "", assignedTo: "", vehicle: "", transporter: "" });

const emptyUser = (): UserFormValues => ({
	username: "",
	password: "",
	confirmPassword: "",
	contactPerson: "",
	group: "",
	userType: "",
	timezone: "",
	company: "",
	companyAddress: "",
	phone: "",
	dataRestriction: "",
	active: true,
	schoolUser: false,
});

const valuesFromUser = (user: User): UserFormValues => ({
	username: user.userName ?? "",
	password: "",
	confirmPassword: "",
	contactPerson: user.contactPersonName ?? "",
	group: user.group ?? "",
	userType: String(user.userType ?? ""),
	timezone: user.timezone ?? "",
	company: user.companyName ?? "",
	companyAddress: user.companyAddress ?? "",
	phone: digitsOnly(String(user.phone ?? ""), PHONE_MAX_LENGTH),
	dataRestriction: user.dataRestrictionDays != null ? String(user.dataRestrictionDays) : "",
	active: user.status !== Status.INACTIVE,
	schoolUser: Boolean(user.isSchoolUser),
});

export function AddUser({ onClose, onSubmit, user }: AddUserProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const isEditMode = Boolean(user?.externalId);
	const titleId = useId();
	const [activeTab, setActiveTab] = useState<UserTab>(isEditMode ? "Add User" : "Add Group");
	const [groupValues, setGroupValues] = useState<UserGroupValues>(emptyGroup);
	const [values, setValues] = useState<UserFormValues>(() => (user ? valuesFromUser(user) : emptyUser()));
	const [formError, setFormError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
	const { data: timezoneMaster = [], isLoading: timezonesLoading } = useGetTimezonesQuery();
	const { data: vehicles = [], isLoading: vehiclesLoading } = useGetVehicleMasterQuery();
	const { data: transporters = [], isLoading: transportersLoading } = useGetTransporterMasterQuery();
	const timezones = timezoneMaster
		.map((timezone) => ({
			value: String(timezone.id ?? timezone.externalId ?? ""),
			label: timezone.timezone ?? "",
		}))
		.filter((timezone) => timezone.value && timezone.label);
	const [loadUser, { isFetching: loadingUser }] = useLazyGetUserByIdQuery();
	const [createGroup, { isLoading: creatingGroup }] = useCreateGroupMutation();
	const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
	const [updateUser, { isLoading: updatingUser }] = useUpdateUserMutation();
	const isSaving = creatingGroup || creatingUser || updatingUser;

	useEffect(() => {
		if (!user?.externalId) {
			setValues(emptyUser());
			setActiveTab("Add Group");
			return;
		}

		let cancelled = false;
		setActiveTab("Add User");
		setValues(valuesFromUser(user));

		void loadUser(user.externalId)
			.unwrap()
			.then((loaded) => {
				if (!cancelled) setValues(valuesFromUser(loaded));
			})
			.catch((error) => {
				console.error("Failed to load user for edit.", error);
				if (!cancelled) {
					setFormError(apiErrorMessage(error, "Could not load user details."));
				}
			});

		return () => {
			cancelled = true;
		};
	}, [user, loadUser]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const updateGroup = <K extends keyof UserGroupValues>(key: K, value: UserGroupValues[K]) => {
		setGroupValues((current) => ({ ...current, [key]: value }));
		setFormError("");
	};

	const handleAssignedToChange = (assignedTo: string) => {
		setGroupValues((current) => ({ ...current, assignedTo, vehicle: "", transporter: "" }));
		setFormError("");
	};

	const update = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
		setValues((current) => ({ ...current, [key]: value }));
		setFormError("");
	};

	const field = (label: string, control: ReactNode, required = false, optional = false, hint?: string) => (
		<label className="block min-w-0">
			<span className={labelClass}>
				{label}
				{required && <span className="ml-0.5 text-rose-400">*</span>}
				{optional && <span className="ml-1 font-normal text-slate-500">(Optional)</span>}
			</span>
			{control}
			{hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
		</label>
	);

	const submitGroup = async (event: FormEvent) => {
		event.preventDefault();
		const name = groupValues.name.trim();
		if (!name || !groupValues.assignedTo) {
			setFormError("Group Name and Assigned To are required.");
			return;
		}
		if (groupValues.assignedTo === "vehicle" && !groupValues.vehicle) {
			setFormError("Please select a vehicle.");
			return;
		}
		if (groupValues.assignedTo === "transporter" && !groupValues.transporter) {
			setFormError("Please select a transporter.");
			return;
		}
		if (groups.some((group) => group.groupName?.toLowerCase() === name.toLowerCase())) {
			setFormError("A group with this name already exists.");
			return;
		}
		try {
			const group = await createGroup({
				groupName: name,
				assignedTo: groupValues.assignedTo,
				...(groupValues.assignedTo === "vehicle" ? { vehicle: groupValues.vehicle } : {}),
				...(groupValues.assignedTo === "transporter" ? { transporter: groupValues.transporter } : {}),
				status: Status.ACTIVE,
				reason: "Group created",
			}).unwrap();
			toast.success(`${name} saved.`);
			setValues((current) => ({ ...current, group: group.externalId }));
			setGroupValues(emptyGroup());
			setFormError("");
			setActiveTab("Add User");
		} catch (error) {
			console.error("Failed to create group.", error);
			setFormError(apiErrorMessage(error, "Could not save the group. Please try again."));
		}
	};

	const submitUser = async (event: FormEvent) => {
		event.preventDefault();
		const passwordRequired = !isEditMode;
		if (
			!values.username.trim() ||
			(passwordRequired && (!values.password || !values.confirmPassword)) ||
			!values.group ||
			!values.userType ||
			!values.timezone ||
			!values.company.trim()
		) {
			setFormError(
				isEditMode
					? "Username, Group, User Type, Timezone, and Company Name are required."
					: "Username, Password, Confirm Password, Group, User Type, Timezone, and Company Name are required.",
			);
			return;
		}
		if (!usernamePattern.test(values.username.trim())) {
			setFormError("Username can only contain A-z, 0-9, _, -, ., *, and @.");
			return;
		}
		if (values.password || values.confirmPassword) {
			if (values.password !== values.confirmPassword) {
				setFormError("Password and Confirm Password must match.");
				return;
			}
		}
		if (!Object.values(UserType).includes(values.userType as UserType)) {
			setFormError("Please select a valid user type.");
			return;
		}
		if (!isValidPhone(values.phone)) {
			setFormError(phoneErrorMessage);
			return;
		}
		const text = (value: string) => value.trim() || undefined;
		const body = {
			userName: values.username.trim(),
			group: values.group,
			userType: values.userType as UserType,
			timezone: values.timezone,
			companyName: values.company.trim(),
			contactPersonName: text(values.contactPerson),
			phone: text(values.phone),
			companyAddress: text(values.companyAddress),
			dataRestrictionDays: values.dataRestriction ? Number(values.dataRestriction) : undefined,
			isSchoolUser: values.schoolUser,
			status: values.active ? Status.ACTIVE : Status.INACTIVE,
			reason: isEditMode ? "User updated" : "New user created",
			...(values.password
				? {
						password: values.password,
						confirmPassword: values.confirmPassword,
					}
				: {}),
		};
		try {
			if (isEditMode && user?.externalId) {
				await updateUser({ externalId: user.externalId, body }).unwrap();
				toast.success(`${values.username.trim()} updated.`);
			} else {
				await createUser({
					...body,
					password: values.password,
					confirmPassword: values.confirmPassword,
				}).unwrap();
				toast.success(`${values.username.trim()} saved.`);
			}
			onSubmit();
		} catch (error) {
			console.error(`Failed to ${isEditMode ? "update" : "create"} user.`, error);
			setFormError(apiErrorMessage(error, `Could not ${isEditMode ? "update" : "save"} the user. Please try again.`));
		}
	};

	const resetCurrent = () => {
		setFormError("");
		if (activeTab === "Add Group") {
			setGroupValues(emptyGroup());
		} else {
			setValues(user ? valuesFromUser(user) : emptyUser());
			setShowPassword(false);
			setShowConfirmPassword(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
			<button type="button" aria-label="Close user form" className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]" onClick={onClose} />
			<form
				onSubmit={activeTab === "Add Group" ? submitGroup : submitUser}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={`relative flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<h2 id={titleId} className="text-[15px] font-semibold">{isEditMode ? "Edit User" : "Add User"}</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				{!isEditMode ? (
					<nav aria-label="User form sections" className="shrink-0 overflow-x-auto px-5 pt-4 sm:px-6">
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
				) : null}

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
					{loadingUser ? (
						<p className={`mb-4 text-[12px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading user details…</p>
					) : null}
					{formError && (
						<p role="alert" className={`mb-5 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
							{formError}
						</p>
					)}
					{activeTab === "Add Group" && !isEditMode ? (
						<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
							{field("Group Name", <input required value={groupValues.name} placeholder="Group Name" onChange={(event) => updateGroup("name", event.target.value)} className={inputClass} />, true)}
							<label className="block min-w-0">
								<span className={labelClass}>Assigned To <span className="text-rose-400">*</span></span>
								<span className="relative block">
									<select required value={groupValues.assignedTo} onChange={(event) => handleAssignedToChange(event.target.value)} className={`${inputClass} appearance-none pr-8`}>
										<option value="">Select</option>
										{groupAssignedToOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>
							</label>
							{groupValues.assignedTo === "vehicle" && (
								<label className="block min-w-0 sm:col-span-2">
									<span className={labelClass}>Vehicle <span className="text-rose-400">*</span></span>
									<span className="relative block max-w-md">
										<select required value={groupValues.vehicle} disabled={vehiclesLoading} onChange={(event) => updateGroup("vehicle", event.target.value)} className={`${inputClass} appearance-none pr-8`}>
											<option value="">{vehiclesLoading ? "Loading vehicles…" : "Select Vehicle"}</option>
											{vehicles.map((vehicle) => (
												<option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
											))}
										</select>
										<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
									</span>
								</label>
							)}
							{groupValues.assignedTo === "transporter" && (
								<label className="block min-w-0 sm:col-span-2">
									<span className={labelClass}>Transporter <span className="text-rose-400">*</span></span>
									<span className="relative block max-w-md">
										<select required value={groupValues.transporter} disabled={transportersLoading} onChange={(event) => updateGroup("transporter", event.target.value)} className={`${inputClass} appearance-none pr-8`}>
											<option value="">{transportersLoading ? "Loading transporters…" : "Select Transporter"}</option>
											{transporters.map((transporter) => (
												<option key={transporter.id} value={transporter.id}>{transporter.name}</option>
											))}
										</select>
										<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
									</span>
								</label>
							)}
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
								{field("Username", <input required value={values.username} placeholder="Username" onChange={(event) => update("username", event.target.value)} className={inputClass} />, true, false, "Only contains [ A-z, 0-9, _, -, ., *, @ ]")}
								{field(
									"Password",
									<span className="relative block">
										<input
											required={!isEditMode}
											type={showPassword ? "text" : "password"}
											value={values.password}
											placeholder={isEditMode ? "Leave blank to keep current" : "Password"}
											onChange={(event) => update("password", event.target.value)}
											className={`${inputClass} pr-10`}
										/>
										<button
											type="button"
											onClick={() => setShowPassword((visible) => !visible)}
											aria-label={showPassword ? "Hide password" : "Show password"}
											className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center ${isDark ? "text-slate-400 hover:text-cyan-100" : "text-slate-500 hover:text-cyan-700"}`}
										>
											{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</span>,
									!isEditMode,
									isEditMode,
								)}
								{field(
									"Confirm Password",
									<span className="relative block">
										<input
											required={!isEditMode || Boolean(values.password)}
											type={showConfirmPassword ? "text" : "password"}
											value={values.confirmPassword}
											placeholder="Confirm Password"
											onChange={(event) => update("confirmPassword", event.target.value)}
											className={`${inputClass} pr-10`}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword((visible) => !visible)}
											aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
											className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center ${isDark ? "text-slate-400 hover:text-cyan-100" : "text-slate-500 hover:text-cyan-700"}`}
										>
											{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</span>,
									!isEditMode,
									isEditMode,
								)}
								{field("Contact Person Name", <input value={values.contactPerson} placeholder="Contact Person Name" onChange={(event) => update("contactPerson", event.target.value)} className={inputClass} />, false, true)}
								<label className="block min-w-0">
									<span className={labelClass}>Group <span className="text-rose-400">*</span></span>
									<span className="relative block">
										<select required value={values.group} disabled={groupsLoading} onChange={(event) => update("group", event.target.value)} className={`${inputClass} appearance-none pr-8`}>
											<option value="">{groupsLoading ? "Loading groups…" : "Select Group"}</option>
											{groups.map((group) => <option key={group.externalId} value={group.externalId}>{group.groupName}</option>)}
										</select>
										<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
									</span>
								</label>
								<label className="block min-w-0">
									<span className={labelClass}>User Type <span className="text-rose-400">*</span></span>
									<span className="relative block">
										<select required value={values.userType} onChange={(event) => update("userType", event.target.value)} className={`${inputClass} appearance-none pr-8`}>
											<option value="">Select User Type</option>
											{userTypeOptions.map((option) => (
												<option key={option.value} value={option.value}>{option.label}</option>
											))}
										</select>
										<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
									</span>
								</label>
								<label className="block min-w-0">
									<span className={labelClass}>Timezone <span className="text-rose-400">*</span></span>
									<span className="relative block">
										<select required value={values.timezone} disabled={timezonesLoading} onChange={(event) => update("timezone", event.target.value)} className={`${inputClass} appearance-none pr-8`}>
											<option value="">{timezonesLoading ? "Loading timezones…" : "Select Timezone"}</option>
											{timezones.map((timezone) => <option key={timezone.value} value={timezone.value}>{timezone.label}</option>)}
										</select>
										<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
									</span>
								</label>
								{field("Company Name", <input required value={values.company} placeholder="Company Name" onChange={(event) => update("company", event.target.value)} className={inputClass} />, true)}
								{field("Company Address", <input value={values.companyAddress} placeholder="Company Address" onChange={(event) => update("companyAddress", event.target.value)} className={inputClass} />, false, true)}
								{field("Phone", <input type="tel" inputMode="numeric" maxLength={PHONE_MAX_LENGTH} value={values.phone} placeholder="10 digit phone" onChange={(event) => update("phone", digitsOnly(event.target.value, PHONE_MAX_LENGTH))} className={inputClass} />, false, true)}
								<label className="block min-w-0">
									<span className={labelClass}>Data Restriction (in Days) <span className="font-normal text-slate-500">(Optional)</span></span>
									<span className="relative block">
										<input
											inputMode="numeric"
											value={values.dataRestriction}
											placeholder="Days"
											onChange={(event) => update("dataRestriction", event.target.value.replace(/\D/g, ""))}
											className={`${inputClass} pr-8`}
										/>
										<button type="button" aria-label="Data restriction limits how many past days of data this user can view" title="Limits how many past days of data this user can view." className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
											<Info className="h-3.5 w-3.5" />
										</button>
									</span>
								</label>
							</div>
							<div className="mt-5 flex flex-col gap-2.5">
								<label className={`flex cursor-pointer items-center gap-2.5 text-[12px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									<input type="checkbox" checked={values.active} onChange={(event) => update("active", event.target.checked)} className="h-3.5 w-3.5 accent-cyan-300" />
									Active
								</label>
								<label className={`flex cursor-pointer items-center gap-2.5 text-[12px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									<input type="checkbox" checked={values.schoolUser} onChange={(event) => update("schoolUser", event.target.checked)} className="h-3.5 w-3.5 accent-cyan-300" />
									Is school user
								</label>
							</div>
						</>
					)}
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					{activeTab === "Add Group" && !isEditMode && (
						<button type="button" onClick={() => { setFormError(""); setActiveTab("Add User"); }} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
							Skip
						</button>
					)}
					<button type="button" onClick={resetCurrent} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
						Reset
					</button>
					<button type="submit" disabled={isSaving || loadingUser} className={`flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						{isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						{isEditMode ? "Update" : "Save"}
					</button>
				</footer>
			</form>
		</div>
	);
}
