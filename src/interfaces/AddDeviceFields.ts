import type { VehicleFieldConfig } from "@/interfaces/AddVehicleFields";

export const addDeviceFields: VehicleFieldConfig[] = [
	{ name: "imei", label: "Imei", placeholder: "Imei", required: true, maxLength: 30, helper: "Max 30 characters allowed", actionLabel: "Import from Inventory" },
	{ name: "sim", label: "Sim Number", placeholder: "Sim Number", required: true, maxLength: 24, inputMode: "numeric", pattern: "[0-9]{24}", helper: "Only contains 24 digit" },
	{ name: "simOperator", label: "Sim Operator", type: "select", required: true, options: ["Airtel Gprs (airtelgprs.com)"] },
	{ name: "secondarySim", label: "Secondary Sim Number", placeholder: "Sim Number", maxLength: 24, inputMode: "numeric", pattern: "[0-9]{24}", helper: "Only contains 24 digit" },
	{ name: "secondarySimOperator", label: "Secondary Sim Operator", type: "select", options: ["Airtel Gprs (airtelgprs.com)"] },
	{ name: "deviceType", label: "Device Type", type: "select", required: true, options: ["Concox (8505)"] },
	{ name: "deviceClient", label: "Client", type: "select", required: true, options: ["Select Client", "Default Client"] },
	{ name: "devicePassword", label: "Password", placeholder: "Password", type: "password", optional: true },
	{ name: "deviceActive", label: "Active", type: "checkbox" },
	{ name: "ignitionPositive", label: "Ignition wire connected in (+)ve", type: "checkbox" },
	{ name: "ignitionDisconnected", label: "Ignition wire not connected", type: "checkbox" },
	{ name: "airConditionPositive", label: "Air condition wire connected in (+)ve", type: "checkbox" },
	{ name: "attendance", label: "Attendance", type: "checkbox" },
	{ name: "timezoneSetting", label: "Timezone Setting", type: "checkbox" },
];
