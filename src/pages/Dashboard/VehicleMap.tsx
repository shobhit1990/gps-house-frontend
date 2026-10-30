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
};

function markerIcon(vehicle: VehicleRow, selected: boolean) {
  const color = vehicle.color;
  const size = selected ? 42 : 34;

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:15px;background:linear-gradient(145deg,${color},#15213f);color:#fff;display:flex;align-items:center;justify-content:center;font:700 11px Arial,sans-serif;border:${selected ? "2px solid #67e8f9" : "1px solid rgba(255,255,255,.78)"};box-shadow:0 4px 18px ${selected ? "rgba(34,211,238,.55)" : "rgba(3,9,28,.48)"};transform:rotate(-4deg)"><span style="transform:rotate(4deg)">${vehicle.sn}</span></div>`,
  });
}

function FitVehicles({ vehicles }: { vehicles: VehicleRow[] }) {
  const map = useMap();

  useEffect(() => {
    if (vehicles.length === 0) return;
    const bounds = L.latLngBounds(vehicles.map((vehicle) => [vehicle.lat, vehicle.lng]));
    map.fitBounds(bounds.pad(0.35));
  }, [map, vehicles]);

  return null;
}

function FocusVehicle({
  vehicles,
  selectedVehicleSn,
}: {
  vehicles: VehicleRow[];
  selectedVehicleSn?: number | null;
}) {
  const map = useMap();
  const hasFocusedSelection = useRef(false);

  useEffect(() => {
    const selected = vehicles.find((vehicle) => vehicle.sn === selectedVehicleSn);
    if (!hasFocusedSelection.current) {
      hasFocusedSelection.current = true;
      return;
    }
    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 9), {
        duration: 0.6,
      });
    }
  }, [map, selectedVehicleSn, vehicles]);

  return null;
}

export function VehicleMap({
  vehicles,
  selectedVehicleSn = null,
  onVehicleSelect,
}: VehicleMapProps) {

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
        <FitVehicles vehicles={vehicles} />
        <FocusVehicle
          vehicles={vehicles}
          selectedVehicleSn={selectedVehicleSn}
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
