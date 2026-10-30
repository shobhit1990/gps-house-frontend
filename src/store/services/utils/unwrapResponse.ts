/** Backend responses come either as the bare value or wrapped as `{ data: value }`. */
export type ApiEnvelope<T> = T | { data?: T };

export function unwrapResponse<T>(response: ApiEnvelope<T>): T | undefined {
  if (response && typeof response === "object" && !Array.isArray(response) && "data" in response) {
    return response.data;
  }
  return response as T;
}

export function unwrapList<T>(response: ApiEnvelope<T[]>): T[] {
  const list = unwrapResponse(response);
  return Array.isArray(list) ? list : [];
}
