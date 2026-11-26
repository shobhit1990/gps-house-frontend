/** Alert type options for Add Alert → Add Type modal. */
export enum AddAlertType {
	IDLE = "Idle",
	OVERSPEED = "Overspeed",
	IGNITION_ON = "Ignition On",
	IGNITION_OFF = "Ignition Off",
	AC_CHANGE = "Ac change",
	BATTERY_DISCONNECT = "Battery Disconnect",
	PANIC_ON = "Panic On",
	PARKED = "Parked",
	UNREACHABLE = "Unreachable",
	TOWING_ALERT = "Towing Alert",
	GEOFENCE_IN = "GeoFence In",
	GEOFENCE_OUT = "Geofence Out",
	ABNORMAL_STOPPAGE = "Abnormal Stoppage",
	SEAT_BELT = "Seat Belt",
	UNAUTHORIZED_STOP_ALERT = "Unauthorized Stop Alert",
	DEVICE_DETACHED = "Device Detached",
	OVER_DRIVE_DAILY_DISTANCE = "Over Drive Daily Distance",
	OVER_DRIVE_WEEKLY_DISTANCE = "Over Drive Weekly Distance",
	UNDER_DRIVE_DAILY_DISTANCE = "Under Drive Daily Distance",
	UNDER_DRIVE_WEEKLY_DISTANCE = "Under Drive Weekly Distance",
	GNSS_JAMMING_ALERT = "GNSS Jamming Alert",
	JAMMING_ALERT = "Jamming Alert",
	DRIVING_LICENSE = "DRIVING LICENSE",
}

export const addAlertTypeOptions = Object.values(AddAlertType).map((value) => ({
	value,
	label: value,
}));
