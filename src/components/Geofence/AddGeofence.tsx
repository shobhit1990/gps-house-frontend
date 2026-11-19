import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import {
	Circle as LeafletCircle,
	MapContainer,
	Marker,
	Polygon as LeafletPolygon,
	Rectangle as LeafletRectangle,
	TileLayer,
	useMap,
	useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronDown, Circle, Loader2, Maximize2, Pentagon, Square, Trash2, X } from "lucide-react";
import { GeoType } from "@/enums/GeoType";
import { Shapes } from "@/enums/Shapes";
import type { CreateGeofenceRequest, Geofence } from "@/interfaces/Geofence";
import { useGetGeofTypeMasterQuery } from "@/store/services/api/Master";

export type GeofenceFormValues = CreateGeofenceRequest;

type AddGeofenceProps = {
	onClose: () => void;
	onSubmit: (values: GeofenceFormValues) => void | Promise<void>;
	initialValues?: Geofence;
	isSaving?: boolean;
};

type DrawTool = "circle" | "rectangle" | "polygon" | "pan";

type DrawnShape =
	| { kind: "circle"; center: [number, number]; radius: number }
	| { kind: "rectangle"; bounds: [[number, number], [number, number]] }
	| { kind: "polygon"; points: [number, number][] };

const defaultCenter = { lat: 26.4658, lng: 80.3498 };
const assignTypeOptions = ["client", "technician", "transporter"] as const;
const geoTypeOptions = Object.values(GeoType);
const statusOptions = ["active", "inactive"] as const;

const shapeStyle = {
	color: "#22d3ee",
	weight: 2,
	fillColor: "#22d3ee",
	fillOpacity: 0.18,
};

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

const parseCoord = (value: string, fallback: number) => {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
};

const round6 = (value: number) => Number(value.toFixed(6));

const edgeLongitude = (lat: number, lng: number, radiusMeters: number) => {
	const metersPerDegreeLng = 111320 * Math.cos((lat * Math.PI) / 180);
	if (!Number.isFinite(metersPerDegreeLng) || metersPerDegreeLng === 0) return lng;
	return lng + radiusMeters / metersPerDegreeLng;
};

const radiusFromPoints = (latitudes: number[], longitudes: number[]) => {
	if (latitudes.length < 2 || longitudes.length < 2) return 0;
	const lat = latitudes[0] * (Math.PI / 180);
	const dLat = (latitudes[1] - latitudes[0]) * (Math.PI / 180);
	const dLng = (longitudes[1] - longitudes[0]) * (Math.PI / 180);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat) * Math.cos(latitudes[1] * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
	return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const shapeValue = (kind: DrawnShape["kind"]) => {
	if (kind === "circle") return Shapes.CIRCLE;
	if (kind === "rectangle") return Shapes.RECTANGLE;
	return Shapes.POLYGON;
};

const coordsFromShape = (
	shape: DrawnShape | null,
): { latitudes: number[]; longitudes: number[]; center: [number, number] | null; radius: number } => {
	if (!shape) return { latitudes: [], longitudes: [], center: null, radius: 0 };

	if (shape.kind === "circle") {
		const [lat, lng] = shape.center;
		const radius = Math.max(1, Math.round(shape.radius));
		return {
			latitudes: [round6(lat), round6(lat)],
			longitudes: [round6(lng), edgeLongitude(lat, lng, radius)],
			center: [round6(lat), round6(lng)],
			radius,
		};
	}

	if (shape.kind === "rectangle") {
		const [[south, west], [north, east]] = shape.bounds;
		const latitudes = [round6(north), round6(north), round6(south), round6(south)];
		const longitudes = [round6(west), round6(east), round6(east), round6(west)];
		return {
			latitudes,
			longitudes,
			center: [round6((north + south) / 2), round6((east + west) / 2)],
			radius: 0,
		};
	}

	const latitudes = shape.points.map(([lat]) => round6(lat));
	const longitudes = shape.points.map(([, lng]) => round6(lng));
	const centerLat = latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length;
	const centerLng = longitudes.reduce((sum, value) => sum + value, 0) / longitudes.length;
	return {
		latitudes,
		longitudes,
		center: [round6(centerLat), round6(centerLng)],
		radius: 0,
	};
};

const shapeFromInitial = (initialValues?: Geofence): DrawnShape | null => {
	const latitudes = initialValues?.latitude ?? [];
	const longitudes = initialValues?.longitude ?? [];
	if (!latitudes.length || latitudes.length !== longitudes.length) return null;

	const kind = (initialValues?.shapes || "").toLowerCase();
	if (kind === Shapes.CIRCLE || kind === "circle" || latitudes.length <= 2) {
		const radius = Math.max(
			1,
			Number(initialValues?.radius) || radiusFromPoints(latitudes, longitudes) || 500,
		);
		return { kind: "circle", center: [latitudes[0], longitudes[0]], radius };
	}
	if (kind === Shapes.RECTANGLE || latitudes.length === 4) {
		const south = Math.min(...latitudes);
		const north = Math.max(...latitudes);
		const west = Math.min(...longitudes);
		const east = Math.max(...longitudes);
		return { kind: "rectangle", bounds: [[south, west], [north, east]] };
	}
	return {
		kind: "polygon",
		points: latitudes.map((lat, index) => [lat, longitudes[index]] as [number, number]),
	};
};

function MapEvents({
	enabled,
	onPick,
}: {
	enabled: boolean;
	onPick: (lat: number, lng: number) => void;
}) {
	useMapEvents({
		click(event) {
			if (!enabled) return;
			onPick(event.latlng.lat, event.latlng.lng);
		},
	});
	return null;
}

function MapSize({ expanded }: { expanded: boolean }) {
	const map = useMap();
	useEffect(() => {
		const id = window.setTimeout(() => map.invalidateSize(), 60);
		return () => window.clearTimeout(id);
	}, [expanded, map]);
	return null;
}

function Recenter({ lat, lng, enabled }: { lat: number; lng: number; enabled: boolean }) {
	const map = useMap();
	useEffect(() => {
		if (!enabled) return;
		map.panTo([lat, lng]);
	}, [lat, lng, map, enabled]);
	return null;
}

function MapDragControl({ enabled }: { enabled: boolean }) {
	const map = useMap();
	useEffect(() => {
		if (enabled) map.dragging.enable();
		else map.dragging.disable();
	}, [enabled, map]);
	return null;
}

function DrawController({
	tool,
	shape,
	onShapeChange,
}: {
	tool: DrawTool;
	shape: DrawnShape | null;
	onShapeChange: (next: DrawnShape | null) => void;
}) {
	const map = useMap();
	const startRef = useRef<L.LatLng | null>(null);
	const draftRef = useRef<L.Layer | null>(null);
	const polygonDraftRef = useRef<[number, number][]>([]);
	const vertexLayerRef = useRef<L.LayerGroup | null>(null);

	const clearDraft = () => {
		if (draftRef.current) {
			map.removeLayer(draftRef.current);
			draftRef.current = null;
		}
	};

	const clearVertices = () => {
		if (vertexLayerRef.current) {
			map.removeLayer(vertexLayerRef.current);
			vertexLayerRef.current = null;
		}
	};

	const renderPolygonVertices = (points: [number, number][]) => {
		clearVertices();
		const group = L.layerGroup().addTo(map);
		points.forEach(([lat, lng]) => {
			L.circleMarker([lat, lng], {
				radius: 4,
				color: "#22d3ee",
				weight: 2,
				fillColor: "#fff",
				fillOpacity: 1,
			}).addTo(group);
		});
		vertexLayerRef.current = group;
	};

	useEffect(() => {
		startRef.current = null;
		polygonDraftRef.current = [];
		clearDraft();
		clearVertices();
		map.getContainer().style.cursor = tool === "pan" ? "" : "crosshair";
		return () => {
			clearDraft();
			clearVertices();
			map.getContainer().style.cursor = "";
		};
	}, [tool, map]);

	useMapEvents({
		mousedown(event) {
			if (tool !== "circle" && tool !== "rectangle") return;
			if ((event.originalEvent.target as HTMLElement | null)?.closest(".leaflet-marker-icon")) return;
			startRef.current = event.latlng;
			map.dragging.disable();
			clearDraft();
		},
		mousemove(event) {
			if (!startRef.current || (tool !== "circle" && tool !== "rectangle")) return;
			clearDraft();
			if (tool === "circle") {
				const radius = map.distance(startRef.current, event.latlng);
				draftRef.current = L.circle(startRef.current, { ...shapeStyle, radius }).addTo(map);
				return;
			}
			draftRef.current = L.rectangle(L.latLngBounds(startRef.current, event.latlng), shapeStyle).addTo(map);
		},
		mouseup(event) {
			if (!startRef.current || (tool !== "circle" && tool !== "rectangle")) return;
			const start = startRef.current;
			startRef.current = null;
			clearDraft();

			if (tool === "circle") {
				const radius = map.distance(start, event.latlng);
				if (radius < 5) return;
				onShapeChange({ kind: "circle", center: [start.lat, start.lng], radius });
				return;
			}

			const bounds = L.latLngBounds(start, event.latlng);
			if (bounds.getSouthWest().equals(bounds.getNorthEast())) return;
			onShapeChange({
				kind: "rectangle",
				bounds: [
					[bounds.getSouth(), bounds.getWest()],
					[bounds.getNorth(), bounds.getEast()],
				],
			});
		},
		click(event) {
			if (tool !== "polygon") return;
			if ((event.originalEvent.target as HTMLElement | null)?.closest(".leaflet-marker-icon")) return;
			const next = [...polygonDraftRef.current, [event.latlng.lat, event.latlng.lng] as [number, number]];
			polygonDraftRef.current = next;
			renderPolygonVertices(next);
			clearDraft();
			if (next.length >= 2) {
				draftRef.current = L.polyline(next, { color: "#22d3ee", weight: 2, dashArray: "4 4" }).addTo(map);
			}
		},
		dblclick(event) {
			if (tool !== "polygon") return;
			L.DomEvent.stop(event);
			const points = polygonDraftRef.current;
			polygonDraftRef.current = [];
			clearDraft();
			clearVertices();
			if (points.length < 3) return;
			onShapeChange({ kind: "polygon", points });
		},
	});

	return (
		<>
			{shape?.kind === "circle" ? (
				<LeafletCircle center={shape.center} radius={shape.radius} pathOptions={shapeStyle} />
			) : null}
			{shape?.kind === "rectangle" ? (
				<LeafletRectangle bounds={shape.bounds} pathOptions={shapeStyle} />
			) : null}
			{shape?.kind === "polygon" ? (
				<LeafletPolygon positions={shape.points} pathOptions={shapeStyle} />
			) : null}
		</>
	);
}

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
	const [assignType, setAssignType] = useState(initialValues?.assignType ?? "transporter");
	const [geoType, setGeoType] = useState(initialValues?.geoType || geoTypeOptions[0]);
	const [geofenceCode, setGeofenceCode] = useState(initialValues?.geofenceCode ?? "");
	const [transitTime, setTransitTime] = useState(initialValues?.transitTime ?? "20");
	const [latitude, setLatitude] = useState(
		initialValues?.latitude[0]?.toString() ?? defaultCenter.lat.toFixed(6),
	);
	const [longitude, setLongitude] = useState(
		initialValues?.longitude[0]?.toString() ?? defaultCenter.lng.toFixed(6),
	);
	const [radius, setRadius] = useState(() => {
		const initialShape = shapeFromInitial(initialValues);
		if (initialShape?.kind === "circle") return String(Math.round(initialShape.radius));
		if (initialValues?.radius) return String(initialValues.radius);
		return "";
	});
	const [status, setStatus] = useState(
		initialValues?.status.toLowerCase() === "inactive" ? "inactive" : "active",
	);
	const [reason, setReason] = useState(initialValues?.reason ?? "");
	const [mapMode, setMapMode] = useState<"map" | "satellite">("map");
	const [expanded, setExpanded] = useState(false);
	const [formError, setFormError] = useState("");
	const [drawTool, setDrawTool] = useState<DrawTool>("pan");
	const [drawnShape, setDrawnShape] = useState<DrawnShape | null>(() => shapeFromInitial(initialValues));
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
			const initialMatch = initialValues?.type
				? geoTypes.find((option) => option.id === initialValues.type || option.externalId === initialValues.type)
				: undefined;
			return initialMatch?.id ?? geoTypes[0].id;
		});
	}, [geoTypes, initialValues?.type]);

	const lat = parseCoord(latitude, defaultCenter.lat);
	const lng = parseCoord(longitude, defaultCenter.lng);
	const tile = tiles[mapMode];
	const shapeCoords = useMemo(() => coordsFromShape(drawnShape), [drawnShape]);

	const inputClass = `h-[37px] w-full rounded-lg border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `block min-w-0 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const applyCoordinates = (nextLat: number, nextLng: number) => {
		const fixedLat = nextLat.toFixed(6);
		const fixedLng = nextLng.toFixed(6);
		setLatitude(fixedLat);
		setLongitude(fixedLng);
		setFollowMarker(true);
		setFormError("");
	};

	const moveMarker = (nextLat: number, nextLng: number) => {
		applyCoordinates(nextLat, nextLng);
	};

	const stopDrawing = () => {
		setDrawTool("pan");
		setFollowMarker(false);
	};

	const handleShapeChange = (next: DrawnShape | null) => {
		setDrawnShape(next);
		const coords = coordsFromShape(next);
		if (coords.center) {
			applyCoordinates(coords.center[0], coords.center[1]);
		}
		if (next?.kind === "circle") {
			setRadius(String(coords.radius));
		} else if (!next) {
			setRadius("");
		}
		if (next) stopDrawing();
	};

	const applyRadius = (value: string) => {
		setRadius(value);
		setFormError("");
		const meters = Number(value);
		if (!Number.isFinite(meters) || meters <= 0) return;
		const center: [number, number] = [
			parseCoord(latitude, defaultCenter.lat),
			parseCoord(longitude, defaultCenter.lng),
		];
		setDrawnShape({ kind: "circle", center, radius: meters });
		stopDrawing();
	};

	const clearShape = () => {
		setDrawnShape(null);
		setRadius("");
		stopDrawing();
		setFormError("");
	};

	const tools: { id: DrawTool | "delete"; label: string; icon: typeof Circle }[] = [
		{ id: "circle", label: "Draw circle", icon: Circle },
		{ id: "rectangle", label: "Draw rectangle", icon: Square },
		{ id: "polygon", label: "Draw polygon", icon: Pentagon },
		{ id: "delete", label: "Clear shape", icon: Trash2 },
	];

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (
			!name.trim() ||
			!type.trim() ||
			!assignType.trim() ||
			!geoType.trim() ||
			!transitTime ||
			!Number.isFinite(Number(latitude)) ||
			!Number.isFinite(Number(longitude))
		) {
			setFormError("Complete all required fields before saving.");
			return;
		}
		if (!drawnShape || !shapeCoords.latitudes.length || !shapeCoords.longitudes.length) {
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
			transitTime,
			shapes: shapeValue(drawnShape.kind),
			geoType,
			latitude: shapeCoords.latitudes,
			longitude: shapeCoords.longitudes,
			radius: shapeCoords.radius,
			...(geofenceCode.trim() ? { geofenceCode: geofenceCode.trim() } : {}),
			...(status ? { status } : {}),
			...(reason.trim() ? { reason: reason.trim() } : {}),
		});
	};

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
						<p className={`mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-cyan-200/70" : "text-cyan-700"}`}>Fleet operations</p>
						<h2 id={titleId} className="text-[15px] font-semibold">{initialValues ? "Edit Geofence" : "Add Geofence"}</h2>
					</div>
					<button type="button" onClick={onClose} aria-label="Close geofence form" className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/[0.06] hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
						<X className="h-5 w-5 stroke-[3]" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
					{formError && (
						<p role="alert" className={`mb-4 rounded-lg border px-3 py-2 text-[12px] ${isDark ? "border-rose-400/20 bg-rose-400/[0.08] text-rose-200" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
							{formError}
						</p>
					)}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
						<div>
							<p className={`text-[12px] font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Location map</p>
							<p className="mb-3 mt-1 text-[11px] text-slate-500">
								Use the tools to draw an area. Circle/rectangle: click and drag. Polygon: click points, double-click to finish.
							</p>
							<div className={`relative overflow-hidden rounded-xl border ${expanded ? "h-[460px]" : "h-[320px]"} ${isDark ? "border-white/[0.08]" : "border-slate-200"} ${mapMode === "map" ? "[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_brightness(0.82)_contrast(0.92)]" : ""}`}>
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
									{tools.map((tool) => {
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
													setDrawTool(tool.id);
													setFollowMarker(false);
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
								<button type="button" onClick={() => setExpanded((open) => !open)} aria-label="Expand map" className="absolute right-3 top-3 z-[500] flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#07142f]/90 text-slate-200 shadow-lg backdrop-blur-md hover:text-cyan-100">
									<Maximize2 className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:content-start">
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Name <span className="text-rose-400">*</span></span>
								<input required value={name} onChange={(event) => { setName(event.target.value); setFormError(""); }} className={inputClass} />
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Geofence Type <span className="text-rose-400">*</span></span>
								<span className="relative block">
									<select
										required
										value={type}
										disabled={geoTypesLoading || geoTypesError || geoTypes.length === 0}
										onChange={(event) => { setType(event.target.value); setFormError(""); }}
										className={`${inputClass} appearance-none pr-8 disabled:cursor-not-allowed disabled:opacity-60`}
									>
										<option value="">
											{geoTypesLoading
												? "Loading geo types..."
												: geoTypesError
													? "Could not load geo types"
													: geoTypes.length === 0
														? "No geo types available"
														: "Select geo type"}
										</option>
										{geoTypes.map((option) => (
											<option key={option.id} value={option.id}>{option.name}</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
								</span>
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Assign Type <span className="text-rose-400">*</span></span>
								<select required value={assignType} onChange={(event) => setAssignType(event.target.value)} className={inputClass}>
									{assignTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
								</select>
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Geo Type <span className="text-rose-400">*</span></span>
								<select required value={geoType} onChange={(event) => setGeoType(event.target.value)} className={inputClass}>
									{geoTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
								</select>
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Geofence Code <span className="font-normal text-slate-500">(Optional)</span></span>
								<input value={geofenceCode} onChange={(event) => { setGeofenceCode(event.target.value); setFormError(""); }} className={inputClass} />
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Transit Time <span className="text-rose-400">*</span></span>
								<input required type="number" min={1} value={transitTime} onChange={(event) => { setTransitTime(event.target.value); setFormError(""); }} className={inputClass} />
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Radius (m) <span className="font-normal text-slate-500">(sets circle)</span></span>
								<input
									type="number"
									min={1}
									step="1"
									value={radius}
									onChange={(event) => applyRadius(event.target.value)}
									placeholder="e.g. 500"
									className={inputClass}
								/>
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Latitude <span className="text-rose-400">*</span></span>
								<input
									required
									type="number"
									step="any"
									value={latitude}
									onChange={(event) => {
										const nextLat = event.target.value;
										setLatitude(nextLat);
										setFollowMarker(true);
										setFormError("");
										const meters = Number(radius);
										if (!Number.isFinite(meters) || meters <= 0) return;
										setDrawnShape({
											kind: "circle",
											center: [parseCoord(nextLat, defaultCenter.lat), parseCoord(longitude, defaultCenter.lng)],
											radius: meters,
										});
									}}
									className={inputClass}
								/>
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Longitude <span className="text-rose-400">*</span></span>
								<input
									required
									type="number"
									step="any"
									value={longitude}
									onChange={(event) => {
										const nextLng = event.target.value;
										setLongitude(nextLng);
										setFollowMarker(true);
										setFormError("");
										const meters = Number(radius);
										if (!Number.isFinite(meters) || meters <= 0) return;
										setDrawnShape({
											kind: "circle",
											center: [parseCoord(latitude, defaultCenter.lat), parseCoord(nextLng, defaultCenter.lng)],
											radius: meters,
										});
									}}
									className={inputClass}
								/>
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Status <span className="text-rose-400">*</span></span>
								<select required value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
									{statusOptions.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
								</select>
							</label>
							<label className={`${labelClass} sm:col-span-2`}>
								<span className="mb-1.5 flex items-center gap-1">Reason <span className="text-rose-400">*</span></span>
								<textarea required value={reason} rows={3} onChange={(event) => { setReason(event.target.value); setFormError(""); }} className={`${inputClass} h-auto py-2`} />
							</label>
						</div>
					</div>
				</div>

				<footer className={`flex shrink-0 justify-center border-t px-5 py-4 ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
					<button type="submit" disabled={isSaving} className={`flex h-9 min-w-[140px] items-center justify-center gap-2 rounded-lg border px-6 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						{isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						{isSaving ? "Saving..." : initialValues ? "Save Changes" : "Add"}
					</button>
				</footer>
			</form>
		</div>
	);
}
