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
	const fieldErrors = Array.isArray(payload.errors)
		? payload.errors
				.map(({ field, message }) => (message ? `${field ? `${field}: ` : ""}${message}` : ""))
				.filter(Boolean)
		: [];
	const fieldSummary = fieldErrors.join(" ");
	if (typeof payload.message === "string" && payload.message.trim()) {
		return fieldSummary ? `${payload.message} ${fieldSummary}` : payload.message;
	}
	if (Array.isArray(payload.message)) {
		const summary = payload.message.filter((message): message is string => typeof message === "string").join(" ");
		if (summary) return fieldSummary ? `${summary} ${fieldSummary}` : summary;
	}
	if (fieldSummary) return fieldSummary;
	return fallback;
};
