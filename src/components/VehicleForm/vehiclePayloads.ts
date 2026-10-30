import type { CreatePaymentDetailsRequest, PaymentTerm } from "@/interfaces/PaymentDetails";
import type { CreateTransporterRequest } from "@/interfaces/Transporter";
import type { CreateVehicleRequest } from "@/interfaces/Vehicle";
import { Status } from "@/enums/Status";

type FormValues = Record<string, string>;

/** Trimmed text, or undefined when the field was left empty. */
const text = (value?: string) => value?.trim() || undefined;
const number = (value?: string) => (value?.trim() ? Number(value) : undefined);
const flag = (value?: string) => value === "true";

export function buildTransporterPayload(values: FormValues, roles: string[]): CreateTransporterRequest {
	return {
		username: values.username.trim(),
		password: values.password,
		company: values.company.trim(),
		client: values.client,
		timezone: values.timezone,
		inactiveTime: Number(values.inactiveTime),
		language: values.language,
		name: text(values.name),
		email: text(values.email),
		phone: text(values.phone),
		address: text(values.address),
		subscriptionStart: values.subscriptionStart,
		subscriptionDue: values.subscriptionDue,
		subscriptionExtend: text(values.subscriptionExtend),
		subscriptionExpiryCount: number(values.subscriptionExpiryCount),
		maxPoiRadius: number(values.maxPoiRadius),
		minAddressDistance: number(values.minAddressDistance),
		dataRestriction: number(values.dataRestriction),
		active: flag(values.active),
		overwriteSubscription: flag(values.overwriteSubscription),
		inactiveAfterExpiry: flag(values.inactiveAfterExpiry),
		roles,
	};
}

export function buildVehiclePayload(values: FormValues): CreateVehicleRequest {
	return {
		vehicle: values.vehicleNo.trim().toUpperCase(),
		mileage: Number(values.mileage),
		vehicleType: values.vehicleType,
		overspeed: Number(values.overspeed),
		hours: text(values.idleTimeHour),
		minutes: text(values.idleTimeMinute),
		client: values.vehicleClient,
		device: values.vehicleDevice,
		transporter: values.vehicleTransporter,
		subscriptionStartDate: values.subscriptionStart,
		subscriptionDueDate: values.subscriptionDue,
		fuelType: text(values.fuelType),
		currentOdometerReading: number(values.currentOdometer),
		vehicleNickname: text(values.nickname),
		remark: text(values.remark),
		durationOdometer: number(values.durationOdometer),
		remark2: text(values.remark2),
		parkingViolationAlarmOnIgnitionOn: flag(values.parkingViolationAlarm),
		ownerName: text(values.ownerName),
		ownedBy: text(values.ownedBy),
		vehicleBrand: text(values.vehicleBrand),
		vehicleModel: text(values.vehicleModel),
		vehicleBody: text(values.vehicleBody),
		capacity: number(values.capacity),
		manufactureDate: text(values.manufactureDate),
		purchaseDate: text(values.purchaseDate),
		status: Status.ACTIVE,
		reason: "New vehicle added",
	};
}

export function buildPaymentDetailsPayload(values: FormValues): CreatePaymentDetailsRequest {
	const transporter = text(values.paymentTransporter);
	if (!transporter) {
		throw new Error("A transporter must be selected for payment details.");
	}

	const paymentTerms: Record<string, PaymentTerm> = {
		Monthly: "monthely",
		monthely: "monthely",
		Yearly: "yearly",
		yearly: "yearly",
		"Half Yearly": "halfYearly",
		halfYearly: "halfYearly",
		Quarterly: "quaterly",
		quaterly: "quaterly",
	};
	const paymentTerm = paymentTerms[values.paymentTerm];
	if (!paymentTerm) {
		throw new Error("A valid payment term must be selected.");
	}

	return {
		type: "vehicle",
		transporter,
		sellingPrice: number(values.sellingPrice),
		paymentTerm,
		installationDate: text(values.installationDate),
		rentalDueDate: text(values.rentalDueDate),
		technicianName: text(values.technicianName),
		rental: number(values.rental),
		remark: text(values.paymentRemark),
		status: Status.ACTIVE,
		reason: "Payment details added",
	};
}
