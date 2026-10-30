import { useEffect, useId, useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, X } from "lucide-react";

export type GeofenceFormValues = {
	name: string;
	radius: string;
	latitude: string;
	longitude: string;
	address: string;
	status: string;
};

type AddGeofenceProps = {
	onClose: () => void;
	onSubmit: (values: GeofenceFormValues) => void;
};

const defaultCenter = { lat: 26.4658, lng: 80.3498 };
const statusOptions = ["Active", "Inactive"];

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

function MapEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
	useMapEvents({
		click(event) {
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

function Recenter({ lat, lng }: { lat: number; lng: number }) {
	const map = useMap();
	useEffect(() => {
		map.panTo([lat, lng]);
	}, [lat, lng, map]);
	return null;
}

export function AddGeofence({ onClose, onSubmit }: AddGeofenceProps) {
	const { theme } = useTheme();
	const isDark = theme !== "light";
	const titleId = useId();
	const [name, setName] = useState("");
	const [radius, setRadius] = useState("500");
	const [latitude, setLatitude] = useState(defaultCenter.lat.toFixed(6));
	const [longitude, setLongitude] = useState(defaultCenter.lng.toFixed(6));
	const [address, setAddress] = useState("");
	const [status, setStatus] = useState("Active");
	const [mapMode, setMapMode] = useState<"map" | "satellite">("map");
	const [expanded, setExpanded] = useState(false);
	const [formError, setFormError] = useState("");

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const lat = parseCoord(latitude, defaultCenter.lat);
	const lng = parseCoord(longitude, defaultCenter.lng);
	const radiusMeters = Math.max(1, Number(radius) || 500);
	const tile = tiles[mapMode];

	const inputClass = `h-[37px] w-full rounded-lg border px-3 text-[12px] font-normal outline-none transition focus:ring-2 ${
		isDark
			? "border-white/[0.09] bg-[#03091c]/70 text-white placeholder:text-slate-500 focus:border-cyan-300/35 focus:ring-cyan-300/[0.08]"
			: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-100"
	}`;
	const labelClass = `block min-w-0 text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`;

	const moveMarker = (nextLat: number, nextLng: number) => {
		setLatitude(nextLat.toFixed(6));
		setLongitude(nextLng.toFixed(6));
		setFormError("");
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!name.trim() || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || !status) {
			setFormError("Name, Latitude, Longitude, and Status are required.");
			return;
		}
		onSubmit({
			name: name.trim(),
			radius: radius.trim() || "500",
			latitude: Number(latitude).toFixed(6),
			longitude: Number(longitude).toFixed(6),
			address: address.trim(),
			status,
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
						<h2 id={titleId} className="text-[15px] font-semibold">Add Geofence</h2>
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
							<p className="mb-3 mt-1 text-[11px] text-slate-500">Click or drag the marker to set coordinates (follows Map Type in General Settings).</p>
							<div className={`relative overflow-hidden rounded-xl border ${expanded ? "h-[460px]" : "h-[320px]"} ${isDark ? "border-white/[0.08]" : "border-slate-200"} ${mapMode === "map" ? "[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_brightness(0.82)_contrast(0.92)]" : ""}`}>
								<MapContainer center={[lat, lng]} zoom={15} zoomControl={false} className="h-full w-full" scrollWheelZoom>
									<TileLayer key={mapMode} attribution={tile.attribution} url={tile.url} />
									<MapSize expanded={expanded} />
									<Recenter lat={lat} lng={lng} />
									<MapEvents onPick={moveMarker} />
									<Circle center={[lat, lng]} radius={radiusMeters} pathOptions={{ color: "#67e8f9", fillColor: "#22d3ee", fillOpacity: 0.16, weight: 2 }} />
									<Marker
										position={[lat, lng]}
										icon={pinIcon}
										draggable
										eventHandlers={{
											dragend: (event) => {
												const point = event.target.getLatLng();
												moveMarker(point.lat, point.lng);
											},
										}}
									/>
								</MapContainer>
								<div className="absolute left-3 top-3 z-[500] flex overflow-hidden rounded-lg border border-white/15 bg-[#07142f]/90 text-[11px] font-semibold shadow-lg backdrop-blur-md">
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
								<span className="mb-1.5 block">Radius</span>
								<input type="number" min={1} value={radius} onChange={(event) => setRadius(event.target.value)} className={inputClass} />
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Latitude <span className="text-rose-400">*</span></span>
								<input required value={latitude} onChange={(event) => { setLatitude(event.target.value); setFormError(""); }} className={inputClass} />
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Longitude <span className="text-rose-400">*</span></span>
								<input required value={longitude} onChange={(event) => { setLongitude(event.target.value); setFormError(""); }} className={inputClass} />
							</label>
							<label className={`${labelClass} sm:col-span-2`}>
								<span className="mb-1.5 block">Address</span>
								<textarea value={address} rows={3} onChange={(event) => setAddress(event.target.value)} className={`${inputClass} h-auto py-2`} />
							</label>
							<label className={labelClass}>
								<span className="mb-1.5 flex items-center gap-1">Status <span className="text-rose-400">*</span></span>
								<select required value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
									{statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
								</select>
							</label>
						</div>
					</div>
				</div>

				<footer className={`flex shrink-0 justify-center border-t px-5 py-4 ${isDark ? "border-white/[0.08]" : "border-slate-200"}`}>
					<button type="submit" className={`h-9 min-w-[120px] rounded-lg border px-6 text-[12px] font-semibold transition ${isDark ? "border-cyan-300/25 bg-cyan-300/[0.10] text-cyan-100 hover:bg-cyan-300/[0.16]" : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"}`}>
						Add
					</button>
				</footer>
			</form>
		</div>
	);
}
