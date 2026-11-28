import { useEffect, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import { useGetClientMasterQuery, useGetTransporterMasterQuery } from "@/store/services/api/Master";

type ChangeVehicleClientDialogProps = {
	vehicleNo: string;
	clientId?: string;
	transporterId?: string;
	onClose: () => void;
};

export function ChangeVehicleClientDialog({
	vehicleNo,
	clientId = "",
	transporterId = "",
	onClose,
}: ChangeVehicleClientDialogProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: clients = [], isLoading: clientsLoading } = useGetClientMasterQuery();
	const [vehicle, setVehicle] = useState(vehicleNo === "—" ? "" : vehicleNo);
	const [client, setClient] = useState(clientId);
	const [transporter, setTransporter] = useState(transporterId);
	const { data: transporters = [], isLoading: transportersLoading } = useGetTransporterMasterQuery(
		client ? { client } : undefined,
		{ skip: !client },
	);

	useEffect(() => {
		if (!transporter) return;
		if (transporters.some((item) => item.id === transporter)) return;
		setTransporter("");
	}, [transporter, transporters]);

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
	const labelClass = `mb-1.5 block text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

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
				aria-labelledby="change-vehicle-client-title"
				onSubmit={handleSubmit}
				className={`w-full max-w-3xl overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
					isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"
				}`}
			>
				<header
					className={`flex items-center justify-between border-b px-5 py-4 ${
						isDark ? "border-white/[0.08] bg-[#08142e]" : "border-slate-200 bg-slate-50"
					}`}
				>
					<h2
						id="change-vehicle-client-title"
						className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
					>
						Change Vehicle Client
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close change vehicle client dialog"
						className={`rounded-lg p-1.5 transition ${
							isDark
								? "text-slate-400 hover:bg-white/[0.06] hover:text-white"
								: "text-slate-500 hover:bg-slate-200"
						}`}
					>
						<X className="h-4 w-4" />
					</button>
				</header>

				<div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-3">
					<label className="block min-w-0">
						<span className={labelClass}>
							Vehicle <span className="text-rose-500">*</span>
						</span>
						<input
							required
							value={vehicle}
							onChange={(event) => setVehicle(event.target.value.toUpperCase())}
							placeholder="Vehicle number"
							className={inputClass}
						/>
						<span className={`mt-1 block text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
							Only contains [ A-Z, 0-9, _, -, , ]
						</span>
					</label>

					<label className="block min-w-0">
						<span className={labelClass}>
							Client <span className="text-rose-500">*</span>
						</span>
						<span className="relative block">
							<select
								required
								value={client}
								onChange={(event) => {
									setClient(event.target.value);
									setTransporter("");
								}}
								disabled={clientsLoading}
								className={`${inputClass} appearance-none pr-9`}
							>
								<option value="">Select Client</option>
								{clients.map((option) => (
									<option key={option.id} value={option.id}>
										{option.name}
									</option>
								))}
							</select>
							<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>
								⌄
							</span>
						</span>
					</label>

					<label className="block min-w-0">
						<span className={labelClass}>
							Transporter <span className="text-rose-500">*</span>
						</span>
						<span className="relative block">
							<select
								required
								value={transporter}
								onChange={(event) => setTransporter(event.target.value)}
								disabled={!client || transportersLoading}
								className={`${inputClass} appearance-none pr-9`}
							>
								<option value="">
									{!client
										? "Select Transporter"
										: transportersLoading
											? "Loading transporters…"
											: "Select Transporter"}
								</option>
								{transporters.map((option) => (
									<option key={option.id} value={option.id}>
										{option.name}
									</option>
								))}
							</select>
							<span className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${isDark ? "text-slate-500" : "text-slate-500"}`}>
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
						Change
					</button>
				</footer>
			</form>
		</div>
	);
}
