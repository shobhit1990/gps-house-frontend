import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers3, LocateFixed } from "lucide-react";
import type { VehicleRow } from "@/components/data/vehicles";

type VehicleMapProps = {
  vehicles: VehicleRow[];
  selectedVehicleSn?: number | null;
  onVehicleSelect?: (sn: number) => void;
  focusZoom?: number;
  showPopup?: boolean;
  lockFitOnSelect?: boolean;
};

function statusColor(vehicle: VehicleRow) {
  if (vehicle.status === "running") return "#34d399";
  if (vehicle.status === "stopped") return "#fb7185";
  if (vehicle.status === "unreachable") return "#22d3ee";
  if (vehicle.status === "overspeed") return "#fb923c";
  if (vehicle.status === "idle") return "#fbbf24";
  return vehicle.color;
}

function vehicleGlyphSvg(kind: VehicleRow["kind"]) {
  if (kind === "bike") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h3"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
}

function markerIcon(vehicle: VehicleRow, selected: boolean) {
  const color = statusColor(vehicle);
  const size = selected ? 46 : 38;
  const ring = selected ? "0 0 0 3px rgba(103,232,249,.55), 0 10px 28px rgba(0,0,0,.45)" : "0 8px 20px rgba(3,9,28,.45)";

  return L.divIcon({
    className: "",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 2],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))">
        <div style="width:${size}px;height:${size}px;border-radius:16px;background:linear-gradient(145deg,${color},#0b1730);color:#fff;display:flex;align-items:center;justify-content:center;border:${selected ? "2px solid #67e8f9" : "1px solid rgba(255,255,255,.55)"};box-shadow:${ring}">
          ${vehicleGlyphSvg(vehicle.kind)}
        </div>
        <div style="width:10px;height:10px;margin-top:-5px;background:linear-gradient(145deg,${color},#0b1730);transform:rotate(45deg);border-right:1px solid rgba(255,255,255,.35);border-bottom:1px solid rgba(255,255,255,.35)"></div>
      </div>
    `,
  });
}

function FitVehicles({
  vehicles,
  selectedVehicleSn,
  lockFitOnSelect,
}: {
  vehicles: VehicleRow[];
  selectedVehicleSn?: number | null;
  lockFitOnSelect?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (vehicles.length === 0) return;
    if (lockFitOnSelect && selectedVehicleSn != null) return;
    const bounds = L.latLngBounds(vehicles.map((vehicle) => [vehicle.lat, vehicle.lng]));
    map.fitBounds(bounds.pad(0.35));
  }, [map, vehicles, selectedVehicleSn, lockFitOnSelect]);

  return null;
}

function FocusVehicle({
  vehicles,
  selectedVehicleSn,
  focusZoom = 9,
}: {
  vehicles: VehicleRow[];
  selectedVehicleSn?: number | null;
  focusZoom?: number;
}) {
  const map = useMap();
  const ready = useRef(false);

  useEffect(() => {
    const selected = vehicles.find((vehicle) => vehicle.sn === selectedVehicleSn);

    if (!ready.current) {
      ready.current = true;
      return;
    }

    if (!selected || selectedVehicleSn == null) return;

    map.flyTo([selected.lat, selected.lng], focusZoom, {
      duration: 0.75,
    });
  }, [map, selectedVehicleSn, vehicles, focusZoom]);

  return null;
}

export function VehicleMap({
  vehicles,
  selectedVehicleSn = null,
  onVehicleSelect,
  focusZoom = 9,
  showPopup = false,
  lockFitOnSelect = false,
}: VehicleMapProps) {
  const selected = vehicles.find((vehicle) => vehicle.sn === selectedVehicleSn) ?? null;

  return (
    <div className="vehicle-map relative h-full w-full">
      <MapContainer
        center={[26.85, 81.2]}
        zoom={8}
        zoomControl={false}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        <FitVehicles
          vehicles={vehicles}
          selectedVehicleSn={selectedVehicleSn}
          lockFitOnSelect={lockFitOnSelect}
        />
        <FocusVehicle
          vehicles={vehicles}
          selectedVehicleSn={selectedVehicleSn}
          focusZoom={focusZoom}
        />
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.sn}
            position={[vehicle.lat, vehicle.lng]}
            icon={markerIcon(vehicle, vehicle.sn === selectedVehicleSn)}
            eventHandlers={{
              click: () => onVehicleSelect?.(vehicle.sn),
            }}
            title={vehicle.vehicle}
          />
        ))}
      </MapContainer>

      {showPopup && selected && (
        <div className="pointer-events-none absolute left-1/2 top-[42%] z-[1100] w-[min(280px,70vw)] -translate-x-1/2 -translate-y-full">
          <div className="rounded-2xl border border-white/20 bg-[#07142f]/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <p className="text-[11px] font-semibold text-white">{selected.vehicle}</p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-300">
              {selected.address}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-slate-400">
              <span>{selected.updatedAt}</span>
              <span
                className={
                  selected.ignition
                    ? "font-medium text-emerald-300"
                    : "font-medium text-rose-300"
                }
              >
                Ignition {selected.ignition ? "on" : "off"}
              </span>
            </div>
          </div>
          <div className="mx-auto h-3 w-3 -translate-y-1.5 rotate-45 border-b border-r border-white/20 bg-[#07142f]/95" />
        </div>
      )}

      <button
        type="button"
        className="absolute right-3 top-3 z-[500] flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-[#07142f]/90 text-cyan-100 shadow-lg backdrop-blur-md transition hover:border-cyan-200/40 hover:bg-[#10234a]"
        aria-label="Map settings"
      >
        <Layers3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="absolute right-3 top-[54px] z-[500] flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-[#07142f]/90 text-cyan-100 shadow-lg backdrop-blur-md transition hover:border-cyan-200/40 hover:bg-[#10234a]"
        aria-label="Center map"
      >
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  );
}
