/** Shared input sanitizers and validators for forms. */

export const PHONE_MAX_LENGTH = 10;
export const PHONE_PATTERN = /^\d{10}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Keep digits only, optionally capped. */
export const digitsOnly = (value: string, maxLength?: number) => {
	const digits = value.replace(/\D/g, "");
	return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
};

/** Digits and at most one decimal point (for amounts / readings). */
export const decimalOnly = (value: string) => {
	const cleaned = value.replace(/[^\d.]/g, "");
	const [whole, ...rest] = cleaned.split(".");
	return rest.length > 0 ? `${whole}.${rest.join("").replace(/\./g, "")}` : whole;
};

export const isValidPhone = (value: string, required = false) => {
	const phone = value.trim();
	if (!phone) return !required;
	return PHONE_PATTERN.test(phone);
};

export const isValidEmail = (value: string, required = false) => {
	const email = value.trim();
	if (!email) return !required;
	return EMAIL_PATTERN.test(email);
};

export const phoneErrorMessage = "Phone number must be exactly 10 digits.";
export const emailErrorMessage = "Enter a valid email address.";
