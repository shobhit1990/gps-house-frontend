import { useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { X } from "lucide-react";

type VehicleCommandDialogProps = {
	vehicleNo: string;
	onClose: () => void;
};

const messageTypeOptions = ["String", "Hex", "JSON"] as const;

export function VehicleCommandDialog({ vehicleNo, onClose }: VehicleCommandDialogProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const [command, setCommand] = useState("");
	const [messageType, setMessageType] = useState<(typeof messageTypeOptions)[number]>("String");

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		// API not wired yet — UI only.
		onClose();
	};

	const inputClass = `h-10 w-full rounded-lg border px-3 text-xs outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/10"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;

	return (
		<div
			className={`fixed inset-0 z-[830] flex items-center justify-center p-4 backdrop-blur-sm ${
				isDark ? "bg-[#020718]/80" : "bg-slate-900/50"
			}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape") onClose();
			}}
		>
			<form
				role="dialog"
				aria-modal="true"
				aria-labelledby="vehicle-command-title"
				onSubmit={handleSubmit}
				className={`w-full max-w-xl overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
				}`}
			>
				<header
					className={`flex items-center justify-between border-b px-5 py-4 ${
						isDark ? "border-white/[0.08] bg-[#08142e]" : "border-slate-200 bg-slate-50"
					}`}
				>
					<h2
						id="vehicle-command-title"
						className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
					>
						Command
					</h2>
					<div className="flex items-center gap-2">
						<button
							type="button"
							aria-label={`View command history for ${vehicleNo}`}
							title="History"
							className={`h-8 rounded-lg border px-3 text-[12px] font-semibold transition ${
								isDark
									? "border-white/[0.08] text-slate-300 hover:bg-white/[0.05]"
									: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
							}`}
						>
							History
						</button>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close command dialog"
							className={`rounded-lg p-1.5 transition ${
								isDark
									? "text-slate-400 hover:bg-white/[0.06] hover:text-white"
									: "text-slate-500 hover:bg-slate-200"
							}`}
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				</header>

				<div className="space-y-4 px-5 py-5">
					<label className={`block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
						<span className="mb-1.5 block">Command</span>
						<input
							autoFocus
							value={command}
							onChange={(event) => setCommand(event.target.value)}
							placeholder="Please Enter Command"
							className={inputClass}
						/>
					</label>

					<label className={`block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
						<span className="mb-1.5 block">Message Type</span>
						<span className="relative block">
							<select
								value={messageType}
								onChange={(event) =>
									setMessageType(event.target.value as (typeof messageTypeOptions)[number])
								}
								className={`${inputClass} appearance-none pr-9`}
							>
								{messageTypeOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<span
								className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${
									isDark ? "text-slate-500" : "text-slate-500"
								}`}
							>
								⌄
							</span>
						</span>
					</label>
				</div>

				<footer
					className={`flex justify-end gap-2 border-t px-5 py-3 ${
						isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"
					}`}
				>
					<button
						type="button"
						onClick={onClose}
						className={`h-9 rounded-lg border px-4 text-xs font-medium ${
							isDark
								? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]"
								: "border-slate-200 text-slate-700 hover:bg-slate-50"
						}`}
					>
						Cancel
					</button>
					<button
						type="submit"
						className={`h-9 rounded-lg border px-4 text-xs font-semibold ${
							isDark
								? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]"
								: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
						}`}
					>
						Send
					</button>
				</footer>
			</form>
		</div>
	);
}
