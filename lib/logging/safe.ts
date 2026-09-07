type SafeLogContext = {
  operation: string;
  request_id?: string;
  error_code?: string;
  status?: number;
};

function event(context: SafeLogContext, level: "error" | "info") {
  return JSON.stringify({
    event: level === "error" ? "application_error" : "application_event",
    timestamp: new Date().toISOString(),
    operation: context.operation,
    ...(context.request_id ? { request_id: context.request_id.slice(0, 100) } : {}),
    ...(context.error_code ? { error_code: context.error_code } : {}),
    ...(typeof context.status === "number" ? { status: context.status } : {}),
  });
}

/** Emits only an allow-listed diagnostic envelope; it never serializes the error or request payload. */
export function logSafeError(context: SafeLogContext) {
  console.error(event(context, "error"));
}

/** Emits only an allow-listed operational envelope; it never serializes input data. */
export function logSafeInfo(context: Omit<SafeLogContext, "error_code" | "status">) {
  console.info(event(context, "info"));
}
