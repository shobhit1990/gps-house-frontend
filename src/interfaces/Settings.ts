export type LandingPage = "vehicles" | "dashboard" | "devices" | "transporters";

export interface GeneralSettings {
  landingPage: LandingPage;
  downloadXlsx: boolean;
  fuelChartVoltage: boolean;
  sortByHighchart: boolean;
  uploads: Record<"vehicle" | "poi" | "payment" | "billing", string>;
}

export interface ThemeSettings {
  domain: string;
  viewChartInReports: boolean;
  themeColor: string;
}

export interface ProfileSettings {
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
}

export interface PreferenceSettings {
  distance: string;
  volume: string;
  currency: string;
  fuelType: string;
  fuelCost: string;
  fuelCosts: { fuelType: string; fuelCost: string }[];
  dateFormat: string;
  timeFormat: string;
}

export interface CertificateRecord {
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
}

export interface CustomFieldDraft {
  fieldName: string;
  viewOn: string;
}

export interface CustomFieldRecord {
  id: string;
  createdBy: string;
  client: string;
  createdFor: string;
  entity: string;
  fieldName: string;
  viewOn: string;
}

export interface SettingsDraft {
  general: GeneralSettings;
  theme: ThemeSettings;
  profile: ProfileSettings;
  preferences: PreferenceSettings;
  certificates: CertificateRecord[];
  customFields: CustomFieldRecord[];
}
