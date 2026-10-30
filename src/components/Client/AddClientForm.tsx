import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import type { Client, CreateClientRequest } from "@/interfaces/Client";
import { useCreateClientMutation, useUpdateClientMutation } from "@/store/services/api/Client";
import {
	useGetLanguagesQuery,
	useGetOwnerMasterQuery,
	useGetTimezonesQuery,
} from "@/store/services/api/Master";

type ClientFormValues = {
	ownerName: string;
	username: string;
	password: string;
	confirmPassword: string;
	company: string;
	name: string;
	email: string;
	phone: string;
	address: string;
	language: string;
	domain: string;
	maxVehicleCount: string;
	timezone: string;
	imageName: string;
	active: boolean;
};

type AddClientFormProps = {
	/** Client being edited; omit to create a new one. */
	client?: Client | null;
	onClose: () => void;
};

const fallbackTimezones = ["(GMT+5:30) Asia/Calcutta", "(GMT+0:00) UTC", "(GMT-5:00) America/New_York"];
const fallbackLanguages = ["English", "Hindi"];
const usernamePattern = /^[A-Za-z0-9_.*@-]+$/;

const emptyValues: ClientFormValues = {
	ownerName: "",
	username: "",
	password: "",
	confirmPassword: "",
	company: "",
	name: "",
	email: "",
	phone: "",
	address: "",
	language: "",
	domain: "",
	maxVehicleCount: "",
	timezone: "",
	imageName: "",
	active: true,
};

const valuesFromClient = (client: Client): ClientFormValues => ({
	...emptyValues,
	ownerName: client.ownerName ?? "",
	username: client.username ?? "",
	company: client.company ?? "",
	name: client.name ?? "",
	email: client.email ?? "",
	phone: client.phone ?? "",
	address: client.address ?? "",
	language: client.language ?? "",
	domain: client.domain ?? "",
	maxVehicleCount: client.maxVehicleCount != null ? String(client.maxVehicleCount) : "",
	timezone: client.timezone ?? "",
	active: client.active ?? true,
});

const buildClientPayload = (values: ClientFormValues, image: string): CreateClientRequest => ({
	ownerName: values.ownerName,
	username: values.username.trim(),
	password: values.password,
	company: values.company.trim(),
	name: values.name.trim() || undefined,
	email: values.email.trim() || undefined,
	phone: values.phone.trim() || undefined,
	address: values.address.trim() || undefined,
	language: values.language,
	domain: values.domain.trim() || undefined,
	maxVehicleCount: values.maxVehicleCount.trim() ? Number(values.maxVehicleCount) : undefined,
	timezone: values.timezone,
	image: image || undefined,
	active: values.active,
});

const apiErrorMessage = (error: unknown, fallback: string) => {
	const data = (error as { data?: { message?: string } })?.data;
	return data?.message || fallback;
};

function cropToSquare(source: string) {
	return new Promise<string>((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			const size = Math.min(image.width, image.height);
			const canvas = document.createElement("canvas");
			canvas.width = size;
			canvas.height = size;
			const context = canvas.getContext("2d");
			if (!context) {
				reject(new Error("Canvas is unavailable"));
				return;
			}
			context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, size, size);
			resolve(canvas.toDataURL("image/jpeg", 0.92));
		};
		image.onerror = () => reject(new Error("Image could not be read"));
		image.src = source;
	});
}

export function AddClientForm({ client, onClose }: AddClientFormProps) {
	const isEdit = Boolean(client);
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const { data: owners = [], isLoading: ownersLoading } = useGetOwnerMasterQuery();
	const { data: languages = [], isLoading: languagesLoading } = useGetLanguagesQuery();
	const { data: timezones = [], isLoading: timezonesLoading } = useGetTimezonesQuery();

	const languageOptions = useMemo(
		() =>
			languages.length > 0
				? languages.map((item) => item.language)
				: fallbackLanguages,
		[languages],
	);
	const timezoneOptions = useMemo(
		() =>
			timezones.length > 0
				? timezones.map((item) => item.timezone ?? "").filter(Boolean)
				: fallbackTimezones,
		[timezones],
	);
	const titleId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [values, setValues] = useState<ClientFormValues>(() => (client ? valuesFromClient(client) : emptyValues));
	const [formError, setFormError] = useState("");
	const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
	const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
	const isSaving = isCreating || isUpdating;
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [imagePreview, setImagePreview] = useState(client?.image ?? "");
	const [cropOpen, setCropOpen] = useState(false);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				if (cropOpen) setCropOpen(false);
				else onClose();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [cropOpen, onClose]);

	useEffect(() => {
		setValues((current) => ({
			...current,
			language: current.language || languageOptions[0] || "",
			timezone: current.timezone || timezoneOptions[0] || "",
		}));
	}, [languageOptions, timezoneOptions]);

	const inputClass = `h-[37px] w-full rounded-lg border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `block min-w-0 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const update = (name: keyof ClientFormValues, value: string | boolean) => {
		setValues((current) => ({ ...current, [name]: value }));
		setFormError("");
	};

	const resetForm = () => {
		setValues(client ? valuesFromClient(client) : emptyValues);
		setImagePreview(client?.image ?? "");
		setFormError("");
		setShowPassword(false);
		setShowConfirmPassword(false);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const onFileChange = (file: File | undefined) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setFormError("Client image must be an image file.");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			setImagePreview(String(reader.result ?? ""));
			update("imageName", file.name);
		};
		reader.readAsDataURL(file);
	};

	const deleteImage = () => {
		setImagePreview("");
		update("imageName", "");
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const applyCrop = async () => {
		if (!imagePreview) return;
		try {
			const cropped = await cropToSquare(imagePreview);
			setImagePreview(cropped);
			setCropOpen(false);
		} catch {
			setFormError("Could not crop this image.");
			setCropOpen(false);
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!values.ownerName) {
			setFormError("Owner Name is required.");
			return;
		}
		if (!usernamePattern.test(values.username.trim())) {
			setFormError("Username can only contain A-z, 0-9, _, -, *, and @.");
			return;
		}
		if (!isEdit && !values.password) {
			setFormError("Password is required.");
			return;
		}
		if (values.password !== values.confirmPassword) {
			setFormError("Password and Confirm Password must match.");
			return;
		}

		const body = buildClientPayload(values, imagePreview);
		try {
			if (client) {
				// Leave the password unchanged when the field is left blank while editing.
				const { password, ...rest } = body;
				await updateClient({ externalId: client.externalId, body: password ? body : rest }).unwrap();
				toast.success(`${body.username} updated.`);
			} else {
				await createClient(body).unwrap();
				toast.success(`${body.username} added.`);
			}
			onClose();
		} catch (error) {
			console.error("Failed to save client.", error);
			setFormError(apiErrorMessage(error, "Could not save the client. Please try again."));
		}
	};

	const field = (label: string, control: ReactNode, hint?: string, required?: boolean, optional?: boolean) => (
		<label className={labelClass}>
			<span className="mb-1.5 flex items-center gap-1">
				{label}
				{required ? <span className="text-rose-400">*</span> : optional ? <span className="font-normal text-slate-500">(Optional)</span> : null}
			</span>
			{control}
			{hint && <span className="mt-1 block text-[11px] font-normal text-slate-500">{hint}</span>}
		</label>
	);

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<form
				onSubmit={handleSubmit}
				className={`flex max-h-[96vh] w-full max-w-[1160px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
				aria-labelledby={titleId}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<h2 id={titleId} className="text-[15px] font-semibold">{isEdit ? "Edit Client" : "Add Client"}</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close client form" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
					{formError && (
						<p role="alert" className={`mb-5 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
							{formError}
						</p>
					)}
					<div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
						{field(
							"Owner Name",
							<select
								required
								value={values.ownerName}
								onChange={(event) => update("ownerName", event.target.value)}
								className={inputClass}
								disabled={ownersLoading}
							>
								<option value="">{ownersLoading ? "Loading owners…" : "Select Owner Name"}</option>
								{owners.map((owner) => (
									<option key={owner.id ?? owner.ownerName} value={owner.ownerName ?? ""}>
										{owner.ownerName}
									</option>
								))}
							</select>,
							undefined,
							true,
						)}
						{field(
							"Username",
							<input required value={values.username} placeholder="Username" pattern="[A-Za-z0-9_.*@\-]+" onChange={(event) => update("username", event.target.value)} className={inputClass} />,
							"Only contains [ A-z, 0-9, _, -, *, @ ]",
							true,
						)}
						{field(
							"Password",
							<span className="relative flex">
								<input required={!isEdit} type={showPassword ? "text" : "password"} value={values.password} placeholder={isEdit ? "Leave blank to keep current" : "Password"} onChange={(event) => update("password", event.target.value)} className={`${inputClass} pr-11`} />
								<button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg border-l ${isDark ? "border-white/[0.09] bg-white/[0.04] text-slate-400 hover:text-cyan-100" : "border-slate-200 bg-slate-50 text-slate-600 hover:text-cyan-700"}`}>
									{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</span>,
							undefined,
							!isEdit,
						)}
						{field(
							"Confirm Password",
							<span className="relative flex">
								<input required={!isEdit} type={showConfirmPassword ? "text" : "password"} value={values.confirmPassword} placeholder="Confirm Password" onChange={(event) => update("confirmPassword", event.target.value)} className={`${inputClass} pr-11`} />
								<button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className={`absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg border-l ${isDark ? "border-white/[0.09] bg-white/[0.04] text-slate-400 hover:text-cyan-100" : "border-slate-200 bg-slate-50 text-slate-600 hover:text-cyan-700"}`}>
									{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</span>,
							undefined,
							!isEdit,
						)}
						{field("Company Name", <input required value={values.company} placeholder="Company Name" onChange={(event) => update("company", event.target.value)} className={inputClass} />, undefined, true)}
						{field("Name", <input value={values.name} placeholder="Name" onChange={(event) => update("name", event.target.value)} className={inputClass} />, undefined, false, true)}
						{field("Email", <input type="email" value={values.email} placeholder="Email" onChange={(event) => update("email", event.target.value)} className={inputClass} />, undefined, false, true)}
						{field("Phone", <input type="tel" value={values.phone} placeholder="Phone" onChange={(event) => update("phone", event.target.value)} className={inputClass} />, undefined, false, true)}
						{field("Address", <input value={values.address} placeholder="Address" onChange={(event) => update("address", event.target.value)} className={inputClass} />, undefined, false, true)}
						{field(
							"Language",
							<select
								required
								value={values.language}
								onChange={(event) => update("language", event.target.value)}
								className={inputClass}
								disabled={languagesLoading}
							>
								{languageOptions.map((language) => (
									<option key={language} value={language}>
										{language}
									</option>
								))}
							</select>,
							undefined,
							true,
						)}
						{field("Domain", <input value={values.domain} placeholder="Domain" onChange={(event) => update("domain", event.target.value)} className={inputClass} />, undefined, false, true)}
						{field("Max Vehicle Count", <input type="number" min={0} value={values.maxVehicleCount} placeholder="Max Vehicle Count" onChange={(event) => update("maxVehicleCount", event.target.value)} className={inputClass} />)}
						{field(
							"Timezone",
							<select
								required
								value={values.timezone}
								onChange={(event) => update("timezone", event.target.value)}
								className={inputClass}
								disabled={timezonesLoading}
							>
								{timezoneOptions.map((timezone) => (
									<option key={timezone} value={timezone}>
										{timezone}
									</option>
								))}
							</select>,
							undefined,
							true,
						)}
						<label className={labelClass}>
							<span className="mb-1.5 flex items-center gap-1">
								Client Image <span className="font-normal text-slate-500">(Optional)</span>
							</span>
							<span className="flex flex-wrap items-center gap-2">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									aria-label="Client Image"
									onChange={(event) => onFileChange(event.target.files?.[0])}
									className={`h-[37px] min-w-0 flex-1 rounded-lg border px-2 text-[12px] file:mr-3 file:rounded-md file:border-0 file:bg-transparent file:text-[12px] file:font-medium ${isDark ? "border-white/[0.09] bg-[#03091c]/70 text-slate-400 file:text-slate-200" : "border-slate-200 bg-white text-slate-600 file:text-slate-700"}`}
								/>
								<button type="button" disabled={!imagePreview} onClick={() => setCropOpen(true)} className={`h-[37px] rounded-lg border px-3 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "border-violet-300/20 bg-violet-300/[0.10] text-violet-100 hover:bg-violet-300/[0.16]" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}>
									Crop
								</button>
								<button type="button" disabled={!imagePreview} onClick={deleteImage} className={`h-[37px] rounded-lg border px-3 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
									Delete
								</button>
							</span>
							{imagePreview && <img src={imagePreview} alt="Client preview" className="mt-2 h-16 w-16 rounded-lg object-cover" />}
						</label>
					</div>

					<label className={`mt-6 flex w-fit cursor-pointer items-center gap-2.5 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
						<input type="checkbox" checked={values.active} onChange={(event) => update("active", event.target.checked)} className="h-4 w-4 rounded border-slate-400 accent-cyan-500" />
						Active
					</label>
				</div>

				<footer className={`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3 ${isDark ? "border-white/[0.08] bg-[#08142e]/70" : "border-slate-200 bg-white"}`}>
					<button type="button" onClick={resetForm} className={`h-9 rounded-lg border px-4 text-[12px] font-medium transition ${isDark ? "border-white/[0.08] text-slate-300 hover:bg-white/[0.04]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
						Reset
					</button>
					<button type="submit" disabled={isSaving} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[12px] font-semibold transition disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						{isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						{isEdit ? "Update" : "Save"}
					</button>
				</footer>
			</form>

			{cropOpen && imagePreview && (
				<div className="fixed inset-0 z-[810] flex items-center justify-center bg-[#020718]/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setCropOpen(false); }}>
					<section className={`w-full max-w-md rounded-2xl border p-5 ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}>
						<h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Crop client image</h3>
						<p className="mt-1 text-xs text-slate-500">The image will be cropped to a centered square.</p>
						<img src={imagePreview} alt="Crop preview" className="mx-auto mt-4 max-h-64 rounded-lg object-contain" />
						<div className="mt-4 flex justify-end gap-2">
							<button type="button" onClick={() => setCropOpen(false)} className={`h-9 rounded-lg border px-4 text-[12px] ${isDark ? "border-white/[0.08] text-slate-300" : "border-slate-200 text-slate-700"}`}>Cancel</button>
							<button type="button" onClick={applyCrop} className={`h-9 rounded-lg border px-4 text-[12px] font-semibold ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>Apply</button>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
