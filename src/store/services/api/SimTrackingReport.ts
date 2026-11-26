import { api } from "../api";
import type {
	SimTrackingApiRecord,
	SimTrackingReportParams,
	SimTrackingReportResult,
	SimTrackingRow,
} from "@/interfaces/SimTrackingReport";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

const asText = (value: unknown): string => {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value).trim();
	}
	if (Array.isArray(value)) {
		return value.map((item) => asText(item)).filter(Boolean).join(", ");
	}
	if (typeof value === "object") {
		const record = value as Record<string, unknown>;
		return asText(
			record.vehicleNo ??
				record.vehicle ??
				record.vehicleNickname ??
				record.userName ??
				record.username ??
				record.companyName ??
				record.name ??
				record.externalId ??
				record.id,
		);
	}
	return "";
};

const asNumber = (value: unknown): number => {
	if (value === undefined || value === null || value === "") return 0;
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	const trimmed = String(value).trim();
	if (!trimmed) return 0;
	const direct = Number(trimmed);
	return Number.isFinite(direct) ? direct : 0;
};

const normalizeStatus = (value: unknown): string => {
	const text = asText(value);
	if (!text) return "";
	const lower = text.toLowerCase();
	if (lower === "active") return "Active";
	if (lower === "inactive") return "Inactive";
	return text.charAt(0).toUpperCase() + text.slice(1);
};

const normalizeSimTracking = (record: SimTrackingApiRecord, index: number): SimTrackingRow => {
	const externalId = String(record.externalId ?? record.id ?? index);
	const vehicleNo =
		asText(record.vehicleNo) ||
		asText(record.vehicleName) ||
		asText(record.vehicleNickname) ||
		asText(record.vehicle);

	return {
		id: String(record.id ?? externalId),
		externalId,
		vehicleNo: vehicleNo || "—",
		vehicleStatus: normalizeStatus(record.vehicleStatus ?? record.status) || "—",
		createdBy: asText(record.createdBy) || "—",
		simNo: asText(record.simNo ?? record.simNumber ?? record.sim) || "—",
		consent: asText(record.consent) || "—",
		startDate: asText(record.startDate) || "—",
		endDate: asText(record.endDate) || "—",
		frequency: asText(record.frequency ?? record.frequencyMinutes) || "—",
		nextUpdate: asText(record.nextUpdate) || "—",
		trackCount: asText(record.trackCount) || "0",
		message: asText(record.message) || "—",
	};
};

type NestedPayload =
	| SimTrackingApiRecord[]
	| SimTrackingApiRecord
	| {
			rows?: SimTrackingApiRecord[];
			data?: SimTrackingApiRecord[];
			list?: SimTrackingApiRecord[];
			remainingCoins?: number | string;
			coins?: number | string;
	  };

const unwrapSimTracking = (response: ApiEnvelope<NestedPayload>): SimTrackingReportResult => {
	const data = unwrapResponse(response);
	let list: SimTrackingApiRecord[] = [];
	let remainingCoins = 0;

	if (Array.isArray(data)) {
		list = data;
	} else if (data && typeof data === "object") {
		const nested = data as {
			rows?: SimTrackingApiRecord[];
			data?: SimTrackingApiRecord[];
			list?: SimTrackingApiRecord[];
			remainingCoins?: number | string;
			coins?: number | string;
		};
		const nestedList = nested.rows ?? nested.data ?? nested.list;
		if (Array.isArray(nestedList)) {
			list = nestedList;
			remainingCoins = asNumber(nested.remainingCoins ?? nested.coins);
		} else {
			list = [data as SimTrackingApiRecord];
			remainingCoins = asNumber(
				(data as SimTrackingApiRecord).remainingCoins ?? (data as SimTrackingApiRecord).coins,
			);
		}
	}

	return {
		rows: list.map(normalizeSimTracking),
		remainingCoins,
	};
};

export const simTrackingReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getSimTrackingReport: builder.query<SimTrackingReportResult, SimTrackingReportParams | void>({
			query: (arg) => {
				const status = arg && typeof arg === "object" ? arg.status : undefined;
				return {
					url: "/sim-tracking-report",
					params: status ? { status } : undefined,
				};
			},
			transformResponse: (response: ApiEnvelope<NestedPayload>) => {
				try {
					return unwrapSimTracking(response);
				} catch (error) {
					console.error("Failed to normalize SIM tracking report.", error);
					return { rows: [], remainingCoins: 0 };
				}
			},
			providesTags: (result) => [
				{ type: "SimTrackingReports" as const, id: "LIST" },
				...(result?.rows ?? []).map((item) => ({
					type: "SimTrackingReports" as const,
					id: item.externalId,
				})),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetSimTrackingReportQuery, useLazyGetSimTrackingReportQuery } = simTrackingReportApi;
