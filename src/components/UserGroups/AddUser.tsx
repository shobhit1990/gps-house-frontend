import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ChevronDown, Info, Loader2, X } from "lucide-react";
import { groupAssignedToOptions } from "@/components/UserGroups/AddGroups";
import { Status } from "@/enums/Status";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useCreateGroupMutation, useGetGroupsQuery } from "@/store/services/api/Group";
import { useGetTimezonesQuery } from "@/store/services/api/Master";
import { useCreateUserMutation } from "@/store/services/api/User";

export type UserGroupValues = {
	name: string;
	assignedTo: string;
};

export type UserFormValues = {
	username: string;
	password: string;
	confirmPassword: string;
	contactPerson: string;
	group: string;
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
};

const tabs = ["Add Group", "Add User"] as const;
type UserTab = (typeof tabs)[number];

const usernamePattern = /^[A-Za-z0-9_.*@-]+$/;

const emptyGroup = (): UserGroupValues => ({ name: "", assignedTo: "" });

const emptyUser = (): UserFormValues => ({
	username: "",
	password: "",
	confirmPassword: "",
	contactPerson: "",
	group: "",
	timezone: "",
	company: "",
	companyAddress: "",
	phone: "",
	dataRestriction: "",
	active: true,
	schoolUser: false,
});

export function AddUser({ onClose, onSubmit }: AddUserProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [activeTab, setActiveTab] = useState<UserTab>("Add Group");
	const [groupValues, setGroupValues] = useState<UserGroupValues>(emptyGroup);
	const [values, setValues] = useState<UserFormValues>(emptyUser);
	const [formError, setFormError] = useState("");
	const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
	const { data: timezoneMaster = [], isLoading: timezonesLoading } = useGetTimezonesQuery();
	const timezones = timezoneMaster
		.map((timezone) => ({ value: timezone.externalId ?? String(timezone.id ?? ""), label: timezone.timezone ?? "" }))
		.filter((timezone) => timezone.value && timezone.label);
	const [createGroup, { isLoading: creatingGroup }] = useCreateGroupMutation();
	const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
	const isSaving = creatingGroup || creatingUser;

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
		if (groups.some((group) => group.groupName?.toLowerCase() === name.toLowerCase())) {
			setFormError("A group with this name already exists.");
			return;
		}
		try {
			const group = await createGroup({ groupName: name, assignedTo: groupValues.assignedTo, status: Status.ACTIVE, reason: "Group created" }).unwrap();
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
		if (!values.username.trim() || !values.password || !values.confirmPassword || !values.group || !values.timezone || !values.company.trim()) {
			setFormError("Username, Password, Confirm Password, Group, Timezone, and Company Name are required.");
			return;
		}
		if (!usernamePattern.test(values.username.trim())) {
			setFormError("Username can only contain A-z, 0-9, _, -, ., *, and @.");
			return;
		}
		if (values.password !== values.confirmPassword) {
			setFormError("Password and Confirm Password must match.");
			return;
		}
		const text = (value: string) => value.trim() || undefined;
		try {
			await createUser({
				userName: values.username.trim(),
				password: values.password,
				confirmPassword: values.confirmPassword,
				group: values.group,
				timezone: values.timezone,
				companyName: values.company.trim(),
				contactPersonName: text(values.contactPerson),
				phone: text(values.phone),
				companyAddress: text(values.companyAddress),
				dataRestrictionDays: values.dataRestriction ? Number(values.dataRestriction) : undefined,
				isSchoolUser: values.schoolUser,
				status: values.active ? Status.ACTIVE : Status.INACTIVE,
				reason: "New user created",
			}).unwrap();
			toast.success(`${values.username.trim()} saved.`);
			onSubmit();
		} catch (error) {
			console.error("Failed to create user.", error);
			setFormError(apiErrorMessage(error, "Could not save the user. Please try again."));
		}
	};

	const resetCurrent = () => {
		setFormError("");
		if (activeTab === "Add Group") setGroupValues(emptyGroup());
		else setValues(emptyUser());
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
						<h2 id={titleId} className="text-[15px] font-semibold">Add User</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

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

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
					{formError && (
						<p role="alert" className={`mb-5 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
							{formError}
						</p>
					)}
					{activeTab === "Add Group" ? (
						<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
							{field("Group Name", <input required value={groupValues.name} placeholder="Group Name" onChange={(event) => updateGroup("name", event.target.value)} className={inputClass} />, true)}
							<label className="block min-w-0">
								<span className={labelClass}>Assigned To <span className="text-rose-400">*</span></span>
								<span className="relative block">
									<select required value={groupValues.assignedTo} onChange={(event) => updateGroup("assignedTo", event.target.value)} className={`${inputClass} appearance-none pr-8`}>
										<option value="">Select</option>
										{groupAssignedToOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>
							</label>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
								{field("Username", <input required value={values.username} placeholder="Username" onChange={(event) => update("username", event.target.value)} className={inputClass} />, true, false, "Only contains [ A-z, 0-9, _, -, ., *, @ ]")}
								{field("Password", <input required type="password" value={values.password} placeholder="Password" onChange={(event) => update("password", event.target.value)} className={inputClass} />, true)}
								{field("Confirm Password", <input required type="password" value={values.confirmPassword} placeholder="Confirm Password" onChange={(event) => update("confirmPassword", event.target.value)} className={inputClass} />, true)}
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
								{field("Phone", <input value={values.phone} placeholder="Phone" onChange={(event) => update("phone", event.target.value)} className={inputClass} />, false, true)}
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
					{activeTab === "Add Group" && (
						<button type="button" onClick={() => { setFormError(""); setActiveTab("Add User"); }} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
							Skip
						</button>
					)}
					<button type="button" onClick={resetCurrent} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
						Reset
					</button>
					<button type="submit" disabled={isSaving} className={`flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						{isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						Save
					</button>
				</footer>
			</form>
		</div>
	);
}
