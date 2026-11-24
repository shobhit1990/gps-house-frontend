import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronDown, Circle, Loader2, Maximize2, Pentagon, Square, Trash2, X } from "lucide-react";
import {
	DrawController,
	MapDragControl,
	MapEvents,
	MapSize,
	Recenter,
	type DrawTool,
} from "@/components/Geofence/GeofenceMapControls";
import {
	coordsFromShape,
	DEFAULT_CENTER,
	DEFAULT_RADIUS_M,
	parseCoord,
	resolveRadiusMeters,
	round6,
	shapeFromInitial,
	shapeValue,
	type DrawnShape,
} from "@/components/Geofence/geofenceGeometry";
import { GeofAssignType } from "@/enums/GeofAssignType";
import { GeoType } from "@/enums/GeoType";
import { Shapes } from "@/enums/Shapes";
import { toTransitTimeKey, toTransitTimeNumber, transitTimeOptions } from "@/enums/TransitTime";
import type { CreateGeofenceRequest, Geofence } from "@/interfaces/Geofence";
import { useGetGeofTypeMasterQuery } from "@/store/services/api/Master";

export type GeofenceFormValues = CreateGeofenceRequest;

type AddGeofenceProps = {
	onClose: () => void;
	onSubmit: (values: GeofenceFormValues) => void | Promise<void>;
	initialValues?: Geofence;
	isSaving?: boolean;
};

const assignTypeOptions = Object.values(GeofAssignType);
const shapeOptions = Object.values(Shapes);
const geoTypeOptions = Object.values(GeoType);
const statusOptions = ["active", "inactive"] as const;

const assignTypeLabel = (value: GeofAssignType) =>
	value.charAt(0).toUpperCase() + value.slice(1);

const shapeLabel = (value: Shapes) => value.charAt(0).toUpperCase() + value.slice(1);

const pinIcon = L.divIcon({
	className: "",
	iconSize: [28, 36],
	iconAnchor: [14, 34],
	html: `<div style="position:relative;width:28px;height:36px"><span style="position:absolute;left:4px;top:0;width:20px;height:20px;border-radius:999px 999px 999px 0;background:#fb7185;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 6px 16px rgba(0,0,0,.45)"></span><span style="position:absolute;left:10px;top:6px;width:8px;height:8px;border-radius:999px;background:#fff"></span></div>`,
});

const tiles = {
	map: {
		url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	},
	satellite: {
		url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		attribution: "Tiles &copy; Esri",
	},
};

const initialCoordText = (values: number[] | undefined, fallback: number) =>
	values?.[0] != null ? Number(values[0]).toFixed(6) : fallback.toFixed(6);

const initialRadiusText = (initialValues?: Geofence) => {
	const shape = shapeFromInitial(initialValues);
	if (shape?.kind === "circle") return String(Math.round(shape.radius));
	if (initialValues?.radius) return String(Math.round(Number(initialValues.radius)) || DEFAULT_RADIUS_M);
	return "";
};

const drawTools: { id: DrawTool | "delete"; label: string; icon: typeof Circle }[] = [
	{ id: "circle", label: "Draw circle", icon: Circle },
	{ id: "rectangle", label: "Draw rectangle", icon: Square },
	{ id: "polygon", label: "Draw polygon", icon: Pentagon },
	{ id: "delete", label: "Clear shape", icon: Trash2 },
];

export function AddGeofence({
	onClose,
	onSubmit,
	initialValues,
	isSaving = false,
}: AddGeofenceProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const { data: geoTypes = [], isLoading: geoTypesLoading, isError: geoTypesError } = useGetGeofTypeMasterQuery();

	const [name, setName] = useState(initialValues?.name ?? "");
	const [type, setType] = useState(initialValues?.type ?? "");
	const [assignType, setAssignType] = useState(
		() =>
			assignTypeOptions.find((option) => option === initialValues?.assignType) ?? GeofAssignType.GROUP,
	);
	const [geoType, setGeoType] = useState(initialValues?.geoType || geoTypeOptions[0]);
	const [shapeKind, setShapeKind] = useState<Shapes>(
		() => (shapeValue(shapeFromInitial(initialValues)?.kind ?? "circle") as Shapes) || Shapes.CIRCLE,
	);
	const [geofenceCode, setGeofenceCode] = useState(initialValues?.geofenceCode ?? "");
	const [transitTime, setTransitTime] = useState(() => toTransitTimeKey(initialValues?.transitTime ?? "DAY_20"));
	const [latitude, setLatitude] = useState(() => initialCoordText(initialValues?.latitude, DEFAULT_CENTER.lat));
	const [longitude, setLongitude] = useState(() => initialCoordText(initialValues?.longitude, DEFAULT_CENTER.lng));
	const [radius, setRadius] = useState(() => initialRadiusText(initialValues) || String(DEFAULT_RADIUS_M));
	const [status, setStatus] = useState(
		(initialValues?.status ?? "").toLowerCase() === "inactive" ? "inactive" : "active",
	);
	const [reason, setReason] = useState(initialValues?.reason ?? "");
	const [mapMode, setMapMode] = useState<"map" | "satellite">("map");
	const [expanded, setExpanded] = useState(false);
	const [formError, setFormError] = useState("");
	const [drawTool, setDrawTool] = useState<DrawTool>("pan");
	const [drawnShape, setDrawnShape] = useState<DrawnShape | null>(() => {
		const fromInitial = shapeFromInitial(initialValues);
		if (fromInitial) return fromInitial;
		return {
			kind: "circle",
			center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
			radius: DEFAULT_RADIUS_M,
		};
	});
	const [followMarker, setFollowMarker] = useState(true);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	useEffect(() => {
		if (!geoTypes.length) return;
		setType((current) => {
			if (current && geoTypes.some((option) => option.id === current)) return current;
			const match = initialValues?.type
				? geoTypes.find(
						(option) => option.id === initialValues.type || option.externalId === initialValues.type,
					)
				: undefined;
			return match?.id ?? geoTypes[0].id;
		});
	}, [geoTypes, initialValues?.type]);

	const lat = parseCoord(latitude, DEFAULT_CENTER.lat);
	const lng = parseCoord(longitude, DEFAULT_CENTER.lng);
	const tile = tiles[mapMode];
	const shapeCoords = useMemo(() => coordsFromShape(drawnShape), [drawnShape]);

	const inputClass = `h-[37px] w-full rounded-lg border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `block min-w-0 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const clearError = () => setFormError("");

	const applyCoordinates = (nextLat: number, nextLng: number) => {
		setLatitude(nextLat.toFixed(6));
		setLongitude(nextLng.toFixed(6));
		setFollowMarker(true);
		clearError();
	};

	const syncCircleAt = (nextLat: number, nextLng: number, radiusText: string) => {
		const meters = resolveRadiusMeters(radiusText);
		if (!(Number(radiusText) > 0)) setRadius(String(DEFAULT_RADIUS_M));
		setDrawnShape((current) => {
			if (current && current.kind !== "circle") return current;
			return { kind: "circle", center: [round6(nextLat), round6(nextLng)], radius: meters };
		});
	};

	const moveMarker = (nextLat: number, nextLng: number) => {
		applyCoordinates(nextLat, nextLng);
		syncCircleAt(nextLat, nextLng, radius);
	};

	const stopDrawing = () => {
		setDrawTool("pan");
		setFollowMarker(false);
	};

	const handleShapeChange = (next: DrawnShape | null) => {
		setDrawnShape(next);
		const coords = coordsFromShape(next);
		if (coords.center) applyCoordinates(coords.center[0], coords.center[1]);
		if (next) {
			setShapeKind(shapeValue(next.kind) as Shapes);
			if (next.kind === "circle") setRadius(String(coords.radius || DEFAULT_RADIUS_M));
			stopDrawing();
		}
	};

	/** Selecting a shape autofills radius (default 500m) and applies a circle at the current pin. */
	const selectShape = (kind: Shapes) => {
		setShapeKind(kind);
		clearError();
		const meters = resolveRadiusMeters(radius);
		setRadius(String(meters));

		const center: [number, number] = [
			parseCoord(latitude, DEFAULT_CENTER.lat),
			parseCoord(longitude, DEFAULT_CENTER.lng),
		];

		if (kind === Shapes.CIRCLE) {
			setDrawnShape({ kind: "circle", center, radius: meters });
			setDrawTool("pan");
			setFollowMarker(true);
			return;
		}

		// Rectangle / polygon: fill radius for payload fallback, then let user draw on the map.
		setDrawnShape(null);
		setDrawTool(kind === Shapes.RECTANGLE ? "rectangle" : "polygon");
		setFollowMarker(false);
	};

	const applyRadius = (value: string) => {
		setRadius(value);
		clearError();
		const meters = Number(value);
		if (!Number.isFinite(meters) || meters <= 0) return;
		setShapeKind(Shapes.CIRCLE);
		setDrawnShape({
			kind: "circle",
			center: [parseCoord(latitude, DEFAULT_CENTER.lat), parseCoord(longitude, DEFAULT_CENTER.lng)],
			radius: meters,
		});
		stopDrawing();
	};

	const clearShape = () => {
		setDrawnShape(null);
		setRadius(String(DEFAULT_RADIUS_M));
		setShapeKind(Shapes.CIRCLE);
		stopDrawing();
		clearError();
	};

	const updateCoordField = (axis: "lat" | "lng", value: string) => {
		if (axis === "lat") setLatitude(value);
		else setLongitude(value);
		setFollowMarker(true);
		clearError();

		const nextLat = axis === "lat" ? parseCoord(value, DEFAULT_CENTER.lat) : parseCoord(latitude, DEFAULT_CENTER.lat);
		const nextLng = axis === "lng" ? parseCoord(value, DEFAULT_CENTER.lng) : parseCoord(longitude, DEFAULT_CENTER.lng);
		syncCircleAt(nextLat, nextLng, radius);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const transitDays = toTransitTimeNumber(transitTime);
		const centerLat = shapeCoords.center?.[0] ?? Number(latitude);
		const centerLng = shapeCoords.center?.[1] ?? Number(longitude);

		if (
			!name.trim() ||
			!type.trim() ||
			!assignType.trim() ||
			!geoType.trim() ||
			!transitDays ||
			!Number.isFinite(centerLat) ||
			!Number.isFinite(centerLng)
		) {
			setFormError("Complete all required fields before saving.");
			return;
		}
		if (!drawnShape) {
			setFormError("Draw a shape or enter a radius before saving.");
			return;
		}
		if (drawnShape.kind === "circle" && shapeCoords.radius <= 0) {
			setFormError("Enter a valid radius for the circle.");
			return;
		}

		await onSubmit({
			name: name.trim(),
			type: type.trim(),
			assignType,
			transitTime: transitDays,
			shapes: shapeKind || shapeValue(drawnShape.kind),
			geoType,
			latitude: round6(centerLat),
			longitude: round6(centerLng),
			radius: Number(shapeCoords.radius) || Number(radius) || DEFAULT_RADIUS_M,
			...(geofenceCode.trim() ? { geofenceCode: geofenceCode.trim() } : {}),
			...(status ? { status } : {}),
			...(reason.trim() ? { reason: reason.trim() } : {}),
		});
	};

	const field = (label: ReactNode, control: ReactNode, className = "") => (
		<label className={`${labelClass} ${className}`}>{label}{control}</label>
	);

	const requiredLabel = (text: string) => (
		<span className="mb-1.5 flex items-center gap-1">
			{text} <span className="text-rose-400">*</span>
		</span>
	);

	const optionalLabel = (text: string, hint: string) => (
		<span className="mb-1.5 flex items-center gap-1">
			{text} <span className="font-normal text-slate-500">({hint})</span>
		</span>
	);

	const geoTypePlaceholder = geoTypesLoading
		? "Loading geo types..."
		: geoTypesError
			? "Could not load geo types"
			: geoTypes.length === 0
				? "No geo types available"
				: "Select geo type";

	return (
		<div
			className={`fixed inset-0 z-[800] flex items-center justify-center p-2 backdrop-blur-sm sm:p-4 ${isDark ? "bg-[#020718]/80" : "bg-slate-900/50"}`}
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<form
				onSubmit={handleSubmit}
				className={`flex max-h-[96vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${isDark ? "border-white/[0.10] bg-[#0a1630]" : "border-slate-200 bg-white"}`}
				aria-labelledby={titleId}
			>
				<header className={`flex h-[52px] shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/[0.08] bg-[#08142e] text-white" : "border-slate-200 bg-white text-slate-900"}`}>
					<div>
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>
							Fleet operations
						</p>
						<h2 id={titleId} className="text-[15px] font-semibold">
							{initialValues ? "Edit Geofence" : "Add Geofence"}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close geofence form"
						className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
					>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
					{formError ? (
						<p
							role="alert"
							className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}
						>
							{formError}
						</p>
					) : null}

					<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
						{/* Map */}
						<div>
							<p className={`text-[12px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Location map</p>
							<p className="mb-3 mt-1 text-[11px] text-slate-500">
								Use the tools to draw an area. Circle/rectangle: click and drag. Polygon: click points, double-click to finish.
							</p>
							<div
								className={`relative overflow-hidden rounded-xl border ${expanded ? "h-[460px]" : "h-[320px]"} ${isDark ? "border-white/[0.08]" : "border-slate-200"} ${mapMode === "map" ? "[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_brightness(0.82)_contrast(0.92)]" : ""}`}
							>
								<MapContainer
									center={[lat, lng]}
									zoom={15}
									zoomControl={false}
									doubleClickZoom={false}
									className="h-full w-full"
									scrollWheelZoom
								>
									<TileLayer key={mapMode} attribution={tile.attribution} url={tile.url} />
									<MapSize expanded={expanded} />
									<Recenter lat={lat} lng={lng} enabled={followMarker} />
									<MapDragControl enabled={drawTool === "pan"} />
									<MapEvents enabled={drawTool === "pan"} onPick={moveMarker} />
									<DrawController tool={drawTool} shape={drawnShape} onShapeChange={handleShapeChange} />
									<Marker
										position={[lat, lng]}
										icon={pinIcon}
										draggable={drawTool === "pan"}
										eventHandlers={{
											dragend: (event) => {
												const point = event.target.getLatLng();
												moveMarker(point.lat, point.lng);
											},
										}}
									/>
								</MapContainer>

								<div className="absolute left-3 top-3 z-[500] flex flex-col overflow-hidden rounded-md border border-slate-300 bg-white shadow-lg">
									{drawTools.map((tool) => {
										const Icon = tool.icon;
										const active = tool.id !== "delete" && drawTool === tool.id;
										return (
											<button
												key={tool.id}
												type="button"
												title={tool.label}
												aria-label={tool.label}
												aria-pressed={tool.id === "delete" ? undefined : active}
												onClick={() => {
													if (tool.id === "delete") {
														clearShape();
														return;
													}
													if (tool.id === "circle") {
														selectShape(Shapes.CIRCLE);
														return;
													}
													selectShape(tool.id === "rectangle" ? Shapes.RECTANGLE : Shapes.POLYGON);
												}}
												className={`flex h-9 w-9 items-center justify-center border-b border-slate-200 last:border-b-0 transition ${
													active ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
												}`}
											>
												<Icon className="h-4 w-4" strokeWidth={2} />
											</button>
										);
									})}
								</div>

								<div className="absolute bottom-3 left-14 z-[500] flex overflow-hidden rounded-lg border border-white/15 bg-[#07142f]/90 text-[11px] font-semibold shadow-lg backdrop-blur-md">
									{(["map", "satellite"] as const).map((mode) => (
										<button
											key={mode}
											type="button"
											onClick={() => setMapMode(mode)}
											className={`h-8 px-3 capitalize ${mapMode === mode ? "bg-cyan-300/[0.16] text-cyan-100" : "text-slate-300 hover:text-white"}`}
										>
											{mode === "map" ? "Map" : "Satellite"}
										</button>
									))}
								</div>

								<button
									type="button"
									onClick={() => setExpanded((open) => !open)}
									aria-label="Expand map"
									className="absolute right-3 top-3 z-[500] flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#07142f]/90 text-slate-200 shadow-lg backdrop-blur-md hover:text-cyan-100"
								>
									<Maximize2 className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>

						{/* Fields */}
						<div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:content-start">
							{field(
								requiredLabel("Name"),
								<input required value={name} onChange={(event) => { setName(event.target.value); clearError(); }} className={inputClass} />,
							)}

							{field(
								requiredLabel("Geofence Type"),
								<span className="relative block">
									<select
										required
										value={type}
										disabled={geoTypesLoading || geoTypesError || geoTypes.length === 0}
										onChange={(event) => { setType(event.target.value); clearError(); }}
										className={`${inputClass} appearance-none pr-8 disabled:cursor-not-allowed disabled:opacity-60`}
									>
										<option value="">{geoTypePlaceholder}</option>
										{geoTypes.map((option) => (
											<option key={option.id} value={option.id}>{option.name}</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>,
							)}

							{field(
								requiredLabel("Assign Type"),
								<span className="relative block">
									<select
										required
										value={assignType}
										onChange={(event) => setAssignType(event.target.value as GeofAssignType)}
										className={`${inputClass} appearance-none pr-8`}
									>
										{assignTypeOptions.map((option) => (
											<option key={option} value={option}>{assignTypeLabel(option)}</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>,
							)}

							{field(
								requiredLabel("Shape"),
								<span className="relative block">
									<select
										required
										value={shapeKind}
										onChange={(event) => selectShape(event.target.value as Shapes)}
										className={`${inputClass} appearance-none pr-8`}
									>
										{shapeOptions.map((option) => (
											<option key={option} value={option}>{shapeLabel(option)}</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>,
							)}

							{field(
								requiredLabel("Geo Type"),
								<span className="relative block">
									<select required value={geoType} onChange={(event) => setGeoType(event.target.value)} className={`${inputClass} appearance-none pr-8`}>
										{geoTypeOptions.map((option) => (
											<option key={option} value={option}>{option}</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>,
							)}

							{field(
								optionalLabel("Geofence Code", "Optional"),
								<input value={geofenceCode} onChange={(event) => { setGeofenceCode(event.target.value); clearError(); }} className={inputClass} />,
							)}

							{field(
								requiredLabel("Transit Time"),
								<span className="relative block">
									<select
										required
										value={transitTime}
										onChange={(event) => { setTransitTime(toTransitTimeKey(event.target.value)); clearError(); }}
										className={`${inputClass} appearance-none pr-8`}
									>
										{transitTimeOptions.map((option) => (
											<option key={option.value} value={option.value}>{option.label}</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>,
							)}

							{field(
								optionalLabel("Radius (m)", "sets circle"),
								<input
									type="number"
									min={1}
									step="1"
									value={radius}
									onChange={(event) => applyRadius(event.target.value)}
									placeholder="e.g. 500"
									className={inputClass}
								/>,
							)}

							{field(
								requiredLabel("Latitude"),
								<input
									required
									type="number"
									step="any"
									value={latitude}
									onChange={(event) => updateCoordField("lat", event.target.value)}
									className={inputClass}
								/>,
							)}

							{field(
								requiredLabel("Longitude"),
								<input
									required
									type="number"
									step="any"
									value={longitude}
									onChange={(event) => updateCoordField("lng", event.target.value)}
									className={inputClass}
								/>,
							)}

							{field(
								requiredLabel("Status"),
								<select required value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
									{statusOptions.map((option) => (
										<option key={option} value={option}>
											{option[0].toUpperCase() + option.slice(1)}
										</option>
									))}
								</select>,
							)}

							{field(
								requiredLabel("Reason"),
								<textarea
									required
									value={reason}
									rows={3}
									onChange={(event) => { setReason(event.target.value); clearError(); }}
									className={`${inputClass} h-auto py-2`}
								/>,
								"sm:col-span-2",
							)}
						</div>
					</div>
				</div>

				<footer className={`flex shrink-0 justify-center border-t px-5 py-4 ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
					<button
						type="submit"
						disabled={isSaving}
						className={`flex h-9 min-w-[140px] items-center justify-center gap-2 rounded-lg border px-6 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}
					>
						{isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						{isSaving ? "Saving..." : initialValues ? "Save Changes" : "Add"}
					</button>
				</footer>
			</form>
		</div>
	);
}
