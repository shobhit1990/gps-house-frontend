import { useEffect, useRef } from "react";
import { MapContainer, Marker, Polyline, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers3, LocateFixed } from "lucide-react";
import type { VehicleRow } from "@/components/data/vehicles";
import { getVehicleStatusImage } from "@/lib/vehicleStatusImage";

type RoutePoint = [number, number];

type VehicleMapProps = {
  vehicles: VehicleRow[];
  selectedVehicleSn?: number | null;
  onVehicleSelect?: (sn: number) => void;
  focusZoom?: number;
  showPopup?: boolean;
  lockFitOnSelect?: boolean;
  /** Historical path to draw on the map. */
  routePath?: RoutePoint[] | null;
};

const isValidLatLng = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng);

const hasValidCoords = (vehicle: VehicleRow) => isValidLatLng(vehicle.lat, vehicle.lng);

const isValidRoutePoint = (point: RoutePoint) => isValidLatLng(point[0], point[1]);

function markerIcon(vehicle: VehicleRow, selected: boolean) {
  const size = selected ? 52 : 42;
  const img = getVehicleStatusImage(vehicle.kind, vehicle.status);
  const shadow = selected
    ? "0 10px 28px rgba(0,0,0,.45)"
    : "0 8px 20px rgba(3,9,28,.45)";

  return L.divIcon({
    className: "vehicle-status-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="width:${size}px;height:${size}px;background:transparent;border:none;filter:drop-shadow(${shadow});display:flex;align-items:center;justify-content:center">
        <img src="${img}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;pointer-events:none;background:transparent" draggable="false" />
      </div>
    `,
  });
}

function FitVehicles({
  vehicles,
  selectedVehicleSn,
  lockFitOnSelect,
  hasRoute,
}: {
  vehicles: VehicleRow[];
  selectedVehicleSn?: number | null;
  lockFitOnSelect?: boolean;
  hasRoute?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (hasRoute) return;
    const mappable = vehicles.filter(hasValidCoords);
    if (mappable.length === 0) return;
    if (lockFitOnSelect && selectedVehicleSn != null) return;
    const bounds = L.latLngBounds(mappable.map((vehicle) => [vehicle.lat, vehicle.lng] as RoutePoint));
    map.fitBounds(bounds.pad(0.35));
  }, [map, vehicles, selectedVehicleSn, lockFitOnSelect, hasRoute]);

  return null;
}

function FitRoute({ routePath }: { routePath: RoutePoint[] }) {
  const map = useMap();

  useEffect(() => {
    const points = routePath.filter(isValidRoutePoint);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo(points[0], 16, { duration: 0.75 });
      return;
    }
    const bounds = L.latLngBounds(points);
    map.flyToBounds(bounds.pad(0.2), { duration: 0.75 });
  }, [map, routePath]);

  return null;
}

function routeEndpointIcon(kind: "start" | "end") {
  const color = kind === "start" ? "#22c55e" : "#ef4444";
  const label = kind === "start" ? "S" : "E";
  return L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border-radius:999px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font:700 11px/1 sans-serif;border:2px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.35)">${label}</div>`,
  });
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

    if (!selected || selectedVehicleSn == null || !hasValidCoords(selected)) return;

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
  routePath = null,
}: VehicleMapProps) {
  const mappableVehicles = vehicles.filter(hasValidCoords);
  const selected = vehicles.find((vehicle) => vehicle.sn === selectedVehicleSn) ?? null;
  const validRoutePath = (routePath ?? []).filter(isValidRoutePoint);
  const hasRoute = validRoutePath.length > 0;
  const routeStart = hasRoute ? validRoutePath[0] : null;
  const routeEnd = hasRoute ? validRoutePath[validRoutePath.length - 1] : null;

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
          vehicles={mappableVehicles}
          selectedVehicleSn={selectedVehicleSn}
          lockFitOnSelect={lockFitOnSelect}
          hasRoute={hasRoute}
        />
        {!hasRoute && (
          <FocusVehicle
            vehicles={mappableVehicles}
            selectedVehicleSn={selectedVehicleSn}
            focusZoom={focusZoom}
          />
        )}
        {hasRoute && <FitRoute routePath={validRoutePath} />}
        {hasRoute && (
          <Polyline
            positions={validRoutePath}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }}
          />
        )}
        {routeStart && (
          <Marker position={routeStart} icon={routeEndpointIcon("start")} interactive={false} />
        )}
        {routeEnd && validRoutePath.length > 1 && (
          <Marker position={routeEnd} icon={routeEndpointIcon("end")} interactive={false} />
        )}
        {!hasRoute &&
          mappableVehicles.map((vehicle) => (
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
        <div className="pointer-events-none absolute left-1/2 top-[42%] z-[1100] w-[min(168px,52vw)] -translate-x-1/2 -translate-y-full">
          <div className="rounded-xl border border-white/20 bg-[#07142f]/95 px-2.5 py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <p className="truncate text-[10px] font-semibold text-white">{selected.vehicle}</p>
            <p className="mt-0.5 line-clamp-1 text-[8px] leading-snug text-slate-300">
              {selected.address}
            </p>
            <div className="mt-1 flex items-center justify-between gap-1.5 text-[8px] text-slate-400">
              <span className="truncate">{selected.updatedAt}</span>
              <span
                className={
                  selected.ignition
                    ? "shrink-0 font-medium text-emerald-300"
                    : "shrink-0 font-medium text-rose-300"
                }
              >
                Ign {selected.ignition ? "on" : "off"}
              </span>
            </div>
          </div>
          <div className="mx-auto h-2.5 w-2.5 -translate-y-1 rotate-45 border-b border-r border-white/20 bg-[#07142f]/95" />
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
