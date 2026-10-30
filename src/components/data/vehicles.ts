export type VehicleKind = "car" | "bike";

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
};

export const vehicles: VehicleRow[] = [
  {
    sn: 1,
    kind: "car",
    color: "#e23b3b",
    branch: "Aviator",
    vehicle: "UP32HN8013",
    address: "Viraj Khand Rd, Viraj Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010, India",
    poi: "--",
    updatedAt: "30/09/2026 11:37:48",
    lat: 26.862,
    lng: 81.012,
  },
  {
    sn: 2,
    kind: "bike",
    color: "#e23b3b",
    branch: "",
    vehicle: "UP45AC5536",
    address: "Eldeco Akbarpur Road, Nawsanda, Uttar Pradesh 224230, India",
    poi: "--",
    updatedAt: "30/09/2026 07:32:02",
    lat: 26.431,
    lng: 82.541,
  },
  {
    sn: 3,
    kind: "car",
    color: "#e23b3b",
    branch: "",
    vehicle: "UP32LU6158",
    address: "LU New Campus Road, Lucknow, Aliganj, Uttar Pradesh, 226026, India",
    poi: "--",
    updatedAt: "30/09/2026 11:37:31",
    lat: 26.892,
    lng: 80.942,
  },
  {
    sn: 4,
    kind: "car",
    color: "#2f6bff",
    branch: "",
    vehicle: "UP45AC6533",
    address: "Harlalka Rd, Mirjapur Kodara, Uttar Pradesh 224122, India",
    poi: "--",
    updatedAt: "31/07/2026 13:15:39",
    lat: 26.512,
    lng: 82.218,
  },
  {
    sn: 5,
    kind: "car",
    color: "#e23b3b",
    branch: "",
    vehicle: "UPHK8143",
    address: "9/159, Arvindo Park Rd, Navneet Vihar, Sector 9, Indira Nagar, Lucknow, Uttar Pradesh 226016, India",
    poi: "--",
    updatedAt: "30/09/2026 11:36:25",
    lat: 26.878,
    lng: 80.996,
  },
  {
    sn: 6,
    kind: "car",
    color: "#e23b3b",
    branch: "",
    vehicle: "UP32ER2711",
    address: "Padera - Harchandpur Road, Mohanlalganj, Uttar Pradesh 226301, India",
    poi: "--",
    updatedAt: "30/09/2026 11:37:53",
    lat: 26.692,
    lng: 81.012,
  },
];
