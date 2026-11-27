/** Trip restriction options for Add Alert → Custom Alert. */
export enum TripRestrictionType {
	ON_TRIP = "ON Trip",
	NOT_ON_TRIP = "NOT ON Trip",
}

export const tripRestrictionTypeOptions = Object.values(TripRestrictionType).map((value) => ({
	value,
	label: value,
}));
