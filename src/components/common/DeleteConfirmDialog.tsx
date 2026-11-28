import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type DeleteConfirmDialogProps = {
	isDark: boolean;
	open: boolean;
	/** e.g. "Delete geofence?" */
	title: string;
	/** Highlighted name in the default description. */
	entityName: string;
	/**
	 * Override the default "This will permanently remove {entityName}." body.
	 * When provided, `entityName` is unused for rendering.
	 */
	description?: ReactNode;
	confirmLabel?: string;
	isSubmitting?: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	titleId?: string;
	zIndexClassName?: string;
};

export function DeleteConfirmDialog({
	isDark,
	open,
	title,
	entityName,
	description,
	confirmLabel = "Delete",
	isSubmitting = false,
	onCancel,
	onConfirm,
	titleId = "delete-confirm-title",
	zIndexClassName = "z-[820]",
}: DeleteConfirmDialogProps) {
	if (!open) return null;

	return (
		<div className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4`}>
			<button
				type="button"
				aria-label="Close delete dialog"
				className="absolute inset-0 bg-[#020617]/75 backdrop-blur-[2px]"
				onClick={() => {
					if (!isSubmitting) onCancel();
				}}
			/>
			<section
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className={`relative w-full max-w-md rounded-2xl border p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630] text-white" : "border-slate-200 bg-white text-slate-900"
				}`}
			>
				<h2 id={titleId} className="text-[15px] font-semibold">
					{title}
				</h2>
				<p className={`mt-2 text-[12px] leading-5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
					{description ?? (
						<>
							This will permanently remove{" "}
							<strong className={isDark ? "text-white" : "text-slate-900"}>{entityName}</strong>.
						</>
					)}
				</p>
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
								? "border-rose-300/30 bg-rose-400/[0.16] text-rose-100 hover:bg-rose-400/[0.24]"
								: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
						}`}
					>
						{isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
						{confirmLabel}
					</button>
				</div>
			</section>
		</div>
	);
}
