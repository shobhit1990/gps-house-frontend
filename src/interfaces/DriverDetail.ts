import type { Status } from "@/enums/Status";

export interface CreateDriverDetailRequest {
	client: string;
	transporter: string;
	firstName: string;
	lastName: string;
	deviceId: string;
	dateOfJoining: string;
	dateOfBirth: string;
	experience: number;
	salary: number;
	phoneNumber: string;
	licenseNumber: string;
	licenseToDrive: string[];
	licenseIssueDate: string;
	licenseExpiryDate: string;
	lifeInsuranceNumber: string;
	lifeInsuranceExpiryDate: string;
	mediclaimNumber: string;
	mediclaimExpiryDate: string;
	bloodGroup: string;
	supervisorName: string;
	supervisorPhoneNumber: string;
	address: string;
	licenseAvailable: boolean;
	licenseVerified: boolean;
	enableGeoVerifiedAttendance: boolean;
	geofences: string[];
	status: Status;
	reason: string;
}

export type UpdateDriverDetailRequest = Partial<CreateDriverDetailRequest>;

export interface DriverDetail extends CreateDriverDetailRequest {
	id: string | number;
	externalId: string;
	createdAt?: string;
	updatedAt?: string;
	dateOfLeaving?: string;
}
