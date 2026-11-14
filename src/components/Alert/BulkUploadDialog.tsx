import { useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTheme } from "next-themes";
import { Download, LoaderCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import {
	useExportServiceMaintenanceDemoMutation,
	useUploadServiceMaintenanceMutation,
} from "@/store/services/api/BulkUpload";

type BulkUploadDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [exportDemo, { isLoading: isExporting }] = useExportServiceMaintenanceDemoMutation();
	const [uploadFile, { isLoading: isUploading }] = useUploadServiceMaintenanceMutation();

	const resetFile = () => {
		setFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && isUploading) return;
		if (!nextOpen) resetFile();
		onOpenChange(nextOpen);
	};

	const downloadDemo = async () => {
		try {
			const blob = await exportDemo().unwrap();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "service-maintenance-demo.xlsx";
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 0);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Unable to download the demo file."));
		}
	};

	const handleUpload = async () => {
		if (!file) {
			toast.error("Please select an Excel file to upload.");
			return;
		}

		try {
			await uploadFile(file).unwrap();
			toast.success("Service and maintenance records uploaded.");
			resetFile();
			onOpenChange(false);
		} catch (error) {
			toast.error(apiErrorMessage(error, "Unable to upload the selected file."));
		}
	};

	const panelClass = isDark
		? "border-white/[0.10] bg-gradient-to-br from-[#0b1835] via-[#08142e] to-[#10102d] text-white"
		: "border-slate-200 bg-white text-slate-900";
	const inputClass = isDark
		? "border-white/[0.10] bg-[#03091c]/70 text-slate-200 file:border-0 file:bg-white/[0.08] file:text-slate-100"
		: "border-slate-200 bg-white text-slate-700 file:border-0 file:bg-slate-100 file:text-slate-700";
	const actionClass = isDark
		? "border-cyan-300/30 bg-cyan-300/[0.14] text-cyan-50 hover:bg-cyan-300/[0.22]"
		: "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100";

	return (
		<DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-[860] bg-[#020718]/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
				<DialogPrimitive.Content
					className={`fixed left-1/2 top-1/2 z-[861] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border p-5 shadow-2xl outline-none sm:p-6 ${panelClass}`}
					onEscapeKeyDown={(event) => { if (isUploading) event.preventDefault(); }}
					onPointerDownOutside={(event) => { if (isUploading) event.preventDefault(); }}
				>
					<div className="mb-5 flex items-start justify-between gap-4">
						<div>
							<DialogPrimitive.Title className="text-base font-semibold">Bulk Upload Service &amp; Maintenance</DialogPrimitive.Title>
							<DialogPrimitive.Description className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
								Upload an Excel file to add service and maintenance records.
							</DialogPrimitive.Description>
						</div>
						<DialogPrimitive.Close
							aria-label="Close bulk upload"
							disabled={isUploading}
							className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
						>
							<X className="h-4 w-4" />
						</DialogPrimitive.Close>
					</div>

					<div className={`rounded-lg border px-4 py-3 text-xs leading-relaxed ${isDark ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
						Download the demo file to check the required format before uploading.
					</div>

					<label className={`mt-5 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`} htmlFor="service-maintenance-bulk-file">
						Select File <span className="text-rose-500">*</span>
					</label>
					<input
						ref={fileInputRef}
						id="service-maintenance-bulk-file"
						type="file"
						accept=".xlsx,.xls,.csv"
						disabled={isUploading}
						onChange={(event) => setFile(event.target.files?.[0] ?? null)}
						className={`mt-2 h-10 w-full rounded-lg border px-2 py-1 text-xs file:mr-3 file:h-7 file:cursor-pointer file:rounded-md file:px-3 file:text-xs file:font-medium disabled:opacity-60 ${inputClass}`}
					/>
					{file && <p className={`mt-1.5 truncate text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Selected: {file.name}</p>}

					<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={downloadDemo}
							disabled={isExporting || isUploading}
							className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${actionClass}`}
						>
							{isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
							{isExporting ? "Downloading..." : "Demo"}
						</button>
						<button
							type="button"
							onClick={handleUpload}
							disabled={isUploading || isExporting}
							className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${actionClass}`}
						>
							{isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
							{isUploading ? "Uploading..." : "Upload"}
						</button>
					</div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
