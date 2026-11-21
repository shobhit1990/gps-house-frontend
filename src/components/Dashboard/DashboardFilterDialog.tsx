import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { LockStatus } from "@/enums/LockStatus";
import type { VehicleRow } from "@/components/data/vehicles";
import type { VehicleHistoryVehiclesParams } from "@/interfaces/VehicleHistoryTracking";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import {
	useGetClientMasterQuery,
	useGetTransporterMasterQuery,
} from "@/store/services/api/Master";
import { useGetGroupsQuery } from "@/store/services/api/Group";
import { useLazyGetVehicleHistoryVehiclesQuery } from "@/store/services/api/VehicleHistoryTracking";

export type DashboardFilterValues = {
	clientId: string;
	transporterId: string;
	groupId: string;
	since: string;
	lockStatus: string;
	enableGeofenceOnMap: boolean;
};

const emptyValues = (): DashboardFilterValues => ({
	clientId: "",
	transporterId: "",
	groupId: "",
	since: "",
	lockStatus: "",
	enableGeofenceOnMap: false,
});

const SINCE_HOURS = ["1", "2", "4", "6", "12", "24", "48", "72"];

type DashboardFilterDialogProps = {
	isDark: boolean;
	initialValues?: Partial<DashboardFilterValues>;
	onClose: () => void;
	onApplied: (result: {
		vehicles: VehicleRow[];
		values: DashboardFilterValues;
		params: VehicleHistoryVehiclesParams;
	}) => void;
};

export function DashboardFilterDialog({
	isDark,
	initialValues,
	onClose,
	onApplied,
}: DashboardFilterDialogProps) {
	const titleId = useId();
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const [values, setValues] = useState<DashboardFilterValues>(() => ({
		...emptyValues(),
		...initialValues,
	}));
	const { data: transporters = [], isLoading: transportersLoading } = useGetTransporterMasterQuery(
		values.clientId ? { client: values.clientId } : undefined,
		{ skip: !values.clientId },
	);
	const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
	const [fetchVehicles, { isFetching }] = useLazyGetVehicleHistoryVehiclesQuery();

	const update = <K extends keyof DashboardFilterValues>(key: K, value: DashboardFilterValues[K]) => {
		setValues((current) => {
			if (key === "clientId") {
				return { ...current, clientId: value as string, transporterId: "", groupId: "" };
			}
			if (key === "transporterId") {
				return { ...current, transporterId: value as string, groupId: "" };
			}
			if (key === "groupId") {
				return {
					...current,
					groupId: value as string,
					clientId: value ? "" : current.clientId,
					transporterId: value ? "" : current.transporterId,
				};
			}
			return { ...current, [key]: value };
		});
	};

	const reset = () => setValues(emptyValues());

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const usingGroup = Boolean(values.groupId);
		const usingClientPath = Boolean(values.clientId || values.transporterId);

		if (!usingGroup && !usingClientPath) {
			toast.error("Select client & transporter, or a group.");
			return;
		}
		if (!usingGroup && (!values.clientId || !values.transporterId)) {
			toast.error("Select both client and transporter.");
			return;
		}

		const params: VehicleHistoryVehiclesParams = {
			...(usingGroup
				? { groupId: values.groupId }
				: { clientId: values.clientId, transporterId: values.transporterId }),
			...(values.since ? { since: values.since } : {}),
			...(values.lockStatus ? { lockStatus: values.lockStatus } : {}),
		};

		try {
			const vehicles = await fetchVehicles(params).unwrap();
			onApplied({ vehicles, values, params });
			onClose();
			if (vehicles.length === 0) {
				toast.message("No vehicles matched these filters.");
			} else {
				toast.success(`Loaded ${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"}`);
			}
		} catch (error) {
			toast.error(apiErrorMessage(error, "Could not load filtered vehicles."));
		}
	};

	const labelClass = `mb-1.5 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`;
	const selectClass = `h-10 w-full appearance-none rounded-lg border pl-3 pr-9 text-xs outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-slate-200 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-700 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const selectField = (label: string, select: ReactNode) => (
		<label className="min-w-0">
			<span className={labelClass}>{label}</span>
			<div className="relative">
				{select}
				<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden />
			</div>
		</label>
	);

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-3 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && !isFetching) onClose();
			}}
		>
			<form
				onSubmit={(event) => void submit(event)}
				noValidate
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={`flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
				}`}
			>
				<header
					className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${
						isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"
					}`}
				>
					<h2 id={titleId} className="text-[15px] font-semibold">
						Filter
					</h2>
					<button
						type="button"
						onClick={onClose}
						disabled={isFetching}
						aria-label="Close filter"
						className={`rounded-lg p-1.5 transition disabled:opacity-40 ${
							isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
						}`}
					>
						<X className="h-5 w-5" />
					</button>
				</header>

				<div className="space-y-4 p-5">
					<div className="grid gap-3 sm:grid-cols-2">
						{selectField(
							"Client",
							<select
								aria-label="Select client"
								value={values.clientId}
								onChange={(event) => update("clientId", event.target.value)}
								disabled={Boolean(values.groupId) || isFetching}
								className={selectClass}
							>
								<option value="">{clientsLoading ? "Loading clients…" : "Select Client"}</option>
								{clients.map((item) => (
									<option key={item.id} value={item.id}>
										{item.name}
									</option>
								))}
							</select>,
						)}
						{selectField(
							"Transporter",
							<select
								aria-label="Select transporter"
								value={values.transporterId}
								onChange={(event) => update("transporterId", event.target.value)}
								disabled={!values.clientId || Boolean(values.groupId) || isFetching || transportersLoading}
								className={selectClass}
							>
								<option value="">
									{!values.clientId
										? "Select client first"
										: transportersLoading
											? "Loading transporters…"
											: transporters.length === 0
												? "No transporters found"
												: "Select Transporter"}
								</option>
								{transporters.map((item) => (
									<option key={item.id} value={item.id}>
										{item.name}
									</option>
								))}
							</select>,
						)}
					</div>

					<div className="relative flex items-center py-1">
						<div className={`h-px flex-1 ${isDark ? "bg-white/[0.08]" : "bg-slate-200"}`} />
						<span className={`px-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
							Or
						</span>
						<div className={`h-px flex-1 ${isDark ? "bg-white/[0.08]" : "bg-slate-200"}`} />
					</div>

					{selectField(
						"Group",
						<select
							aria-label="Select group"
							value={values.groupId}
							onChange={(event) => update("groupId", event.target.value)}
							disabled={Boolean(values.clientId || values.transporterId) || isFetching || groupsLoading}
							className={selectClass}
						>
							<option value="">{groupsLoading ? "Loading groups…" : groups.length === 0 ? "No groups found" : "Select Group"}</option>
							{groups.map((item) => (
								<option key={item.externalId || item.id} value={String(item.externalId || item.id)}>
									{item.groupName || String(item.externalId || item.id)}
								</option>
							))}
						</select>,
					)}

					<div className="grid gap-3 sm:grid-cols-2">
						{selectField(
							"Since (duration in hours)",
							<select
								aria-label="Since duration in hours"
								value={values.since}
								onChange={(event) => update("since", event.target.value)}
								disabled={isFetching}
								className={selectClass}
							>
								<option value="">Since (duration in hours)</option>
								{SINCE_HOURS.map((hours) => (
									<option key={hours} value={hours}>
										{hours} hour{hours === "1" ? "" : "s"}
									</option>
								))}
							</select>,
						)}
						{selectField(
							"Lock Status",
							<select
								aria-label="Select lock status"
								value={values.lockStatus}
								onChange={(event) => update("lockStatus", event.target.value)}
								disabled={isFetching}
								className={selectClass}
							>
								<option value="">Select Lock Status</option>
								{Object.values(LockStatus).map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</select>,
						)}
					</div>

					<label className={`flex cursor-pointer items-start gap-2.5 text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
						<input
							type="checkbox"
							checked={values.enableGeofenceOnMap}
							onChange={(event) => update("enableGeofenceOnMap", event.target.checked)}
							disabled={isFetching}
							className="mt-0.5 h-3.5 w-3.5 accent-cyan-300"
						/>
						<span>Enable geofence visibility on map.</span>
					</label>
				</div>

				<footer
					className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${
						isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
					}`}
				>
					<button
						type="button"
						onClick={reset}
						disabled={isFetching}
						className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-medium transition disabled:opacity-50 ${
							isDark
								? "border-white/[0.10] text-slate-300 hover:bg-white/[0.04]"
								: "border-slate-200 text-slate-700 hover:bg-slate-50"
						}`}
					>
						<RotateCcw className="h-3.5 w-3.5" />
						Reset
					</button>
					<button
						type="submit"
						disabled={isFetching}
						className={`inline-flex h-9 min-w-[88px] items-center justify-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold transition disabled:opacity-60 ${
							isDark
								? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]"
								: "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
						}`}
					>
						{isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
						Filter
					</button>
				</footer>
			</form>
		</div>
	);
}
