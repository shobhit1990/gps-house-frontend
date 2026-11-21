/** Query params for `GET /analytics-dashboard`. */
export type AnalyticsDashboardParams = {
  client: string;
  transporter: string;
  vehicle: string;
  /** DD/MM/YYYY HH:mm, e.g. `20/11/2026 00:00` */
  from: string;
  /** DD/MM/YYYY HH:mm, e.g. `20/11/2026 23:59` */
  to: string;
};

export type AnalyticsDailyPointApi = {
  date?: string;
  day?: string;
  label?: string;
  mileage?: number | string | null;
  distance?: number | string | null;
  totalDistance?: number | string | null;
  duration?: number | string | null;
  durationHours?: number | string | null;
  runningHours?: number | string | null;
  runningMinutes?: number | string | null;
};

export type AnalyticsHighlightApi = {
  vehicle?: string | null;
  vehicleNumber?: string | null;
  vehicleNo?: string | null;
  value?: number | string | null;
  distance?: number | string | null;
  duration?: number | string | null;
  durationHours?: number | string | null;
  note?: string | null;
  changePercent?: number | string | null;
};

export type AnalyticsDashboardApiData = {
  summary?: {
    totalDistance?: number | string | null;
    totalMileage?: number | string | null;
    totalDuration?: number | string | null;
    totalDurationHours?: number | string | null;
    totalDurationMinutes?: number | string | null;
    dailyAverage?: number | string | null;
    vehiclesTracked?: number | string | null;
    vehicleCount?: number | string | null;
  } | null;
  daily?: AnalyticsDailyPointApi[] | null;
  days?: AnalyticsDailyPointApi[] | null;
  chart?: AnalyticsDailyPointApi[] | null;
  points?: AnalyticsDailyPointApi[] | null;
  highlights?: {
    longestDistance?: AnalyticsHighlightApi | null;
    shortestDistance?: AnalyticsHighlightApi | null;
    longestDuration?: AnalyticsHighlightApi | null;
    shortestDuration?: AnalyticsHighlightApi | null;
  } | null;
  longestDistance?: AnalyticsHighlightApi | null;
  shortestDistance?: AnalyticsHighlightApi | null;
  longestDuration?: AnalyticsHighlightApi | null;
  shortestDuration?: AnalyticsHighlightApi | null;
};

export type AnalyticsChartPoint = {
  date: string;
  /** DD/MM/YYYY when the API date can be parsed; used by Distance Report columns. */
  dayKey: string;
  mileage: number;
  duration: number;
};

export type AnalyticsHighlight = {
  vehicle: string;
  value: string;
  note: string;
  positive: boolean;
};

export type AnalyticsDashboardResult = {
  totalDistanceKm: number;
  totalDurationLabel: string;
  totalDurationHours: number;
  dailyAverageKm: number;
  vehiclesTracked: number;
  chartData: AnalyticsChartPoint[];
  longestDistance: AnalyticsHighlight | null;
  shortestDistance: AnalyticsHighlight | null;
  longestDuration: AnalyticsHighlight | null;
  shortestDuration: AnalyticsHighlight | null;
};
