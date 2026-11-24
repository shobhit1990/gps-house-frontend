import { useEffect, useRef } from "react";
import {
	Circle as LeafletCircle,
	Polygon as LeafletPolygon,
	Rectangle as LeafletRectangle,
	useMap,
	useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { DrawnShape } from "@/components/Geofence/geofenceGeometry";

export type DrawTool = "circle" | "rectangle" | "polygon" | "pan";

const shapeStyle = {
	color: "#22d3ee",
	weight: 2,
	fillColor: "#22d3ee",
	fillOpacity: 0.18,
};

export function MapEvents({
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

export function MapSize({ expanded }: { expanded: boolean }) {
	const map = useMap();

	useEffect(() => {
		const id = window.setTimeout(() => map.invalidateSize(), 60);
		return () => window.clearTimeout(id);
	}, [expanded, map]);

	return null;
}

export function Recenter({
	lat,
	lng,
	enabled,
}: {
	lat: number;
	lng: number;
	enabled: boolean;
}) {
	const map = useMap();

	useEffect(() => {
		if (!enabled) return;
		map.panTo([lat, lng]);
	}, [lat, lng, map, enabled]);

	return null;
}

export function MapDragControl({ enabled }: { enabled: boolean }) {
	const map = useMap();

	useEffect(() => {
		if (enabled) map.dragging.enable();
		else map.dragging.disable();
	}, [enabled, map]);

	return null;
}

export function DrawController({
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
		if (!draftRef.current) return;
		map.removeLayer(draftRef.current);
		draftRef.current = null;
	};

	const clearVertices = () => {
		if (!vertexLayerRef.current) return;
		map.removeLayer(vertexLayerRef.current);
		vertexLayerRef.current = null;
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
				draftRef.current = L.polyline(next, {
					color: "#22d3ee",
					weight: 2,
					dashArray: "4 4",
				}).addTo(map);
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
