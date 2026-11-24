import { Shapes } from "@/enums/Shapes";
import type { Geofence } from "@/interfaces/Geofence";

export type DrawnShape =
	| { kind: "circle"; center: [number, number]; radius: number }
	| { kind: "rectangle"; bounds: [[number, number], [number, number]] }
	| { kind: "polygon"; points: [number, number][] };

export type ShapeCoords = {
	latitudes: number[];
	longitudes: number[];
	center: [number, number] | null;
	radius: number;
};

export const DEFAULT_CENTER = { lat: 26.4658, lng: 80.3498 };
export const DEFAULT_RADIUS_M = 500;

export const parseCoord = (value: string, fallback: number) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export const round6 = (value: number) => Number(value.toFixed(6));

/** Longitude of a point `radiusMeters` east of (lat, lng). */
export const edgeLongitude = (lat: number, lng: number, radiusMeters: number) => {
	const metersPerDegreeLng = 111320 * Math.cos((lat * Math.PI) / 180);
	if (!Number.isFinite(metersPerDegreeLng) || metersPerDegreeLng === 0) return lng;
	return lng + radiusMeters / metersPerDegreeLng;
};

/** Haversine distance (m) between the first two lat/lng pairs. */
export const radiusFromPoints = (latitudes: number[], longitudes: number[]) => {
	if (latitudes.length < 2 || longitudes.length < 2) return 0;

	const toRad = (degrees: number) => (degrees * Math.PI) / 180;
	const lat1 = toRad(latitudes[0]);
	const lat2 = toRad(latitudes[1]);
	const dLat = toRad(latitudes[1] - latitudes[0]);
	const dLng = toRad(longitudes[1] - longitudes[0]);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

	return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const shapeValue = (kind: DrawnShape["kind"]) => {
	if (kind === "circle") return Shapes.CIRCLE;
	if (kind === "rectangle") return Shapes.RECTANGLE;
	return Shapes.POLYGON;
};

export const coordsFromShape = (shape: DrawnShape | null): ShapeCoords => {
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
		return {
			latitudes: [round6(north), round6(north), round6(south), round6(south)],
			longitudes: [round6(west), round6(east), round6(east), round6(west)],
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

export const shapeFromInitial = (initialValues?: Geofence): DrawnShape | null => {
	const latitudes = initialValues?.latitude ?? [];
	const longitudes = initialValues?.longitude ?? [];
	if (!latitudes.length || latitudes.length !== longitudes.length) return null;

	const kind = (initialValues?.shapes || "").toLowerCase();
	const isCircle = kind === Shapes.CIRCLE || kind === "circle" || latitudes.length <= 2;

	if (isCircle) {
		const radius = Math.max(
			1,
			Number(initialValues?.radius) || radiusFromPoints(latitudes, longitudes) || DEFAULT_RADIUS_M,
		);
		return { kind: "circle", center: [latitudes[0], longitudes[0]], radius };
	}

	if (kind === Shapes.RECTANGLE || latitudes.length === 4) {
		return {
			kind: "rectangle",
			bounds: [
				[Math.min(...latitudes), Math.min(...longitudes)],
				[Math.max(...latitudes), Math.max(...longitudes)],
			],
		};
	}

	return {
		kind: "polygon",
		points: latitudes.map((lat, index) => [lat, longitudes[index]] as [number, number]),
	};
};

/** Positive radius from input, or the default when empty/invalid. */
export const resolveRadiusMeters = (radiusText: string, fallback = DEFAULT_RADIUS_M) => {
	const meters = Number(radiusText);
	if (Number.isFinite(meters) && meters > 0) return Math.round(meters);
	return fallback;
};

export const toFiniteNumberList = (values: number[]) =>
	values.map(Number).filter((value) => Number.isFinite(value));
