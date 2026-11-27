import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Polyline, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { VehicleKind, VehicleStatus } from "@/components/data/vehicles";
import { getVehicleStatusImage } from "@/lib/vehicleStatusImage";
import startGreenFlag from "@/assets/start_greenflag.png";
import completeRedFlag from "@/assets/complete_Red.png";
import carRunningPlayback from "@/assets/car_running_topdown.png";

type RoutePoint = [number, number];
type BaseLayer = "street" | "satellite";

type HistoryRouteMapProps = {
  routePath: RoutePoint[] | null;
  playing: boolean;
  /** Distance traveled along route in meters (constant-speed playback). */
  distanceM: number;
  /** Playback multiplier: 1 = normal, higher values speed up playback. */
  playbackSpeed?: 1 | 2 | 4 | 8 | 16;
  vehicleKind?: VehicleKind;
  vehicleStatus?: VehicleStatus;
  baseLayer: BaseLayer;
  showTraffic: boolean;
  onDistanceChange: (distanceM: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onRouteMeta?: (meta: { totalDistanceM: number }) => void;
};

export type { BaseLayer };

const GOOGLE_SUBDOMAINS = ["0", "1", "2", "3"] as const;

const TILES = {
  street: {
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google</a>',
    subdomains: GOOGLE_SUBDOMAINS,
  },
  satellite: {
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google</a>',
    subdomains: GOOGLE_SUBDOMAINS,
  },
  traffic: {
    url: "https://mt{s}.google.com/vt?lyrs=h@159000000,traffic&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://maps.google.com">Google</a>',
    subdomains: GOOGLE_SUBDOMAINS,
  },
};

const ROUTE_COLOR = "#94a3b8";
const TRAVELED_COLOR = "#a78bfa";
const PLAYBACK_ZOOM = 17;
/** Base visual pace at 1x (meters per second). Higher speeds multiply this. */
const METERS_PER_SEC_1X = 12;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

const haversineMeters = (a: RoutePoint, b: RoutePoint) => {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Compass bearing from A → B in degrees (0 = north, clockwise). */
const bearingDegrees = (from: RoutePoint, to: RoutePoint) => {
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const dLng = toRad(to[1] - from[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/**
 * Default nose direction in the asset (degrees from image-up / north).
 * Top-down car sprite faces up (~0°); bike sprites face left (~270°).
 */
const iconNoseBearing = (kind: VehicleKind) => (kind === "bike" ? 270 : 0);

const buildCumulative = (path: RoutePoint[]) => {
  const cum = [0];
  for (let i = 1; i < path.length; i += 1) {
    cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]));
  }
  return cum;
};

const lerpPoint = (a: RoutePoint, b: RoutePoint, t: number): RoutePoint => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/** Position + heading + polyline points covered at a given distance along the path. */
const sampleAtDistance = (path: RoutePoint[], cum: number[], distanceM: number) => {
  const total = cum[cum.length - 1] ?? 0;
  const target = Math.max(0, Math.min(distanceM, total));
  const empty = {
    position: path[0] ?? null,
    traveled: path.slice(0, 1) as RoutePoint[],
    heading: 0,
  };

  if (total <= 0 || path.length === 0) return empty;

  if (target <= 0) {
    const heading = path.length > 1 ? bearingDegrees(path[0], path[1]) : 0;
    return { position: path[0], traveled: [path[0]], heading };
  }

  let i = 1;
  while (i < cum.length && cum[i] < target) i += 1;
  if (i >= path.length) {
    const heading =
      path.length > 1
        ? bearingDegrees(path[path.length - 2], path[path.length - 1])
        : 0;
    return { position: path[path.length - 1], traveled: path.slice(), heading };
  }

  const from = path[i - 1];
  const to = path[i];
  const segStart = cum[i - 1];
  const segEnd = cum[i];
  const segLen = Math.max(segEnd - segStart, 0.0001);
  const t = (target - segStart) / segLen;
  const position = lerpPoint(from, to, t);
  return {
    position,
    traveled: [...path.slice(0, i), position],
    heading: bearingDegrees(from, to),
  };
};

function FitRoute({ routePath, enabled }: { routePath: RoutePoint[]; enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || routePath.length === 0) return;
    if (routePath.length === 1) {
      map.flyTo(routePath[0], 16, { duration: 0.8 });
      return;
    }
    map.flyToBounds(L.latLngBounds(routePath).pad(0.18), { duration: 0.8 });
  }, [map, routePath, enabled]);

  return null;
}

function FollowPlayback({
  position,
  active,
}: {
  position: RoutePoint | null;
  active: boolean;
}) {
  const map = useMap();
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active || !position) {
      wasActive.current = false;
      return;
    }

    if (!wasActive.current) {
      wasActive.current = true;
      map.flyTo(position, PLAYBACK_ZOOM, { duration: 0.7 });
      return;
    }

    map.panTo(position, { animate: false });
  }, [map, position, active]);

  return null;
}

function endpointIcon(kind: "start" | "end") {
  const src = kind === "start" ? startGreenFlag : completeRedFlag;
  const size = 36;
  return L.divIcon({
    className: "history-endpoint-marker",
    iconSize: [size, size],
    iconAnchor: [8, size - 2],
    html: `<div style="width:${size}px;height:${size}px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.45));display:flex;align-items:flex-end;justify-content:flex-start">
      <img src="${src}" alt="${kind === "start" ? "Start" : "End"}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;pointer-events:none;background:transparent" draggable="false" />
    </div>`,
  });
}

function playbackIcon(
  kind: VehicleKind = "car",
  status: VehicleStatus = "running",
  headingDeg = 0,
) {
  const img = kind === "car" ? carRunningPlayback : getVehicleStatusImage(kind, status);
  const size = 48;
  const rotate = headingDeg - iconNoseBearing(kind);
  return L.divIcon({
    className: "history-vehicle-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;background:transparent;border:none;filter:drop-shadow(0 6px 14px rgba(0,0,0,.4));display:flex;align-items:center;justify-content:center;transform:rotate(${rotate}deg);transform-origin:center center">
      <img src="${img}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;pointer-events:none;background:transparent" draggable="false" />
    </div>`,
  });
}

export function HistoryRouteMap({
  routePath,
  playing,
  distanceM,
  playbackSpeed = 1,
  vehicleKind = "car",
  vehicleStatus = "running",
  baseLayer,
  showTraffic,
  onDistanceChange,
  onPlayingChange,
  onRouteMeta,
}: HistoryRouteMapProps) {
  const rafRef = useRef<number | null>(null);
  const distanceRef = useRef(distanceM);
  const speedRef = useRef(playbackSpeed);
  const path = useMemo(() => routePath ?? [], [routePath]);
  const hasRoute = path.length > 1;
  const start = hasRoute ? path[0] : null;
  const end = hasRoute ? path[path.length - 1] : null;
  const base = TILES[baseLayer];

  const cumulative = useMemo(() => (hasRoute ? buildCumulative(path) : [0]), [hasRoute, path]);
  const totalDistanceM = cumulative[cumulative.length - 1] ?? 0;

  distanceRef.current = distanceM;
  speedRef.current = playbackSpeed;

  useEffect(() => {
    onRouteMeta?.({ totalDistanceM });
  }, [totalDistanceM, onRouteMeta]);

  const sample = useMemo(
    () =>
      hasRoute
        ? sampleAtDistance(path, cumulative, distanceM)
        : { position: null as RoutePoint | null, traveled: [] as RoutePoint[], heading: 0 },
    [hasRoute, path, cumulative, distanceM],
  );

  const headingRounded = Math.round(sample.heading / 2) * 2;
  const vehicleIcon = useMemo(
    () => playbackIcon(vehicleKind, vehicleStatus, headingRounded),
    [vehicleKind, vehicleStatus, headingRounded],
  );

  useEffect(() => {
    if (!playing || !hasRoute || totalDistanceM <= 0) {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let lastTs = performance.now();

    const tick = (now: number) => {
      const dtSec = Math.min((now - lastTs) / 1000, 0.1);
      lastTs = now;
      const metersPerSec = METERS_PER_SEC_1X * speedRef.current;
      const next = Math.min(distanceRef.current + metersPerSec * dtSec, totalDistanceM);
      onDistanceChange(next);
      if (next >= totalDistanceM) {
        onPlayingChange(false);
        rafRef.current = null;
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing, hasRoute, totalDistanceM, onDistanceChange, onPlayingChange]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[26.45, 80.31]}
        zoom={12}
        zoomControl={false}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          key={baseLayer}
          attribution={base.attribution}
          url={base.url}
          subdomains={[...base.subdomains]}
          maxZoom={21}
        />
        {showTraffic && (
          <TileLayer
            key={`traffic-${baseLayer}`}
            attribution={TILES.traffic.attribution}
            url={TILES.traffic.url}
            subdomains={[...TILES.traffic.subdomains]}
            opacity={baseLayer === "satellite" ? 0.85 : 0.55}
            zIndex={200}
            maxZoom={21}
          />
        )}
        <ZoomControl position="topleft" />
        {hasRoute && (
          <>
            <FitRoute routePath={path} enabled={!playing && distanceM <= 0} />
            <FollowPlayback position={sample.position} active={playing} />
            <Polyline
              positions={path}
              pathOptions={{
                color: ROUTE_COLOR,
                weight: 5,
                opacity: 0.9,
                dashArray: "2 10",
                lineJoin: "round",
                lineCap: "round",
                smoothFactor: 1.2,
              }}
            />
            {sample.traveled.length > 1 && distanceM > 0 && (
              <Polyline
                positions={sample.traveled}
                pathOptions={{
                  color: TRAVELED_COLOR,
                  weight: 6,
                  opacity: 1,
                  lineJoin: "round",
                  lineCap: "round",
                  smoothFactor: 1.1,
                }}
              />
            )}
            {start && <Marker position={start} icon={endpointIcon("start")} interactive={false} />}
            {end && <Marker position={end} icon={endpointIcon("end")} interactive={false} />}
            {sample.position && (
              <Marker
                position={sample.position}
                icon={vehicleIcon}
                interactive={false}
                zIndexOffset={1000}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
