export type VehicleKind = "car" | "bike";

export type VehicleStatus =
  | "running"
  | "stopped"
  | "overspeed"
  | "idle"
  | "unreachable"
  | "new";

export type VehicleRow = {
  sn: number;
  kind: VehicleKind;
  color: string;
  branch: string;
  vehicle: string;
  address: string;
  poi: string;
  updatedAt: string;
  lat: number;
  lng: number;
  status: VehicleStatus;
  since: string;
  distanceKm: number;
  parking?: string;
  speedKmph?: number;
  kmSinceAc?: number;
  ac?: string | boolean;
  btr?: string | number;
  gsm?: string | number;
  gps?: string;
  lockStatus?: string;
  iccid?: string;
  driverName?: string;
  socPercent?: number;
  excPowerVolt?: number;
  panic?: string | boolean;
  ignition?: boolean;
  odometerKm?: number;
  todayDistanceKm?: number;
  distanceFromLastStopKm?: number;
  duration?: string;
  odoDuration?: string;
  alias?: string;
  tripSource?: string;
  tripDestination?: string;
};

export const vehicles: VehicleRow[] = [
  {
    sn: 1,
    kind: "car",
    color: "#e23b3b",
    branch: "Aviator",
    vehicle: "UP32HN8013",
    address:
      "Viraj Khand Rd, Viraj Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010, India",
    poi: "N/A",
    updatedAt: "06/11/2026 15:20:34",
    lat: 26.862,
    lng: 81.012,
    status: "stopped",
    since: "06/11/2026 14:02:11",
    distanceKm: 42.6,
    speedKmph: 0,
    ac: false,
    btr: "12.4V",
    gsm: 4,
    gps: "On",
    lockStatus: "Unlocked",
    driverName: "Ravi Kumar",
    panic: false,
    ignition: false,
    odometerKm: 48210.4,
    todayDistanceKm: 18.2,
    distanceFromLastStopKm: 0,
    duration: "01:18:23",
    odoDuration: "126:40:12",
    alias: "Aviator Fleet",
    tripSource: "Gomti Nagar Extension, Lucknow",
    tripDestination: "Hazratganj Crossing, Lucknow",
  },
  {
    sn: 2,
    kind: "bike",
    color: "#22c55e",
    branch: "Express",
    vehicle: "UP45AC5536",
    address: "Eldeco Akbarpur Road, Nawsanda, Uttar Pradesh 224230, India",
    poi: "N/A",
    updatedAt: "06/11/2026 15:18:02",
    lat: 26.431,
    lng: 82.541,
    status: "running",
    since: "06/11/2026 14:55:40",
    distanceKm: 67.1,
    speedKmph: 34,
    ac: false,
    btr: "12.1V",
    gsm: 3,
    gps: "On",
    lockStatus: "Unlocked",
    driverName: "Aman Singh",
    panic: false,
    ignition: true,
    odometerKm: 21104.8,
    todayDistanceKm: 31.5,
    distanceFromLastStopKm: 4.2,
    duration: "00:22:18",
    odoDuration: "88:12:40",
    alias: "Courier Bike",
    tripSource: "Akbarpur Depot",
    tripDestination: "Faizabad Bypass",
  },
  {
    sn: 3,
    kind: "car",
    color: "#e23b3b",
    branch: "Campus",
    vehicle: "UP32LU6158",
    address: "LU New Campus Road, Lucknow, Aliganj, Uttar Pradesh, 226026, India",
    poi: "Lucknow University",
    updatedAt: "06/11/2026 15:19:11",
    lat: 26.892,
    lng: 80.942,
    status: "stopped",
    since: "06/11/2026 12:40:05",
    distanceKm: 21.4,
    speedKmph: 0,
    ac: true,
    btr: "12.6V",
    gsm: 5,
    gps: "On",
    lockStatus: "Locked",
    driverName: "Suresh Yadav",
    panic: false,
    ignition: false,
    odometerKm: 67340.1,
    todayDistanceKm: 9.8,
    distanceFromLastStopKm: 0,
    duration: "02:39:50",
    odoDuration: "210:05:33",
    alias: "Campus Shuttle",
    tripSource: "Aliganj Gate",
    tripDestination: "New Campus Gate 2",
  },
  {
    sn: 4,
    kind: "car",
    color: "#2f6bff",
    branch: "North",
    vehicle: "UP45AC6533",
    address: "Harlalka Rd, Mirjapur Kodara, Uttar Pradesh 224122, India",
    poi: "N/A",
    updatedAt: "06/11/2026 15:10:39",
    lat: 26.512,
    lng: 82.218,
    status: "unreachable",
    since: "05/11/2026 21:15:39",
    distanceKm: 8.2,
    speedKmph: 0,
    ac: false,
    btr: "11.2V",
    gsm: 0,
    gps: "Off",
    lockStatus: "Unknown",
    driverName: "—",
    panic: false,
    ignition: false,
    odometerKm: 39012.0,
    todayDistanceKm: 0,
    distanceFromLastStopKm: 0,
    duration: "18:05:00",
    odoDuration: "154:22:10",
    alias: "North Unit",
    tripSource: "Mirjapur Stand",
    tripDestination: "—",
  },
  {
    sn: 5,
    kind: "car",
    color: "#e23b3b",
    branch: "Indira Nagar",
    vehicle: "UPHK8143",
    address:
      "9/159, Arvindo Park Rd, Navneet Vihar, Sector 9, Indira Nagar, Lucknow, Uttar Pradesh 226016, India",
    poi: "N/A",
    updatedAt: "06/11/2026 15:21:05",
    lat: 26.878,
    lng: 80.996,
    status: "stopped",
    since: "06/11/2026 13:55:22",
    distanceKm: 33.9,
    speedKmph: 0,
    ac: false,
    btr: "12.3V",
    gsm: 4,
    gps: "On",
    lockStatus: "Unlocked",
    driverName: "Neeraj Pal",
    panic: false,
    ignition: false,
    odometerKm: 55102.6,
    todayDistanceKm: 14.1,
    distanceFromLastStopKm: 0,
    duration: "01:25:43",
    odoDuration: "176:48:09",
    alias: "City Sedan",
    tripSource: "Indira Nagar Sector 9",
    tripDestination: "Hazratganj Metro",
  },
  {
    sn: 6,
    kind: "bike",
    color: "#22c55e",
    branch: "South",
    vehicle: "UP32ER2711",
    address:
      "Padera - Harchandpur Road, Mohanlalganj, Uttar Pradesh 226301, India",
    poi: "N/A",
    updatedAt: "06/11/2026 15:20:53",
    lat: 26.692,
    lng: 81.012,
    status: "running",
    since: "06/11/2026 15:02:18",
    distanceKm: 54.7,
    speedKmph: 28,
    ac: false,
    btr: "12.5V",
    gsm: 5,
    gps: "On",
    lockStatus: "Unlocked",
    driverName: "Vikas Verma",
    panic: false,
    ignition: true,
    odometerKm: 18440.3,
    todayDistanceKm: 26.7,
    distanceFromLastStopKm: 3.1,
    duration: "00:18:35",
    odoDuration: "72:11:44",
    alias: "South Runner",
    tripSource: "Mohanlalganj Chowk",
    tripDestination: "Padera Market",
  },
];
