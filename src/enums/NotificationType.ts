/** Alert notification kinds for Notification List filters (`notification` query param). */
export enum NotificationType {
	IDLE = "Idle",
	OVERSPEED = "Overspeed",
	IGNITION_ON = "Ignition On",
	IGNITION_OFF = "Ignition Off",
	AC_CHANGE = "Ac change",
	BATTERY_DISCONNECT = "Battery Disconnect",
	PANIC_ON = "Panic On",
	UNREACHABLE = "Unreachable",
	TOWING_ALERT = "Towing Alert",
	GEOFENCE_IN = "GeoFence In",
	GEOFENCE_OUT = "Geofence Out",
	ABNORMAL_STOPPAGE = "Abnormal Stoppage",
	SEAT_BELT = "Seat Belt",
	UNAUTHORIZED_STOP_ALERT = "Unauthorized Stop Alert",
	DEVICE_DETACHED = "Device Detached",
	CUSTOM_ALERT = "Custom Alert",
	SERVICE_AND_MAINTENANCE = "Service and Maintenance",
	DRIVING_LICENSE = "DRIVING LICENSE",
}

export const notificationTypeOptions = Object.values(NotificationType).map((value) => ({
	value,
	label: value,
}));
