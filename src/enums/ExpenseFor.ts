export enum ExpenseFor {
	VEHICLE_WISE = "VehicleWise",
	DRIVER_WISE = "DriverWise",
}

export const expenseForOptions: { value: ExpenseFor; label: string }[] = [
	{ value: ExpenseFor.VEHICLE_WISE, label: "Vehicle Wise" },
	{ value: ExpenseFor.DRIVER_WISE, label: "Driver Wise" },
];
