/** Builds multipart form data from a flat payload, skipping empty values and stringifying the rest. */
export function toFormData(body: object): FormData {
  const formData = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, value instanceof Blob ? value : String(value));
  });
  return formData;
}
