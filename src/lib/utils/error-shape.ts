/**
 * Narrowing helpers for values caught in a `catch` block.
 *
 * A thrown value is `unknown`: it is usually an `Error`, but third-party
 * clients and API wrappers also throw plain objects that carry extra fields
 * (`status`, `response.data`). These helpers read those fields without
 * widening the caught value back to `any`.
 */

/** Treat a caught value as an indexable object, or `undefined` if it is not one. */
export const asErrorRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;

/** HTTP status attached to an API error, when it carries one. */
export const getErrorStatus = (error: unknown): number | undefined => {
  const status = asErrorRecord(error)?.status;
  return typeof status === "number" ? status : undefined;
};

/** `message` of a caught value, for both `Error` instances and message-shaped objects. */
export const getErrorMessage = (error: unknown): string | undefined => {
  const message = asErrorRecord(error)?.message;
  return typeof message === "string" ? message : undefined;
};

/** `response.data` payload attached to an API error, when it carries one. */
export const getErrorResponseData = (error: unknown): unknown => {
  const response = asErrorRecord(asErrorRecord(error)?.response);
  return response?.data;
};
