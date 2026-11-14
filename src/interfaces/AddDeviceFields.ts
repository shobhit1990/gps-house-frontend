import type { VehicleFieldConfig } from "@/interfaces/AddVehicleFields";
import { SimOperator } from "@/enums/SimOperator";

export const DEVICE_TYPE_ID = "a6a80c75-2eba-4070-9c45-e310002a3ff0";
export const DEVICE_TYPE_LABEL = "Concox (8505)";
export const deviceSimOperators = Object.values(SimOperator);

export const addDeviceFields: VehicleFieldConfig[] = [
	{ name: "imei", label: "Imei", placeholder: "Imei", required: true, maxLength: 30, helper: "Max 30 characters allowed", actionLabel: "Import from Inventory" },
	{ name: "sim", label: "Sim Number", placeholder: "Sim Number", required: true, maxLength: 24, inputMode: "numeric", pattern: "[0-9]{24}", helper: "Only contains 24 digit" },
	{ name: "simOperator", label: "Sim Operator", type: "select", required: true, options: deviceSimOperators },
	{ name: "secondarySim", label: "Secondary Sim Number", placeholder: "Sim Number", maxLength: 24, inputMode: "numeric", pattern: "[0-9]{24}", helper: "Only contains 24 digit" },
	{ name: "secondarySimOperator", label: "Secondary Sim Operator", type: "select", options: deviceSimOperators },
	{ name: "deviceType", label: "Device Type", type: "select", required: true, options: [] },
	{ name: "deviceClient", label: "Client", type: "select", required: true, options: ["Select Client"] },
	{ name: "devicePassword", label: "Password", placeholder: "Password", type: "password", optional: true },
	{ name: "ignitionPositive", label: "Ignition wire connected in (+)ve", type: "checkbox" },
	{ name: "ignitionDisconnected", label: "Ignition wire not connected", type: "checkbox" },
	{ name: "airConditionPositive", label: "Air condition wire connected in (+)ve", type: "checkbox" },
	{ name: "attendance", label: "Attendance", type: "checkbox" },
	{ name: "timezoneSetting", label: "Timezone Setting", type: "checkbox" },
];
