import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";

type AlertModalProps = {
	isDark: boolean;
	title: string;
	kicker?: string;
	onClose: () => void;
	/** Called when the form is submitted (Enter key or a `type="submit"` footer button). */
	onSubmit?: () => void;
	footer?: ReactNode;
	/** Tailwind max-width class for the dialog, e.g. "max-w-3xl". */
	widthClass?: string;
	children: ReactNode;
};

export function AlertModal({ isDark, title, kicker = "Alerts", onClose, onSubmit, footer, widthClass = "max-w-5xl", children }: AlertModalProps) {
	const titleId = useId();

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<form
				noValidate
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				onSubmit={(event) => {
					event.preventDefault();
					onSubmit?.();
				}}
				className={`flex max-h-[96vh] w-full ${widthClass} flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>{kicker}</p>
						<h2 id={titleId} className="text-[15px] font-semibold">{title}</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close dialog" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

				{footer && (
					<footer className={`flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
						{footer}
					</footer>
				)}
			</form>
		</div>
	);
}
