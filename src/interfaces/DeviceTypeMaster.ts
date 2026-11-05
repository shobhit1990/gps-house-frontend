import { Status } from "@/enums/Status";

export interface DeviceTypeMaster {
  id?: string | number;
  deviceTypeName?: string;
  deviceName?: string;
  externalId?: string;

  status?: Status;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceMasterRecord {
  id?: string | number;
  externalId?: string;
  imei?: string;
  deviceName?: string;
  deviceTypeName?: string;
  deviceType?: string | DeviceTypeMaster | null;
  status?: Status;
}
