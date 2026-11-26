import { Loader2 } from "lucide-react";
import { Status, statusLabel } from "@/enums/Status";

type ChangeStatusDialogProps = {
	isDark: boolean;
	open: boolean;
	title: string;
	entityName: string;
	entityNoun: string;
	currentStatus: Status;
	selectedStatus: Status;
	onSelectedStatusChange: (status: Status) => void;
	reason: string;
	onReasonChange: (reason: string) => void;
	/** When true, reason is shown/required only for Inactive. */
	reasonOnlyWhenInactive?: boolean;
	isSubmitting?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	titleId?: string;
	zIndexClassName?: string;
};

const inputClass = (isDark: boolean) =>
	`h-10 w-full rounded-lg border px-3 text-xs outline-none transition ${
		isDark
			? "border-white/[0.08] bg-[#03091c]/70 text-slate-300 placeholder:text-slate-600 focus:border-cyan-300/35 [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-cyan-400"
	}`;

export function ChangeStatusDialog({
	isDark,
	open,
	title,
	entityName,
	entityNoun,
	currentStatus,
	selectedStatus,
	onSelectedStatusChange,
	reason,
	onReasonChange,
	reasonOnlyWhenInactive = true,
	isSubmitting = false,
	onCancel,
	onConfirm,
	titleId = "change-status-title",
	zIndexClassName = "z-[820]",
}: ChangeStatusDialogProps) {
	if (!open) return null;

	const showReason = !reasonOnlyWhenInactive || selectedStatus === Status.INACTIVE;

	return (
		<div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4`}>
			<button
				type="button"
				aria-label="Close status dialog"
				className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
				onClick={() => {
					if (!isSubmitting) onCancel();
				}}
			/>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
				}`}
			>
				<h2 id={titleId} className="text-[15px] font-semibold">
					{title}
				</h2>
				<p className={`mt-2 text-[12px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
					Current status of <span className="font-medium">{entityName}</span> is{" "}
					<span className="font-medium">{statusLabel(currentStatus)}</span>. Choose Active or Inactive
					{reasonOnlyWhenInactive ? ". Reason is required only when setting Inactive." : ", then enter a reason."}
				</p>
				<label className="mt-4 block">
					<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
						Status <span className="text-rose-400">*</span>
					</span>
					<select
						value={selectedStatus}
						onChange={(event) => onSelectedStatusChange(event.target.value as Status)}
						disabled={isSubmitting}
						className={inputClass(isDark)}
					>
						<option value={Status.ACTIVE}>Active</option>
						<option value={Status.INACTIVE}>Inactive</option>
					</select>
				</label>
				{showReason ? (
					<label className="mt-4 block">
						<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
							Reason <span className="text-rose-400">*</span>
						</span>
						<textarea
							value={reason}
							onChange={(event) => onReasonChange(event.target.value)}
							rows={3}
							disabled={isSubmitting}
							placeholder={`Why is this ${entityNoun} being set ${statusLabel(selectedStatus).toLowerCase()}?`}
							className={`${inputClass(isDark)} h-auto resize-none py-2`}
						/>
					</label>
				) : null}
				<div className="mt-5 flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						disabled={isSubmitting}
						className={`h-9 rounded-lg border px-4 text-[12px] disabled:opacity-40 ${
							isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"
						}`}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isSubmitting}
						className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold disabled:opacity-60 ${
							isDark
								? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50"
								: "border-cyan-300 bg-cyan-50 text-cyan-800"
						}`}
					>
						{isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
						Update Status
					</button>
				</div>
			</section>
		</div>
	);
}
