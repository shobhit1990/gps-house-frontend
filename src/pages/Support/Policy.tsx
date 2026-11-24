import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import {
	useCreatePolicyMutation,
	useGetPoliciesQuery,
	useUpdatePolicyMutation,
} from "@/store/services/api/Policy";

const emptyEditorHtml = "<p><br></p>";

export default function Policy() {
	const { logout } = useAuth();
	const navigate = useNavigate();
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: policies = [], isLoading, isFetching, isError, refetch } = useGetPoliciesQuery();
	const [createPolicy, { isLoading: isCreating }] = useCreatePolicyMutation();
	const [updatePolicy, { isLoading: isUpdating }] = useUpdatePolicyMutation();
	const existing = policies[0] ?? null;
	const [content, setContent] = useState("");
	const [draft, setDraft] = useState("");
	const [editorKey, setEditorKey] = useState(0);
	const isSaving = isCreating || isUpdating;

	useEffect(() => {
		const next = existing?.body?.trim() || "";
		setContent(next);
		setDraft(next);
		setEditorKey((current) => current + 1);
	}, [existing?.externalId, existing?.body]);

	const editorConfig = useMemo(
		() => ({
			readonly: false,
			height: 420,
			minHeight: 320,
			placeholder: "Write policy content...",
			showXPathInStatusbar: false,
			statusbar: true,
			theme: isDark ? "dark" : "default",
			toolbarAdaptive: false,
			buttons: [
				"bold",
				"italic",
				"underline",
				"strikethrough",
				"eraser",
				"|",
				"ul",
				"ol",
				"|",
				"brush",
				"fontsize",
				"paragraph",
				"|",
				"outdent",
				"indent",
				"|",
				"superscript",
				"subscript",
				"|",
				"table",
				"link",
				"image",
				"video",
				"file",
				"|",
				"align",
				"hr",
				"copyformat",
				"|",
				"undo",
				"redo",
				"|",
				"fullsize",
				"preview",
				"print",
				"source",
			],
		}),
		[isDark],
	);

	const savePolicy = async () => {
		const next = draft.trim();
		if (!next || next === emptyEditorHtml) {
			toast.error("Policy content cannot be empty.");
			return;
		}

		try {
			if (existing?.externalId) {
				await updatePolicy({
					externalId: existing.externalId,
					body: { body: next },
				}).unwrap();
				toast.success("Policy content updated.");
			} else {
				await createPolicy({ body: next }).unwrap();
				toast.success("Policy content created.");
			}
			setContent(next);
		} catch (error) {
			console.error("Failed to save policy.", error);
			toast.error(apiErrorMessage(error, "Could not save policy content."));
		}
	};

	return (
		<div className={`relative min-h-screen overflow-hidden font-sans ${isDark ? "bg-[#03091c] text-white" : "bg-[#f5f8ff] text-slate-900"}`}>
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-52 -top-56 h-[620px] w-[620px] rounded-full bg-violet-700/[0.12] blur-[160px]" />
				<div className="absolute right-[-200px] top-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/[0.08] blur-[170px]" />
			</div>
			<Sidebar onLogout={logout} />

			<main className="relative mx-auto max-w-[1900px] px-4 pb-8 pt-6 sm:px-6 lg:px-7 lg:pt-7">
				<header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className={`mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
							<Activity className="h-3.5 w-3.5" /> Support
						</p>
						<h1 className={`text-xl font-semibold tracking-tight sm:text-2xl ${isDark ? "text-white" : "text-slate-900"}`}>Policy</h1>
						<p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-600"}`}>
							{isLoading || isFetching ? "Loading policy…" : isError ? "Could not load policy" : existing ? "Edit existing policy content" : "Create policy content"}
						</p>
					</div>
					<button
						type="button"
						onClick={() => void refetch()}
						disabled={isFetching}
						aria-label="Refresh policy"
						title="Refresh policy"
						className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-60 ${isDark ? "border-white/[0.09] bg-white/[0.035] text-slate-400 hover:border-cyan-200/20 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700"}`}
					>
						<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</header>

				<section
					className={`overflow-hidden rounded-xl border p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-5 ${
						isDark
							? "border-white/[0.09] bg-gradient-to-br from-[#0b1835]/95 via-[#08142e]/95 to-[#10102d]/90"
							: "border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
					}`}
				>
					<h2 className={`mb-4 text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Policy</h2>

					<div className={`overflow-hidden rounded-lg border ${isDark ? "border-white/[0.08] bg-[#03091c]/70" : "border-slate-200 bg-white"}`}>
						{isLoading ? (
							<div className="flex h-[420px] items-center justify-center text-sm text-slate-500">Loading policy content…</div>
						) : (
							<JoditEditor
								key={`${editorKey}-${isDark ? "dark" : "light"}`}
								value={content}
								config={editorConfig}
								onBlur={(value) => setDraft(value)}
								onChange={(value) => setDraft(value)}
							/>
						)}
					</div>

					<div className="mt-5 flex flex-wrap items-center justify-center gap-3">
						<button
							type="button"
							onClick={() => void savePolicy()}
							disabled={isSaving || isLoading}
							className={`flex h-10 items-center gap-2 rounded-lg border px-5 text-[12px] font-semibold transition disabled:opacity-60 ${
								isDark
									? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
									: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
							}`}
						>
							{isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
							{existing ? "Change Content" : "Create Policy"}
						</button>
						<button
							type="button"
							onClick={() => navigate(-1)}
							className={`h-10 rounded-lg border px-5 text-[12px] font-semibold transition ${
								isDark
									? "border-white/[0.12] bg-transparent text-slate-200 hover:bg-white/[0.05]"
									: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
							}`}
						>
							Back
						</button>
					</div>
				</section>
			</main>
		</div>
	);
}
