import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import type { Owner } from "@/interfaces/Owner";
import { useCreateOwnerMutation, useUpdateOwnerMutation } from "@/store/services/api/Owner";

type AddOwnerDialogProps = {
	isDark: boolean;
	owner?: Owner | null;
	onClose: () => void;
};

const apiErrorMessage = (error: unknown, fallback: string) => {
	const data = (error as { data?: { message?: string } })?.data;
	return data?.message || fallback;
};

export function AddOwnerDialog({ isDark, owner, onClose }: AddOwnerDialogProps) {
	const isEdit = Boolean(owner);
	const [ownerName, setOwnerName] = useState(owner?.ownerName ?? "");
	const [formError, setFormError] = useState("");
	const [createOwner, { isLoading: isCreating }] = useCreateOwnerMutation();
	const [updateOwner, { isLoading: isUpdating }] = useUpdateOwnerMutation();
	const isSaving = isCreating || isUpdating;

	useEffect(() => {
		setOwnerName(owner?.ownerName ?? "");
		setFormError("");
	}, [owner]);

	const inputClass = `h-[37px] w-full rounded-lg border px-3 text-[12px] outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08] [color-scheme:dark]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100 [color-scheme:light]"
	}`;

	const save = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const name = ownerName.trim();
		if (!name) {
			setFormError("Owner name is required.");
			return;
		}

		try {
			if (owner) {
				await updateOwner({ externalId: owner.externalId, ownerName: name }).unwrap();
				toast.success(`${name} updated.`);
			} else {
				await createOwner({ ownerName: name }).unwrap();
				toast.success(`${name} added.`);
			}
			onClose();
		} catch (error) {
			console.error("Failed to save owner.", error);
			setFormError(apiErrorMessage(error, "Could not save the owner. Please try again."));
		}
	};

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && !isSaving) onClose();
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape" && !isSaving) onClose();
			}}
		>
			<form
				onSubmit={save}
				noValidate
				role="dialog"
				aria-modal="true"
				aria-labelledby="owner-dialog-title"
				className={`flex w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<h2 id="owner-dialog-title" className="text-[15px] font-semibold">{isEdit ? "Edit Owner" : "Add Owner"}</h2>
					<button type="button" onClick={onClose} disabled={isSaving} aria-label="Close dialog" className={`rounded-lg p-1.5 transition disabled:opacity-40 ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5" />
					</button>
				</header>

				<div className="px-5 py-5">
					<label className="block">
						<span className={`mb-1.5 block text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
							Owner Name<span className="text-rose-400"> *</span>
						</span>
						<input
							autoFocus
							value={ownerName}
							onChange={(event) => {
								setOwnerName(event.target.value);
								setFormError("");
							}}
							placeholder="Enter owner name"
							aria-invalid={Boolean(formError)}
							className={inputClass}
						/>
					</label>
					{formError ? (
						<p role="alert" className={`mt-2 text-[11px] ${isDark ? "text-rose-300" : "text-rose-600"}`}>{formError}</p>
					) : null}
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button type="button" onClick={onClose} disabled={isSaving} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition disabled:opacity-40 ${isDark ? "border-white/[0.10] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
						Cancel
					</button>
					<button type="submit" disabled={isSaving} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]" : "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"}`}>
						{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
						{isEdit ? "Update" : "Save"}
					</button>
				</footer>
			</form>
		</div>
	);
}
