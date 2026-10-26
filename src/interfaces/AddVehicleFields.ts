export type VehicleFieldConfig = {
	name: string;
	label: string;
	placeholder?: string;
	type?: "text" | "password" | "email" | "tel" | "number" | "date" | "select" | "checkbox";
	required?: boolean;
	optional?: boolean;
	options?: string[];
	helper?: string;
	info?: boolean;
	actionLabel?: string;
	maxLength?: number;
	inputMode?: "numeric";
	pattern?: string;
};

export const addVehicleFields: VehicleFieldConfig[] = [
	{ name: "vehicleNo", label: "Vehicle", placeholder: "Vehicle Number", required: true, helper: "Only contains [a-z, A-Z, 0-9, _, -, ,]" },
	{ name: "mileage", label: "Mileage", type: "number", required: true },
	{ name: "vehicleType", label: "Vehicle Type", type: "select", required: true, options: ["Select Vehicle Type", "Personal Car", "Bike", "Taxi", "Pickup", "Truck", "Bus"] },
	{ name: "overspeed", label: "Overspeed", type: "number", required: true },
	{ name: "idleTimeHour", label: "Idle Time (Hour)", type: "select", options: ["Select Hour", ...Array.from({ length: 24 }, (_, hour) => String(hour))] },
	{ name: "idleTimeMinute", label: "Idle Time (Minute)", type: "select", options: ["Select Minute", ...Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"))] },
	{ name: "vehicleClient", label: "Client", type: "select", required: true, options: ["Select Client", "Default Client"] },
	{ name: "vehicleDevice", label: "Device", type: "select", required: true, options: ["Select Device", "Concox (8505)"] },
	{ name: "vehicleTransporter", label: "Transporter", type: "select", required: true, options: ["Select Transporter", "Default Transporter"] },
	{ name: "subscriptionStart", label: "Subscription Start Date", type: "date", required: true },
	{ name: "subscriptionDue", label: "Subscription Due Date", type: "date", required: true },
	{ name: "fuelType", label: "Fuel Type", type: "select", options: ["Select Fuel Type", "Diesel", "Petrol", "CNG", "LPG", "Electric", "Hybrid", "Other"] },
	{ name: "currentOdometer", label: "Current Odometer Reading", type: "number" },
	{ name: "nickname", label: "Vehicle Nickname", placeholder: "Vehicle Nickname" },
	{ name: "remark", label: "Remark", placeholder: "Remark" },
	{ name: "durationOdometer", label: "Duration Odometer", type: "number" },
	{ name: "remark2", label: "Remark 2", placeholder: "Remark 2" },
	{ name: "parkingViolationAlarm", label: "Parking violation alarm on Ignition on", type: "checkbox" },
];
