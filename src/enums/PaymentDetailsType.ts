/** API values for payment details `type`. */
export enum PaymentDetailsType {
  VEHICLE = "vehicle",
  TRANSPORTER = "transporter",
}

export const paymentDetailsTypeOptions = [
  { value: PaymentDetailsType.VEHICLE, label: "Vehicle" },
  { value: PaymentDetailsType.TRANSPORTER, label: "Transporter" },
] as const;

/** Normalize API/UI values into a valid PaymentDetailsType (or empty). */
export const toPaymentDetailsType = (value: string | undefined | null): PaymentDetailsType | "" => {
  const raw = String(value ?? "").trim();
  const exact = Object.values(PaymentDetailsType).find((type) => type === raw);
  if (exact) return exact;

  const normalized = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (normalized.includes("vehicle")) return PaymentDetailsType.VEHICLE;
  if (normalized.includes("transport")) return PaymentDetailsType.TRANSPORTER;
  return "";
};

export const paymentDetailsTypeLabel = (value?: string | null) => {
  const type = toPaymentDetailsType(value);
  if (!type) return String(value ?? "").trim() || "—";
  return paymentDetailsTypeOptions.find((option) => option.value === type)?.label ?? type;
};
