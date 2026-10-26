export type LandingPage = "vehicles" | "dashboard" | "devices" | "transporters";

export type GeneralSettings = {
  landingPage: LandingPage;
  downloadXlsx: boolean;
  fuelChartVoltage: boolean;
  sortByHighchart: boolean;
  uploads: Record<"vehicle" | "poi" | "payment" | "billing", string>;
};

export type ThemeSettings = {
  domain: string;
  viewChartInReports: boolean;
  themeColor: string;
};

export type VehicleConfigSettings = {
  transporter: string;
  distanceVariation: string;
  lockButton: boolean;
};

export type ProfileSettings = {
  name: string;
  mobile: string;
  email: string;
  companyName: string;
  website: string;
  gstin: string;
  cin: string;
  address: string;
  webLink: string;
  androidLink: string;
  iosLink: string;
};

export type PreferenceSettings = {
  distance: string;
  volume: string;
  currency: string;
  fuelType: string;
  fuelCost: string;
  dateFormat: string;
  timeFormat: string;
};

export type CertificateRecord = {
  id: string;
  deviceImei: string;
  vehicleNo: string;
  vehicleType: string;
  chassisNo: string;
  vtdModel: string;
  iccid: string;
  numberOfSos: string;
  invoiceNo: string;
  invoiceDate: string;
  deviceInstallationDate: string;
  manufacturingCompany: string;
  vehicleManufacturingDate: string;
  registrationDate: string;
  engineNumber: string;
  lastFitnessDate: string;
  vehicleModel: string;
  customerName: string;
  customerAddress: string;
  dealerName: string;
  dealerAddress: string;
  vtdUniqueId: string;
  ideaNumber: string;
  bankNumber: string;
  rtoDistrict: string;
  rtoState: string;
  dueDate: string;
  fitmentImages: string[];
  vendorLogos: string[];
  kycName: string;
  kycSurname: string;
  kycFatherName: string;
  kycPan: string;
  kycAadhaar: string;
  kycRemark: string;
  pancardFile: string;
  aadhaarFront: string;
  aadhaarBack: string;
};

export type CustomFieldDraft = {
  fieldName: string;
  viewOn: string;
};

export type CustomFieldRecord = {
  id: string;
  createdBy: string;
  client: string;
  createdFor: string;
  entity: string;
  fieldName: string;
  viewOn: string;
};

export type SettingsDraft = {
  general: GeneralSettings;
  theme: ThemeSettings;
  vehicleConfig: VehicleConfigSettings;
  profile: ProfileSettings;
  preferences: PreferenceSettings;
  certificates: CertificateRecord[];
  customFields: CustomFieldRecord[];
};

export const landingOptions: { value: LandingPage; label: string }[] = [
  { value: "vehicles", label: "Vehicle list" },
  { value: "dashboard", label: "Dashboard" },
  { value: "devices", label: "Devices" },
  { value: "transporters", label: "Transporter" },
];

export const themeColors = [
  { id: "mauve", label: "Mauve", hex: "#c084fc" },
  { id: "lime", label: "Lime", hex: "#84cc16" },
  { id: "blue", label: "Blue", hex: "#3b82f6" },
  { id: "cyan", label: "Cyan", hex: "#22d3ee" },
  { id: "teal", label: "Teal", hex: "#2dd4bf" },
  { id: "pink", label: "Pink", hex: "#f472b6" },
  { id: "slate", label: "Slate", hex: "#94a3b8" },
  { id: "indigo", label: "Indigo", hex: "#818cf8" },
  { id: "orange", label: "Orange", hex: "#fb923c" },
  { id: "sage", label: "Sage", hex: "#86efac" },
  { id: "olive", label: "Olive", hex: "#a3a35a" },
  { id: "violet", label: "Violet", hex: "#8b5cf6" },
  { id: "green", label: "Green", hex: "#22c55e" },
  { id: "ink", label: "Ink", hex: "#312e81" },
  { id: "red", label: "Red", hex: "#ef4444" },
];

export const exchangeTargets = [
  { id: "vehicle", label: "Vehicle", hint: "Vehicle master file" },
  { id: "poi", label: "POI", hint: "Points of interest" },
  { id: "payment", label: "Payment detail", hint: "Payment records" },
  { id: "billing", label: "Billing detail", hint: "Billing records" },
] as const;

export const viewOnOptions = ["Vehicle list", "Vehicle detail", "Dashboard", "Reports", "Certificate"];
export const entityOptions = ["Vehicle", "Device", "Transporter", "Driver"];

export const emptyCertificate = (): CertificateRecord => ({
  id: "",
  deviceImei: "",
  vehicleNo: "",
  vehicleType: "",
  chassisNo: "",
  vtdModel: "",
  iccid: "",
  numberOfSos: "",
  invoiceNo: "",
  invoiceDate: "",
  deviceInstallationDate: "",
  manufacturingCompany: "",
  vehicleManufacturingDate: "",
  registrationDate: "",
  engineNumber: "",
  lastFitnessDate: "",
  vehicleModel: "",
  customerName: "",
  customerAddress: "",
  dealerName: "",
  dealerAddress: "",
  vtdUniqueId: "",
  ideaNumber: "",
  bankNumber: "",
  rtoDistrict: "",
  rtoState: "",
  dueDate: "",
  fitmentImages: ["", "", "", ""],
  vendorLogos: ["", ""],
  kycName: "",
  kycSurname: "",
  kycFatherName: "",
  kycPan: "",
  kycAadhaar: "",
  kycRemark: "",
  pancardFile: "",
  aadhaarFront: "",
  aadhaarBack: "",
});

export const createDraft = (): SettingsDraft => ({
  general: {
    landingPage: "vehicles",
    downloadXlsx: false,
    fuelChartVoltage: false,
    sortByHighchart: true,
    uploads: { vehicle: "", poi: "", payment: "", billing: "" },
  },
  theme: {
    domain: "",
    viewChartInReports: true,
    themeColor: "cyan",
  },
  vehicleConfig: {
    transporter: "",
    distanceVariation: "0",
    lockButton: true,
  },
  profile: {
    name: "",
    mobile: "",
    email: "",
    companyName: "",
    website: "",
    gstin: "",
    cin: "",
    address: "",
    webLink: "",
    androidLink: "",
    iosLink: "",
  },
  preferences: {
    distance: "KILO_METER",
    volume: "LITER",
    currency: "INR",
    fuelType: "",
    fuelCost: "",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm:ss",
  },
  certificates: [],
  customFields: [],
});
