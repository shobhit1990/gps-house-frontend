import {useMemo, useState, useRef} from "react";
import { useCloseDetailsOnOutsideClick } from "@/hooks/useCloseOnOutsideClick";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
	Activity,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Columns3,
	Loader2,
	Pencil,
	Plus,
	Power,
	RefreshCw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AddUser } from "@/components/UserGroups/AddUser";
import { useAuth } from "@/contexts/AuthContext";
import { Status, statusLabel } from "@/enums/Status";
import { UserType, userTypeLabel } from "@/enums/UserType";
import type { User as UserEntity } from "@/interfaces/User";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { useGetGroupsQuery } from "@/store/services/api/Group";
import { useGetTimezonesQuery } from "@/store/services/api/Master";
import { useDeleteUserMutation, useGetUsersQuery, useUpdateUserMutation } from "@/store/services/api/User";

type UserRecord = {
	id: string;
	username: string;
	group: string;
	userType: string;
	rawUserType: string;
	company: string;
	contactPerson: string;
	phone: string;
	companyAddress: string;
	timezone: string;
	active: boolean;
	added: string;
	password: string;
	reason: string;
};

type ColumnKey =
	| "username"
	| "group"
	| "userType"
	| "company"
	| "contactPerson"
	| "phone"
	| "address"
	| "timezone"
	| "added"
	| "action"
	| "status"
	| "reason";

const columns: { key: ColumnKey; label: string }[] = [
	{ key: "username", label: "Username" },
	{ key: "group", label: "Group" },
	{ key: "userType", label: "User Type" },
	{ key: "company", label: "Company" },
	{ key: "contactPerson", label: "Contact Person" },
	{ key: "phone", label: "Phone No." },
	{ key: "address", label: "Address" },
	{ key: "timezone", label: "Timezone" },
	{ key: "added", label: "Added" },
	// { key: "password", label: "Password" },
	// { key: "resetPassword", label: "Reset Password" },
	{ key: "action", label: "Action" },
	{ key: "status", label: "Status" },
	{ key: "reason", label: "Reason" },
];

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 placeholder:text-slate-600 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400"
	}`;

const textValue = (value: unknown) => {
	const text = value == null ? "" : String(value);
	return text.trim() ? text : "—";
};

const dateLabel = (value?: string) => {
	const date = value ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) return "";
	return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

export default function User() {
	const { logout } = useAuth();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: users = [], isLoading, isFetching, isError, refetch } = useGetUsersQuery();
	const { data: groups = [] } = useGetGroupsQuery();
	const { data: timezones = [] } = useGetTimezonesQuery();
	const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
	const [updateUser, { isLoading: isUpdatingStatus }] = useUpdateUserMutation();
	const [editingUser, setEditingUser] = useState<UserEntity | null>(null);
	const columnVisibilityRef = useRef<HTMLDetailsElement>(null);
	useCloseDetailsOnOutsideClick(columnVisibilityRef);
	const [pendingDelete, setPendingDelete] = useState<UserRecord | null>(null);
	const [pendingStatusUser, setPendingStatusUser] = useState<UserRecord | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<Status>(Status.ACTIVE);
	const [statusReason, setStatusReason] = useState("");
	const rows = useMemo(() => {
		const groupNames = new Map(groups.map((group) => [group.externalId, group.groupName]));
		const timezoneNames = new Map(
			timezones.flatMap((timezone) => {
				const label = timezone.timezone ?? "";
				const ids = [timezone.externalId, timezone.id]
					.map((id) => (id == null ? "" : String(id)))
					.filter(Boolean);
				return ids.map((id) => [id, label] as const);
			}),
		);
		return users.map((user: UserEntity): UserRecord => {
			const groupId = user.group ?? "";
			const timezoneId = user.timezone ?? "";
			const rawUserType = String(user.userType ?? "").trim();
			return {
				id: user.externalId,
				username: user.userName ?? "",
				group: user.groupName || groupNames.get(groupId) || groupId,
				userType: rawUserType ? userTypeLabel(rawUserType) : "",
				rawUserType,
				company: user.companyName ?? "",
				contactPerson: user.contactPersonName ?? "",
				phone: user.phone != null ? String(user.phone) : "",
				companyAddress: user.companyAddress ?? "",
				timezone: user.timezoneName || timezoneNames.get(timezoneId) || timezoneId,
				active: user.status !== Status.INACTIVE,
				added: dateLabel(user.createdAt),
				password: user.password ?? "",
				reason: user.reason?.trim() ?? "",
			};
		});
	}, [users, groups, timezones]);
	const [search, setSearch] = useState("");
	const [pageSize, setPageSize] = useState(10);
	const [page, setPage] = useState(0);
	const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);

	const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.key));
	const filteredRows = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return rows;
		return rows.filter((row) =>
			[row.username, row.group, row.userType, row.company, row.contactPerson, row.phone, row.companyAddress, row.timezone, row.reason]
				.join(" ")
				.toLowerCase()
				.includes(query),
		);
	}, [rows, search]);
	const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, pageCount - 1);
	const pageRows = filteredRows.slice(safePage * pageSize, (safePage + 1) * pageSize);

	const saveUser = () => {
		setSearch("");
		setPage(0);
		setShowAddDialog(false);
		setEditingUser(null);
		void refetch();
	};

	const openEdit = (id: string) => {
		const user = users.find((item) => item.externalId === id) ?? null;
		if (!user) {
			toast.error("Could not find this user.");
			return;
		}
		setShowAddDialog(false);
		setEditingUser(user);
	};

	const openStatusChange = (row: UserRecord) => {
		setPendingStatusUser(row);
		setSelectedStatus(row.active ? Status.INACTIVE : Status.ACTIVE);
		setStatusReason("");
	};

	const closeStatusDialog = () => {
		if (isUpdatingStatus) return;
		setPendingStatusUser(null);
		setStatusReason("");
	};

	const confirmStatusChange = async () => {
		if (!pendingStatusUser) return;
		const currentStatus = pendingStatusUser.active ? Status.ACTIVE : Status.INACTIVE;
		if (selectedStatus === currentStatus) {
			toast.error("Select a different status to change.");
			return;
		}
		if (selectedStatus === Status.INACTIVE && !statusReason.trim()) {
			toast.error("Please enter a reason when setting Inactive.");
			return;
		}
		const userType =
			Object.values(UserType).find((type) => type === pendingStatusUser.rawUserType) ?? UserType.USER;
		try {
			await updateUser({
				externalId: pendingStatusUser.id,
				body: {
					status: selectedStatus,
					reason: selectedStatus === Status.INACTIVE ? statusReason.trim() : "",
					userType,
				},
			}).unwrap();
			toast.success(`${pendingStatusUser.username} is now ${statusLabel(selectedStatus).toLowerCase()}.`);
			closeStatusDialog();
			void refetch();
		} catch (error) {
			console.error("Failed to update user status.", error);
			toast.error(apiErrorMessage(error, "Could not update the user status."));
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete?.id) return;
		try {
			await deleteUser(pendingDelete.id).unwrap();
			toast.success(`${pendingDelete.username} deleted.`);
			setPendingDelete(null);
			void refetch();
		} catch (error) {
			console.error("Failed to delete user.", error);
			toast.error(apiErrorMessage(error, "Could not delete the user."));
		}
	};

	const cell = (key: ColumnKey, row: UserRecord) => {
		if (key === "username") {
			return <span className={`font-semibold ${isDark ? "text-cyan-200" : "text-cyan-700"}`}>{row.username}</span>;
		}
		if (key === "contactPerson") return textValue(row.contactPerson);
		if (key === "address") return textValue(row.companyAddress);
		if (key === "status") {
			return (
				<span
					className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold ${
						row.active
							? isDark
								? "bg-emerald-400/15 text-emerald-300"
								: "bg-emerald-100 text-emerald-700"
							: isDark
								? "bg-rose-400/15 text-rose-200"
								: "bg-rose-50 text-rose-700"
					}`}
				>
					{row.active ? "Active" : "Inactive"}
				</span>
			);
		}
		if (key === "reason") {
			return (
				<span
					className={`block max-w-[220px] truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}
					title={row.reason || undefined}
				>
					{row.reason || "—"}
				</span>
			);
		}
		// if (key === "password") {
		// 	const visible = visiblePasswords.includes(row.id);
		// 	return (
		// 		<button
		// 			type="button"
		// 			onClick={() =>
		// 				setVisiblePasswords((current) =>
		// 					current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id],
		// 				)
		// 			}
		// 			className={`h-7 rounded-md border px-3 text-[11px] font-semibold transition ${
		// 				isDark
		// 					? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
		// 					: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
		// 			}`}
		// 		>
		// 			{visible ? row.password || "—" : "Show"}
		// 		</button>
		// 	);
		// }
		// if (key === "resetPassword") {
		// 	return (
		// 		<button
		// 			type="button"
		// 			onClick={() => toast.info("Reset password is not available yet.")}
		// 			className={`h-7 rounded-md border px-3 text-[11px] font-semibold transition ${
		// 				isDark
		// 					? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]"
		// 					: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
		// 			}`}
		// 		>
		// 			Reset
		// 		</button>
		// 	);
		// }
		if (key === "action") {
			return (
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => openEdit(row.id)}
						aria-label={`Edit ${row.username}`}
						title="Edit"
						className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
							isDark
								? "border-white/[0.10] text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-300/[0.10] hover:text-cyan-100"
								: "border-slate-200 text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
						}`}
					>
						<Pencil className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onClick={() => openStatusChange(row)}
						disabled={isUpdatingStatus}
						aria-label={`Change status of ${row.username}`}
						title="Change status"
						className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition disabled:opacity-50 ${
							isDark
								? "border-violet-300/20 bg-violet-300/[0.08] text-violet-100 hover:bg-violet-300/[0.14]"
								: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
						}`}
					>
						<Power className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onClick={() => setPendingDelete(row)}
						disabled={isDeleting}
						aria-label={`Delete ${row.username}`}
						title="Delete"
						className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition disabled:opacity-50 ${
							isDark
								? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200 hover:bg-rose-300/[0.14]"
								: "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
						}`}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				</div>
			);
		}
		return textValue(row[key as keyof UserRecord]);
	};

	return (
		<div
			className={`relative min-h-screen overflow-hidden font-sans ${
				isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"
			}`}
		>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
			</div>
			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
				<section className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<p
							className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
								isDark ? "text-cyan-200/70" : "text-cyan-700"
							}`}
						>
							<Activity className="h-3.5 w-3.5" /> Fleet operations
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>
							User
						</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>{rows.length} users</p>
					</div>
					<button
						type="button"
						onClick={() => refetch()}
						disabled={isFetching}
						aria-label="Refresh users"
						title="Refresh users"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-60 ${
							isDark
								? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100"
								: "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
						}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</section>

				<section
					className={`overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.24)] ${
						isDark
							? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
							: "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
					}`}
				>
					<div
						className={`flex flex-col gap-3 border-b p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between ${
							isDark
								? "border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.035] via-transparent to-violet-400/[0.04]"
								: "border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-violet-50"
						}`}
					>
						<label className="relative block min-w-0 sm:w-[300px]">
							<Search
								className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
									isDark ? "text-cyan-200/50" : "text-cyan-600/70"
								}`}
							/>
							<input
								type="search"
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(0);
								}}
								placeholder="Search"
								aria-label="Search user"
								className={`h-10 w-full rounded-lg border pl-9 pr-9 text-xs outline-none transition ${
									isDark
										? "border-white/[0.08] bg-[#03091c]/65 text-white placeholder:text-slate-600 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/[0.08]"
										: "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
								}`}
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									aria-label="Clear search"
									className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${
										isDark ? "text-slate-500 hover:text-white" : "text-slate-500 hover:text-slate-900"
									}`}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative">
								<select
									aria-label="Rows per page"
									value={pageSize}
									onChange={(event) => {
										setPageSize(Number(event.target.value));
										setPage(0);
									}}
									className={`h-9 appearance-none rounded-lg border pl-3 pr-8 text-[11px] outline-none ${
										isDark
											? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 [color-scheme:dark]"
											: "border-slate-200 bg-white text-slate-700"
									}`}
								>
									{[10, 25, 50].map((size) => (
										<option key={size} value={size}>
											{size} rows
										</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details ref={columnVisibilityRef} className="relative">
								<summary
									className={`flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border px-3 text-[11px] transition ${
										isDark
											? "border-white/[0.08] bg-[#03091c]/65 text-slate-300 hover:border-white/[0.15]"
											: "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
									}`}
								>
									<Columns3 className={`h-3.5 w-3.5 ${isDark ? "text-cyan-200/70" : "text-cyan-600"}`} />
									Column Visibility
									<ChevronDown className="h-3 w-3 text-slate-500" />
								</summary>
								<div
									className={`absolute right-0 top-11 z-30 max-h-52 w-56 overflow-y-auto rounded-xl border p-2 shadow-[0_18px_40px_rgba(0,0,0,0.4)] ${
										isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
									}`}
								>
									{columns.map((column) => (
										<label
											key={column.key}
											className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs ${
												isDark ? "text-slate-300 hover:bg-white/[0.04]" : "text-slate-700 hover:bg-slate-100"
											}`}
										>
											<input
												type="checkbox"
												checked={!hiddenColumns.includes(column.key)}
												onChange={() =>
													setHiddenColumns((current) =>
														current.includes(column.key)
															? current.filter((item) => item !== column.key)
															: [...current, column.key],
													)
												}
												className="h-3.5 w-3.5 accent-cyan-300"
											/>
											{column.label}
										</label>
									))}
								</div>
							</details>
							<button
								type="button"
								onClick={() => {
									setEditingUser(null);
									setShowAddDialog(true);
								}}
								className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
									isDark
										? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
										: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
								}`}
							>
								<Plus className="h-3.5 w-3.5" /> Add
							</button>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1400px] border-collapse text-left">
							<thead>
								<tr
									className={`border-b text-[9px] font-semibold uppercase tracking-[0.12em] ${
										isDark
											? "border-white/[0.08] bg-white/[0.025] text-slate-500"
											: "border-slate-200 bg-slate-50 text-slate-600"
									}`}
								>
									{visibleColumns.map((column) => (
										<th key={column.key} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:px-4">
											{column.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{pageRows.map((row) => (
									<tr
										key={row.id}
										className={`border-b text-[11px] transition last:border-0 ${
											isDark
												? "border-white/[0.055] text-slate-300 hover:bg-white/[0.035]"
												: "border-slate-200 text-slate-700 hover:bg-slate-50"
										}`}
									>
										{visibleColumns.map((column) => (
											<td key={column.key} className="whitespace-nowrap px-3 py-3 first:px-4">
												{cell(column.key, row)}
											</td>
										))}
									</tr>
								))}
								{pageRows.length === 0 && (
									<tr>
										<td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
											<p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
												{isLoading ? "Loading users…" : isError ? "Could not load users" : "No users available"}
											</p>
											<p className="mt-1 text-xs text-slate-500">Add a user to see them here.</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<footer
						className={`flex flex-col gap-3 border-t px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${
							isDark ? "border-white/[0.07] text-slate-500" : "border-slate-200 text-slate-500"
						}`}
					>
						<span>
							Showing{" "}
							<span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{filteredRows.length === 0 ? 0 : safePage * pageSize + 1}–
								{Math.min((safePage + 1) * pageSize, filteredRows.length)}
							</span>{" "}
							of {filteredRows.length} users
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(0, current - 1))}
								disabled={safePage === 0}
								aria-label="Previous page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${
									isDark
										? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
										: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
								}`}
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className={`min-w-12 text-center ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								{safePage + 1} / {pageCount}
							</span>
							<button
								type="button"
								onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
								disabled={safePage >= pageCount - 1}
								aria-label="Next page"
								className={`flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35 ${
									isDark
										? "border-white/[0.08] text-slate-400 hover:bg-white/[0.05]"
										: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
								}`}
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</footer>
				</section>
			</main>

			{(showAddDialog || editingUser) && (
				<AddUser
					user={editingUser}
					onClose={() => {
						setShowAddDialog(false);
						setEditingUser(null);
					}}
					onSubmit={saveUser}
				/>
			)}

			{pendingStatusUser ? (
				<div className="fixed inset-0 z-[820] flex items-center justify-center p-4">
					<button
						type="button"
						aria-label="Close status dialog"
						className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
						onClick={closeStatusDialog}
					/>
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="user-status-title"
						className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
						}`}
					>
						<h2 id="user-status-title" className="text-[15px] font-semibold">
							Change user status
						</h2>
						<p className={`mt-2 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							Current status of <span className="font-medium">{pendingStatusUser.username}</span> is{" "}
							<span className="font-medium">{pendingStatusUser.active ? "Active" : "Inactive"}</span>. Choose Active
							or Inactive. Reason is required only when setting Inactive.
						</p>
						<label className="mt-4 block">
							<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
								Status <span className="text-rose-400">*</span>
							</span>
							<select
								value={selectedStatus}
								onChange={(event) => setSelectedStatus(event.target.value as Status)}
								className={inputClass(isDark)}
							>
								<option value={Status.ACTIVE}>Active</option>
								<option value={Status.INACTIVE}>Inactive</option>
							</select>
						</label>
						{selectedStatus === Status.INACTIVE ? (
							<label className="mt-4 block">
								<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
									Reason <span className="text-rose-400">*</span>
								</span>
								<textarea
									value={statusReason}
									onChange={(event) => setStatusReason(event.target.value)}
									rows={3}
									placeholder={`Why is this user being set ${statusLabel(selectedStatus).toLowerCase()}?`}
									className={`${inputClass(isDark)} h-auto resize-none py-2`}
								/>
							</label>
						) : null}
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={closeStatusDialog}
								disabled={isUpdatingStatus}
								className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${
									isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"
								}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void confirmStatusChange()}
								disabled={isUpdatingStatus}
								className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${
									isDark
										? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50"
										: "border-cyan-300 bg-cyan-50 text-cyan-800"
								}`}
							>
								{isUpdatingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
								Update Status
							</button>
						</div>
					</section>
				</div>
			) : null}

			{pendingDelete ? (
				<div className="fixed inset-0 z-[820] flex items-center justify-center p-4">
					<button
						type="button"
						aria-label="Close delete dialog"
						className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
						onClick={() => {
							if (!isDeleting) setPendingDelete(null);
						}}
					/>
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="user-delete-title"
						className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
							isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
						}`}
					>
						<h2 id="user-delete-title" className="text-[15px] font-semibold">
							Delete user
						</h2>
						<p className={`mt-2 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
							Delete <span className="font-medium">{pendingDelete.username}</span>? This cannot be undone.
						</p>
						<div className="mt-5 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setPendingDelete(null)}
								disabled={isDeleting}
								className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${
									isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"
								}`}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void confirmDelete()}
								disabled={isDeleting}
								className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${
									isDark
										? "border-rose-300/30 bg-rose-300/[0.14] text-rose-50"
										: "border-rose-300 bg-rose-50 text-rose-700"
								}`}
							>
								{isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
								Delete
							</button>
						</div>
					</section>
				</div>
			) : null}
		</div>
	);
}
