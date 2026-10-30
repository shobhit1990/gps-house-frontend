export const apiErrorMessage = (error: unknown, fallback: string) => {
	if (!error || typeof error !== "object" || !("data" in error)) {
		return error instanceof Error ? error.message : fallback;
	}

	const data = error.data;
	if (!data || typeof data !== "object") return fallback;

	const payload = data as {
		message?: unknown;
		errors?: Array<{ field?: string; message?: string }>;
	};
	if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
	if (Array.isArray(payload.message)) return payload.message.filter((message): message is string => typeof message === "string").join(" ");
	if (Array.isArray(payload.errors)) {
		const details = payload.errors
			.map(({ field, message }) => (message ? `${field ? `${field}: ` : ""}${message}` : ""))
			.filter(Boolean);
		if (details.length > 0) return details.join(" ");
	}
	return fallback;
};
