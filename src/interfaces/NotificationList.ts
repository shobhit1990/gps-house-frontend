import type { NotificationType } from "@/enums/NotificationType";

/** Query params for `GET /alert/getAll` on the Notification List screen. */
export type NotificationListParams = {
	client?: string;
	transporter?: string;
	vehicle?: string;
	notification?: NotificationType | string;
};

/** Normalized row for the Notification List table. */
export type NotificationListItem = {
	id: string;
	externalId: string;
	vehicleNo: string;
	type: string;
	location: string;
	message: string;
	address: string;
	added: string;
	client: string;
	transporter: string;
};
