export function statusChangeBody(
  status: string,
  reason?: string,
  record?: Record<string, unknown>,
) {
  const payload: Record<string, unknown> = { ...record, status };
  if (status.toLowerCase() === "inactive" && reason?.trim()) {
    payload.reason = reason.trim();
  }
  return payload;
}

/** Always read status-change reason from API field `reason`. */
export function normalizeReason(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}
