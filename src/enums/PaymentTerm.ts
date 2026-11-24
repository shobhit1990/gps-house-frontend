/** API values for payment details `paymentTerm`. */
export enum PaymentTerm {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  HALFYEARLY = "halfYearly",
  QUARTERLY = "quarterly",
}

export const paymentTermOptions = [
  { value: PaymentTerm.MONTHLY, label: "Monthly" },
  { value: PaymentTerm.QUARTERLY, label: "Quarterly" },
  { value: PaymentTerm.HALFYEARLY, label: "Half Yearly" },
  { value: PaymentTerm.YEARLY, label: "Yearly" },
] as const;

/** Normalize API/UI/legacy values into a valid PaymentTerm. */
export const toPaymentTerm = (value: string | undefined | null): PaymentTerm => {
  const raw = String(value ?? "").trim();
  const exact = Object.values(PaymentTerm).find((term) => term === raw);
  if (exact) return exact;

  const normalized = raw.toLowerCase().replace(/[\s_-]+/g, "");
  // Legacy misspellings: monthely / quaterly
  if (normalized.includes("month") || normalized === "monthely") return PaymentTerm.MONTHLY;
  if (normalized.includes("quat") || normalized.includes("quart")) return PaymentTerm.QUARTERLY;
  if (normalized.includes("half")) return PaymentTerm.HALFYEARLY;
  if (normalized.includes("year")) return PaymentTerm.YEARLY;
  return PaymentTerm.MONTHLY;
};

export const paymentTermLabel = (value?: string | null) => {
  const term = toPaymentTerm(value);
  return paymentTermOptions.find((option) => option.value === term)?.label ?? term;
};
