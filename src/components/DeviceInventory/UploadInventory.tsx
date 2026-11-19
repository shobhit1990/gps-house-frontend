import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, Loader2, X } from "lucide-react";
import { AssignType } from "@/enums/AssignType";
import { InventoryType } from "@/enums/InventoryType";
import { useGetClientMasterQuery, useGetTechnicianMasterQuery } from "@/store/services/api/Master";
import { apiErrorMessage } from "@/lib/apiErrorMessage";

export type UploadInventoryValues = {
	assignType: AssignType;
	assigneeId: string;
	assigneeName: string;
	inventoryType: InventoryType;
	file: File;
};

type UploadInventoryProps = {
	onClose: () => void;
	onSubmit: (values: UploadInventoryValues) => Promise<void>;
	isSaving?: boolean;
};

const assignTypes = [
	{ value: AssignType.CLIENT, label: "Client" },
	{ value: AssignType.TECHNICIAN, label: "Technician" },
];

const inventoryTypes = [
	{ value: InventoryType.SIM, label: "SIM" },
	{ value: InventoryType.DEVICE, label: "Device" },
];

export function UploadInventory({ onClose, onSubmit, isSaving = false }: UploadInventoryProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const fileRef = useRef<HTMLInputElement>(null);
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const { data: technicians = [], isLoading: techniciansLoading } = useGetTechnicianMasterQuery();

	const [assignType, setAssignType] = useState<AssignType | "">("");
	const [assigneeId, setAssigneeId] = useState("");
	const [inventoryType, setInventoryType] = useState<InventoryType | "">("");
	const [file, setFile] = useState<File | null>(null);
	const [formError, setFormError] = useState("");

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !isSaving) onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isSaving, onClose]);

	useEffect(() => {
		setAssigneeId("");
	}, [assignType]);

	const assigneeOptions =
		assignType === AssignType.CLIENT
			? clients.map((client) => ({ value: client.id, label: client.name }))
			: assignType === AssignType.TECHNICIAN
				? technicians.map((technician) => ({ value: technician.id, label: technician.name }))
				: [];

	const assigneeLabel = assignType === AssignType.TECHNICIAN ? "Technician" : "Client";
	const assigneePlaceholder =
		assignType === AssignType.TECHNICIAN ? "Select Technician" : "Select Client";
	const assigneeLoading =
		assignType === AssignType.CLIENT ? clientsLoading : assignType === AssignType.TECHNICIAN ? techniciansLoading : false;

	const inputClass = `h-9 w-full rounded-md border px-3 text-[12px] outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const field = (label: string, control: ReactNode, required = false) => (
		<label className="block min-w-0">
			<span className={labelClass}>
				{label}
				{required && <span className="ml-0.5 text-rose-400">*</span>}
			</span>
			{control}
		</label>
	);

	const selectControl = (
		value: string,
		onChange: (value: string) => void,
		placeholder: string,
		options: { value: string; label: string }[],
		disabled = false,
	) => (
		<span className="relative block">
			<select
				required
				disabled={disabled}
				value={value}
				onChange={(event) => {
					onChange(event.target.value);
					setFormError("");
				}}
				className={`${inputClass} appearance-none pr-8 disabled:cursor-not-allowed disabled:opacity-60`}
			>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
		</span>
	);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!assignType) {
			setFormError("Select Assign Type is required.");
			return;
		}
		if (!assigneeId) {
			setFormError(`${assigneeLabel} is required.`);
			return;
		}
		if (!inventoryType) {
			setFormError("Inventory Type is required.");
			return;
		}
		if (!file) {
			setFormError("Please choose a file to upload.");
			return;
		}

		const assigneeName = assigneeOptions.find((option) => option.value === assigneeId)?.label ?? "";
		try {
			await onSubmit({
				assignType,
				assigneeId,
				assigneeName,
				inventoryType,
				file,
			});
		} catch (error) {
			setFormError(apiErrorMessage(error, "Could not upload inventory. Please try again."));
		}
	};

	return (
		<div className="fixed inset-0 z-[800] flex items-center justify-center p-4 sm:p-6">
			<button
				type="button"
				aria-label="Close upload inventory form"
				className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
				disabled={isSaving}
				onClick={onClose}
			/>
			<form
				onSubmit={submit}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={`relative flex w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
				}`}
			>
				<header
					className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${
						isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"
					}`}
				>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
							Fleet operations
						</p>
						<h2 id={titleId} className="text-[15px] font-semibold">
							Upload Inventory
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isSaving}
						aria-label="Close"
						className={`rounded-lg p-1.5 transition disabled:opacity-50 ${
							isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
						}`}
					>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<div className="px-5 py-5 sm:px-6 sm:py-6">
					{formError && (
						<p
							role="alert"
							className={`mb-5 rounded-lg border px-3 py-2 text-[12px] ${
								isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"
							}`}
						>
							{formError}
						</p>
					)}

					<div className={`grid grid-cols-1 gap-x-6 gap-y-5 ${assignType ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
						{field(
							"Select Assign Type",
							selectControl(assignType, (value) => setAssignType(value as AssignType | ""), "Select", assignTypes),
							true,
						)}
						{(assignType === AssignType.CLIENT || assignType === AssignType.TECHNICIAN) &&
							field(
								assigneeLabel,
								selectControl(
									assigneeId,
									setAssigneeId,
									assigneeLoading ? `Loading ${assigneeLabel.toLowerCase()}s...` : assigneePlaceholder,
									assigneeOptions,
									assigneeLoading,
								),
								true,
							)}
						{field(
							"Inventory Type",
							selectControl(
								inventoryType,
								(value) => setInventoryType(value as InventoryType | ""),
								"Inventory Type",
								inventoryTypes,
							),
							true,
						)}
					</div>

					<div className="mt-5">
						{field(
							"SELECT FILE",
							<div className="flex flex-wrap items-center gap-3">
								<input
									ref={fileRef}
									type="file"
									accept=".xlsx,.xls,.csv"
									required
									aria-label="Select inventory file"
									onChange={(event) => {
										setFile(event.target.files?.[0] ?? null);
										setFormError("");
									}}
									className={`${inputClass} max-w-md cursor-pointer file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold ${
										isDark
											? "file:bg-white/[0.08] file:text-slate-100"
											: "file:bg-slate-100 file:text-slate-700"
									}`}
								/>
								{file && (
									<span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
										{file.name}
									</span>
								)}
							</div>,
							true,
						)}
					</div>
				</div>

				<footer
					className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${
						isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
					}`}
				>
					<button
						type="button"
						disabled={isSaving}
						onClick={onClose}
						className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition disabled:opacity-50 ${
							isDark
								? "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
								: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
						}`}
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSaving}
						className={`inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
							isDark
								? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
								: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
						}`}
					>
						{isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						{isSaving ? "Uploading..." : "Save"}
					</button>
				</footer>
			</form>
		</div>
	);
}
