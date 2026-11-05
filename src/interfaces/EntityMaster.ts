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
  username?: string;
}

export interface TransporterMaster extends MasterRecordBase {
  transporterName?: string;
  company?: string;
  username?: string;
}

export interface TechnicianMaster extends MasterRecordBase {
  technicianName?: string;
  userName?: string;
  username?: string;
}

export interface VehicleMaster extends MasterRecordBase {
  vehicle?: string;
  vehicleNo?: string;
  vehicleName?: string;
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

export interface MasterOption {
  id: string;
  externalId?: string;
  name: string;
}
