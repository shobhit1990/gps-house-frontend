import { PaymentDetailsType, toPaymentDetailsType } from "@/enums/PaymentDetailsType";
import { PaymentTerm, toPaymentTerm } from "@/enums/PaymentTerm";
import { Status } from "@/enums/Status";
import type { CreatePaymentDetailsRequest, PaymentDetails } from "@/interfaces/PaymentDetails";
import type { MasterOption } from "@/interfaces/EntityMaster";

/** UI form state (strings for inputs). */
export type PaymentFormState = {
  type: string;
  transporter: string;
  vehicle: string;
  sellingPrice: string;
  paymentTerm: string;
  installationDate: string;
  rentalDueDate: string;
  technicianName: string;
  rental: string;
  remark: string;
};

export const localDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/** `<input type="date">` needs `YYYY-MM-DD`. */
export const toDateInputValue = (value?: string, fallback = localDate()) => {
  const day = value?.trim().slice(0, 10) ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : fallback;
};

export const toDateDisplay = (value?: string) => {
  const day = toDateInputValue(value, "");
  if (!day) return "—";
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
};

export const numberText = (value: number | string | undefined | null, fallback = "") => {
  if (value == null || value === "") return fallback;
  return String(value);
};

export const displayText = (value?: string | number | null) => {
  if (value == null) return "—";
  const text = String(value).trim();
  return text || "—";
};

export const emptyPaymentForm = (): PaymentFormState => ({
  type: "",
  transporter: "",
  vehicle: "",
  sellingPrice: "0",
  paymentTerm: "",
  installationDate: localDate(),
  rentalDueDate: localDate(),
  technicianName: "",
  rental: "",
  remark: "",
});

export const resolveTransporterId = (
  master: MasterOption[],
  payment?: Pick<PaymentDetails, "transporter" | "transporterName">,
) => {
  if (!payment) return "";

  const byId = master.find(
    (item) => item.id === payment.transporter || item.externalId === payment.transporter,
  );
  if (byId) return byId.id;

  if (payment.transporterName) {
    const name = payment.transporterName.trim().toLowerCase();
    const byName = master.find((item) => item.name.trim().toLowerCase() === name);
    if (byName) return byName.id;
  }

  return payment.transporter || "";
};

export const resolveVehicleId = (
  master: MasterOption[],
  payment?: Pick<PaymentDetails, "vehicle" | "vehicleName">,
) => {
  if (!payment) return "";

  const byId = master.find(
    (item) => item.id === payment.vehicle || item.externalId === payment.vehicle,
  );
  if (byId) return byId.id;

  if (payment.vehicleName) {
    const name = payment.vehicleName.trim().toLowerCase();
    const byName = master.find((item) => item.name.trim().toLowerCase() === name);
    if (byName) return byName.id;
  }

  return payment.vehicle || "";
};

export const transporterDisplayName = (
  row: PaymentDetails,
  nameById?: Map<string, string>,
) =>
  row.transporterName ||
  nameById?.get(row.transporter) ||
  row.transporter ||
  "";

export const vehicleDisplayName = (
  row: PaymentDetails,
  nameById?: Map<string, string>,
) => {
  if (!row.vehicle && !row.vehicleName) return "";
  return (
    row.vehicleName ||
    (row.vehicle ? nameById?.get(row.vehicle) : undefined) ||
    row.vehicle ||
    ""
  );
};

export const formFromPayment = (
  payment: PaymentDetails,
  transporterMaster: MasterOption[] = [],
  vehicleMaster: MasterOption[] = [],
): PaymentFormState => ({
  type: toPaymentDetailsType(payment.type) || payment.type || "",
  transporter: resolveTransporterId(transporterMaster, payment),
  vehicle: resolveVehicleId(vehicleMaster, payment),
  sellingPrice: numberText(payment.sellingPrice, "0"),
  paymentTerm: toPaymentTerm(String(payment.paymentTerm ?? "")),
  installationDate: toDateInputValue(payment.installationDate),
  rentalDueDate: toDateInputValue(payment.rentalDueDate),
  technicianName: payment.technicianName ?? "",
  rental: numberText(payment.rental),
  remark: payment.remark ?? "",
});

/** Build API create/update body from form state. Returns error string or payload. */
export const buildPaymentPayload = (
  form: PaymentFormState,
): { error: string } | { error?: undefined; payload: CreatePaymentDetailsRequest } => {
  const type = toPaymentDetailsType(form.type) || form.type.trim();
  if (!type || !form.transporter.trim() || !form.paymentTerm) {
    return { error: "Type, Transporter and Payment Term are required." };
  }
  if (type === PaymentDetailsType.VEHICLE && !form.vehicle.trim()) {
    return { error: "Vehicle is required when type is Vehicle." };
  }

  const selling = form.sellingPrice.trim() ? Number(form.sellingPrice) : undefined;
  const rentalAmount = form.rental.trim() ? Number(form.rental) : undefined;

  if (form.sellingPrice.trim() && !Number.isFinite(selling)) {
    return { error: "Enter a valid selling price." };
  }
  if (form.rental.trim() && !Number.isFinite(rentalAmount)) {
    return { error: "Enter a valid rental amount." };
  }

  return {
    payload: {
      type,
      transporter: form.transporter.trim(),
      ...(type === PaymentDetailsType.VEHICLE && form.vehicle.trim()
        ? { vehicle: form.vehicle.trim() }
        : {}),
      paymentTerm: form.paymentTerm as PaymentTerm,
      status: Status.ACTIVE,
      ...(selling != null ? { sellingPrice: selling } : {}),
      ...(form.installationDate ? { installationDate: form.installationDate } : {}),
      ...(form.rentalDueDate ? { rentalDueDate: form.rentalDueDate } : {}),
      ...(form.technicianName.trim() ? { technicianName: form.technicianName.trim() } : {}),
      ...(rentalAmount != null ? { rental: rentalAmount } : {}),
      ...(form.remark.trim() ? { remark: form.remark.trim() } : {}),
    },
  };
};
