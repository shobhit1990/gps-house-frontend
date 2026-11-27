import { Status } from "@/enums/Status";

/** Common fields shared by the /master/{client,transporter,technician,vehicle,state,alert,expenseType} records. */
interface MasterRecordBase {
  id?: string | number;
  externalId?: string;
  name?: string;

  status?: Status;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientMaster extends MasterRecordBase {
  clientName?: string;
  company?: string;
  companyName?: string;
  username?: string;
  userName?: string;
  owner_name?: string;
  ownerName?: string;
}

export interface TransporterMaster extends MasterRecordBase {
  transporterName?: string;
  company?: string;
  companyName?: string;
  username?: string;
  userName?: string;
  client?: string;
}

export interface TechnicianMaster extends MasterRecordBase {
  technicianName?: string;
  userName?: string;
  username?: string;
  companyName?: string;
}

export interface VehicleMaster extends MasterRecordBase {
  vehicle?: string;
  vehicleNo?: string;
  vehicleName?: string;
  client?: string | { id?: string | number; externalId?: string; name?: string };
  transporter?: string | { id?: string | number; externalId?: string; name?: string };
}

export interface StateMaster extends MasterRecordBase {
  stateName?: string;
  stateCode?: string;
}

export interface AlertTypeMaster extends MasterRecordBase {
  alertType?: string;
  alertName?: string;
}

export interface ExpenseTypeMaster extends MasterRecordBase {
  expenseType?: string;
  expenseName?: string;
}

export interface GeofTypeMaster extends MasterRecordBase {
  geofType?: string;
  geofTypeName?: string;
  typeName?: string;
  geofenceTypeName?: string;
}

export interface MasterOption {
  id: string;
  externalId?: string;
  name: string;
  /** Vehicle master: linked client UUID when API nests `client`. */
  clientId?: string;
  /** Vehicle master: linked transporter UUID when API nests `transporter`. */
  transporterId?: string;
  /** Transporter master: raw `client` field (often client name, sometimes UUID). */
  clientRef?: string;
  /**
   * Alternate strings the API may use for this record (e.g. client `name` / `userName` /
   * `companyName`). Used to match transporter.client when it is not a UUID.
   */
  aliases?: string[];
}
