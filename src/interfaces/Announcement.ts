import type { Status } from "@/enums/Status";

export type AnnouncementAudience = "all" | "client" | "transporter";
export type AnnouncementValidity = "hours" | "days";
export type AnnouncementMessageType = "TEXT" | "IMAGE";

export interface CreateAnnouncementRequest {
  announcement: AnnouncementAudience;
  /** Client externalId; set when the announcement is for a client or transporter. */
  client?: string;
  /** Transporter externalId; set when the announcement is for a transporter. */
  transporter?: string;
  validityTime: AnnouncementValidity;
  validityDuration: number;
  messageType: AnnouncementMessageType;
  title?: string;
  /** HTML body for TEXT announcements. */
  body?: string;
  /** Image file for IMAGE announcements; sent as multipart form data. */
  messageImage?: File;
  requestForDontShowAgainOption: boolean;
  requestForProfileUpdate: boolean;
  status: Status;
  reason?: string;
}

export type UpdateAnnouncementRequest = Partial<CreateAnnouncementRequest>;

export interface Announcement extends Omit<CreateAnnouncementRequest, "messageImage"> {
  id: string | number;
  externalId: string;
  /** Stored image path for IMAGE announcements. */
  messageImage?: string;
  createdAt?: string;
  updatedAt?: string;
}
