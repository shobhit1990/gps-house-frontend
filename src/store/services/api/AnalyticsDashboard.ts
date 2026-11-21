import { api } from "../api";
import type {
  AnalyticsChartPoint,
  AnalyticsDailyPointApi,
  AnalyticsDashboardApiData,
  AnalyticsDashboardParams,
  AnalyticsDashboardResult,
  AnalyticsHighlight,
  AnalyticsHighlightApi,
} from "@/interfaces/AnalyticsDashboard";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

const asNumber = (value: unknown): number => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value).trim();
  if (!text) return 0;
  const direct = Number(text);
  if (Number.isFinite(direct)) return direct;
  const hours = text.match(/(\d+)\s*[Hh]/)?.[1];
  const minutes = text.match(/(\d+)\s*[Mm]/)?.[1];
  if (hours || minutes) return Number(hours ?? 0) + Number(minutes ?? 0) / 60;
  const colon = text.match(/^(\d+):(\d+)$/);
  if (colon) return Number(colon[1]) + Number(colon[2]) / 60;
  return 0;
};

const asText = (value: unknown) => {
  if (value == null) return "";
  return String(value).trim();
};

const formatDurationHours = (hours: number) => {
  if (!Number.isFinite(hours) || hours <= 0) return "0h 0m";
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
};

const formatKm = (km: number) => {
  if (!Number.isFinite(km)) return "0 km";
  const rounded = Math.round(km * 10) / 10;
  return `${rounded.toLocaleString()} km`;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const toDayKey = (date: Date) =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

const parseApiDate = (raw: string): Date | null => {
  const text = raw.trim();
  if (!text) return null;
  // DD/MM/YYYY or DD/MM/YYYY HH:mm
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    const year = Number(slash[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // DD-MM-YYYY
  const dashed = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dashed) {
    const day = Number(dashed[1]);
    const month = Number(dashed[2]) - 1;
    const year = Number(dashed[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // YYYY-MM-DD (avoid UTC shift from `new Date("YYYY-MM-DD")`)
  const isoDay = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDay) {
    const date = new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const iso = new Date(text);
  return Number.isNaN(iso.getTime()) ? null : iso;
};

/** Always DD/MM/YYYY so chart axis matches the filter range. */
const formatDayLabel = (raw: string) => {
  const date = parseApiDate(raw);
  if (date) return toDayKey(date);
  const text = raw.trim();
  return text || "—";
};

const pickDailyList = (data: AnalyticsDashboardApiData | undefined): AnalyticsDailyPointApi[] => {
  if (!data) return [];
  if (Array.isArray(data.daily)) return data.daily;
  if (Array.isArray(data.days)) return data.days;
  if (Array.isArray(data.chart)) return data.chart;
  if (Array.isArray(data.points)) return data.points;
  return [];
};

const toHighlight = (
  item: AnalyticsHighlightApi | null | undefined,
  kind: "distance" | "duration",
  positive: boolean,
): AnalyticsHighlight | null => {
  if (!item) return null;
  const vehicle =
    asText(item.vehicleNumber) || asText(item.vehicleNo) || asText(item.vehicle) || "Vehicle";
  const rawValue =
    kind === "distance"
      ? asNumber(item.value ?? item.distance)
      : asNumber(item.value ?? item.durationHours ?? item.duration);
  const value = kind === "distance" ? formatKm(rawValue) : formatDurationHours(rawValue);
  const note =
    asText(item.note) ||
    (item.changePercent != null && item.changePercent !== ""
      ? `${Number(item.changePercent) >= 0 ? "+" : ""}${asNumber(item.changePercent)}%`
      : positive
        ? "Top in range"
        : "Lowest in range");
  return { vehicle, value, note, positive };
};

const normalizeAnalytics = (
  response: ApiEnvelope<AnalyticsDashboardApiData | AnalyticsDailyPointApi[]>,
): AnalyticsDashboardResult => {
  const unwrapped = unwrapResponse(response);
  const data: AnalyticsDashboardApiData = Array.isArray(unwrapped)
    ? { daily: unwrapped }
    : (unwrapped ?? {});

  const dailyRaw = pickDailyList(data);
  const chartData: AnalyticsChartPoint[] = dailyRaw.map((point, index) => {
    const mileage = asNumber(point.mileage ?? point.distance ?? point.totalDistance);
    let durationHours = asNumber(point.durationHours ?? point.runningHours ?? point.duration);
    const runningMinutes = asNumber(point.runningMinutes);
    if (runningMinutes > 0 && durationHours <= 0) durationHours = runningMinutes / 60;
    const rawDate = asText(point.date ?? point.day ?? point.label);
    const parsed = parseApiDate(rawDate);
    return {
      date: formatDayLabel(rawDate || `Day ${index + 1}`),
      dayKey: parsed ? toDayKey(parsed) : rawDate,
      mileage,
      duration: Math.round(durationHours * 10) / 10,
    };
  });

  const summary = data.summary ?? {};
  const totalFromChart = chartData.reduce((sum, row) => sum + row.mileage, 0);
  const hoursFromChart = chartData.reduce((sum, row) => sum + row.duration, 0);

  const totalDistanceKm = asNumber(summary.totalDistance ?? summary.totalMileage) || totalFromChart;
  let totalDurationHours =
    asNumber(summary.totalDurationHours ?? summary.totalDuration) || hoursFromChart;
  const totalDurationMinutes = asNumber(summary.totalDurationMinutes);
  if (totalDurationMinutes > 0 && asNumber(summary.totalDurationHours ?? summary.totalDuration) <= 0) {
    totalDurationHours = totalDurationMinutes / 60;
  }

  const dayCount = Math.max(chartData.length, 1);
  const dailyAverageKm =
    asNumber(summary.dailyAverage) || Math.round((totalDistanceKm / dayCount) * 10) / 10;
  const vehiclesTracked = asNumber(summary.vehiclesTracked ?? summary.vehicleCount) || 1;

  const highlights = data.highlights ?? {};
  const longestDistance =
    toHighlight(highlights.longestDistance ?? data.longestDistance, "distance", true) ??
    (chartData.length
      ? {
          vehicle: "",
          value: formatKm(Math.max(...chartData.map((row) => row.mileage))),
          note: "Peak day",
          positive: true,
        }
      : null);
  const shortestDistance =
    toHighlight(highlights.shortestDistance ?? data.shortestDistance, "distance", false) ??
    (chartData.length
      ? {
          vehicle: "",
          value: formatKm(Math.min(...chartData.map((row) => row.mileage))),
          note: "Lowest day",
          positive: false,
        }
      : null);
  const longestDuration =
    toHighlight(highlights.longestDuration ?? data.longestDuration, "duration", true) ??
    (chartData.length
      ? {
          vehicle: "",
          value: formatDurationHours(Math.max(...chartData.map((row) => row.duration))),
          note: "Peak day",
          positive: true,
        }
      : null);
  const shortestDuration =
    toHighlight(highlights.shortestDuration ?? data.shortestDuration, "duration", false) ??
    (chartData.length
      ? {
          vehicle: "",
          value: formatDurationHours(Math.min(...chartData.map((row) => row.duration))),
          note: "Lowest day",
          positive: false,
        }
      : null);

  return {
    totalDistanceKm,
    totalDurationLabel: formatDurationHours(totalDurationHours),
    totalDurationHours,
    dailyAverageKm,
    vehiclesTracked,
    chartData,
    longestDistance,
    shortestDistance,
    longestDuration,
    shortestDuration,
  };
};

export const analyticsDashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsDashboard: builder.query<AnalyticsDashboardResult, AnalyticsDashboardParams>({
      query: ({ client, transporter, vehicle, from, to }) => ({
        url: "/analytics-dashboard",
        params: { client, transporter, vehicle, from, to },
      }),
      transformResponse: (
        response: ApiEnvelope<AnalyticsDashboardApiData | AnalyticsDailyPointApi[]>,
      ) => normalizeAnalytics(response),
      providesTags: [{ type: "AnalyticsDashboard" as const, id: "VIEW" }],
    }),
  }),
  overrideExisting: false,
});

export const { useLazyGetAnalyticsDashboardQuery } = analyticsDashboardApi;
