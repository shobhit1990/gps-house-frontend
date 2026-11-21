import type { PaymentTerm } from "@/interfaces/PaymentDetails";
import type { CreateTransporterRequest } from "@/interfaces/Transporter";
import type { CreateVehicleRequest, UpdateVehicleRequest, Vehicle, VehicleSaveType } from "@/interfaces/Vehicle";
import type { CreateDeviceRequest } from "@/interfaces/AddDevice";
import { Status } from "@/enums/Status";
import { VehicleStatus } from "@/enums/VehicleStatus";

type FormValues = Record<string, string>;

/** Trimmed text, or undefined when the field was left empty. Coerces numbers (e.g. phone). */
const text = (value?: string | number | null) => {
    if (value == null || value === "") return undefined;
    return String(value).trim() || undefined;
};
const number = (value?: string | number | null) => {
    if (value == null || value === "") return undefined;
    const trimmed = String(value).trim();
    return trimmed ? Number(trimmed) : undefined;
};
const flag = (value?: string) => value === "true";

const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const stringOrEmpty = (value: unknown): string => {
    if (value == null) return "";
    return String(value);
};

const refId = (value: unknown): string => {
    if (typeof value === "string" || typeof value === "number") return String(value);
    const record = asRecord(value);
    if (!record) return "";
    const id = record.externalId ?? record.id;
    return typeof id === "string" || typeof id === "number" ? String(id) : "";
};

const refLabel = (value: unknown): string => {
    if (typeof value === "string" || typeof value === "number") return String(value).trim();
    const record = asRecord(value);
    if (!record) return "";
    const owner = asRecord(record.owner);
    return (
        stringOrEmpty(record.owner_name).trim() ||
        stringOrEmpty(owner?.ownerName).trim() ||
        stringOrEmpty(record.userName).trim() ||
        stringOrEmpty(record.username).trim() ||
        stringOrEmpty(record.name).trim() ||
        stringOrEmpty(record.companyName).trim() ||
        stringOrEmpty(record.company).trim() ||
        refId(value)
    );
};

const dateInput = (value: unknown): string => {
    if (value == null || value === "") return "";
    const text = String(value).trim();
    if (!text) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

const boolFlag = (value: unknown): string => (value === true ? "true" : "false");

/** Maps a getById / list vehicle record into Add Vehicle form field values. */
export function vehicleToFormValues(vehicle: Vehicle): FormValues {
    const record = vehicle as Vehicle & Record<string, unknown>;
    const device = asRecord(record.device);
    const deviceType = asRecord(device?.deviceType);

    return {
        vehicleNo: stringOrEmpty(record.vehicle),
        mileage: stringOrEmpty(record.mileage),
        vehicleType: stringOrEmpty(record.vehicleType).toLowerCase(),
        overspeed: stringOrEmpty(record.overspeed),
        idleTimeHour: stringOrEmpty(record.hours),
        idleTimeMinute: stringOrEmpty(record.minutes),
        vehicleClient: refId(record.client),
        vehicleClientLabel: refLabel(record.client),
        vehicleDevice: refId(record.device),
        vehicleDeviceLabel: refLabel(record.device) || stringOrEmpty(device?.imei),
        vehicleTransporter: refId(record.transporter),
        vehicleTransporterLabel: refLabel(record.transporter),
        subscriptionStart: dateInput(record.subscriptionStartDate),
        subscriptionDue: dateInput(record.subscriptionDueDate),
        fuelType: stringOrEmpty(record.fuelType),
        currentOdometer: stringOrEmpty(record.currentOdometerReading),
        nickname: stringOrEmpty(record.vehicleNickname),
        remark: stringOrEmpty(record.remark),
        durationOdometer: stringOrEmpty(record.durationOdometer),
        remark2: stringOrEmpty(record.remark2),
        parkingViolationAlarm: boolFlag(record.parkingViolationAlarmOnIgnitionOn),
        ownerName: stringOrEmpty(record.ownerName),
        // Keep API enum values lowercase (market | example).
        ownedBy: stringOrEmpty(record.ownedBy).toLowerCase(),
        vehicleBrand: stringOrEmpty(record.vehicleBrand),
        vehicleModel: stringOrEmpty(record.vehicleModel),
        vehicleBody: stringOrEmpty(record.vehicleBody),
        capacity: stringOrEmpty(record.capacity ?? "0"),
        manufactureDate: dateInput(record.manufactureDate),
        purchaseDate: dateInput(record.purchaseDate),
        status:
            String(record.status ?? "").toLowerCase() === VehicleStatus.INACTIVE
                ? VehicleStatus.INACTIVE
                : VehicleStatus.ACTIVE,
        imei: stringOrEmpty(device?.imei),
        sim: stringOrEmpty(device?.simNumber),
        simOperator: stringOrEmpty(device?.simOperator),
        secondarySim: stringOrEmpty(device?.secondarySimNumber),
        secondarySimOperator: stringOrEmpty(device?.secondarySimOperator),
        deviceType: refId(deviceType),
        deviceClient: refId(device?.client),
        ignitionPositive: boolFlag(device?.ignitionWireConnected),
        ignitionDisconnected: boolFlag(device?.ignitionWireNotConnected),
        airConditionPositive: boolFlag(device?.airConditionWireConnected),
        attendance: boolFlag(device?.attendance),
        timezoneSetting: boolFlag(device?.timezoneSetting),
    };
}

export function vehicleRelationIds(vehicle: Vehicle): {
    vehicleId: string;
    deviceId: string;
    transporterId: string;
    clientId: string;
} {
    const record = vehicle as Vehicle & Record<string, unknown>;
    return {
        vehicleId: String(vehicle.externalId || record.id || ""),
        deviceId: refId(record.device),
        transporterId: refId(record.transporter),
        clientId: refId(record.client),
    };
}

export function buildTransporterPayload(
    values: FormValues,
    roles: string[],
    includeRoles = true,
): CreateTransporterRequest {
    const userName = (values.userName ?? values.username)?.trim();
    const companyName = (values.companyName ?? values.company)?.trim();
    if (!userName || !companyName) {
        throw new Error("Username and company name are required to save a transporter.");
    }

    return {
        userName,
        password: values.password,
        confirmPassword: values.confirmPassword,
        companyName,
        client: values.client,
        timezone: values.timezone,
        inactiveTime: Number(values.inactiveTime),
        language: values.language,
        name: text(values.name),
        email: text(values.email),
        phone: text(values.phone),
        address: text(values.address),
        subscriptionStartDate: values.subscriptionStartDate ?? values.subscriptionStart,
        subscriptionDueDate: values.subscriptionDueDate ?? values.subscriptionDue,
        subscriptionExtendDate:
            text(values.subscriptionExtendDate) ??
            text(values.SubscriptionExtendDate) ??
            text(values.subscriptionExtend),
        subscriptionExpiryCount: number(values.subscriptionExpiryCount),
        maximumRadiusForNearestPOI: values.maxPoiRadius,
        minimumDistanceForAddress: values.minAddressDistance,
        dataRestriction: values.dataRestriction || "disabled",
        active: flag(values.active),
        overwriteSubscription: flag(values.overwriteSubscription),
        inactiveAfterExpiry: flag(values.inactiveAfterExpiry),
        ...(includeRoles ? { roles } : {}),
    };
}

export function buildVehiclePayload(values: FormValues): CreateVehicleRequest {
    const device = text(values.vehicleDevice);
    const transporter = text(values.vehicleTransporter);

    return {
        type: "vehicle",
        vehicle: values.vehicleNo.trim().toUpperCase(),
        mileage: Number(values.mileage),
        vehicleType: values.vehicleType.trim().toLowerCase(),
        overspeed: Number(values.overspeed),
        hours: text(values.idleTimeHour),
        // Backend accepts "1".."60", so drop any leading zero (e.g. "05" -> "5").
        minutes: values.idleTimeMinute?.trim() ? String(Number(values.idleTimeMinute)) : undefined,
        client: values.vehicleClient,
        ...(device ? { device } : {}),
        ...(transporter ? { transporter } : {}),
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
        ownedBy: text(values.ownedBy)?.toLowerCase(),
        vehicleBrand: text(values.vehicleBrand),
        vehicleModel: text(values.vehicleModel),
        vehicleBody: text(values.vehicleBody),
        capacity: number(values.capacity),
        manufactureDate: text(values.manufactureDate),
        purchaseDate: text(values.purchaseDate),
        status:
            String(values.status ?? "").toLowerCase() === VehicleStatus.INACTIVE
                ? Status.INACTIVE
                : Status.ACTIVE,
        reason: "New vehicle added",
    };
}

/** Links a transporter or device to an existing vehicle via `/vehicle/update/:id`. */
export function buildVehicleLinkPayload(
    type: Extract<VehicleSaveType, "transporter" | "device">,
    externalId: string,
): UpdateVehicleRequest {
    return type === "transporter"
        ? { type: "transporter", transporter: externalId }
        : { type: "device", device: externalId };
}

export function buildDevicePayload(values: FormValues): CreateDeviceRequest {
    return {
        imei: values.imei.trim(),
        simNumber: values.sim.trim(),
        simOperator: values.simOperator,
        secondarySimNumber: values.secondarySim?.trim() ?? "",
        secondarySimOperator: values.secondarySimOperator ?? "",
        deviceType: values.deviceType,
        client: values.deviceClient,
        password: values.devicePassword ?? "",
        ignitionWireConnected: flag(values.ignitionPositive),
        ignitionWireNotConnected: flag(values.ignitionDisconnected),
        airConditionWireConnected: flag(values.airConditionPositive),
        attendance: flag(values.attendance),
        timezoneSetting: flag(values.timezoneSetting),
    };
}

/** Saves Payment Details tab via `/vehicle/update/:id` with `type: "payment"`. */
export function buildPaymentDetailsPayload(values: FormValues): UpdateVehicleRequest {
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
        type: "payment",
        transporter,
        sellingPrice: number(values.sellingPrice),
        paymentTerm,
        installationDate: text(values.installationDate),
        rentalDueDate: text(values.rentalDueDate),
        technicianName: text(values.technicianName),
        rental: number(values.rental),
        remark: text(values.paymentRemark),
    };
}

