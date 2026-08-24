import { NextResponse } from "next/server";
import { DomainError } from "@/lib/consultas/service";

export function requestId(request: Request) { return request.headers.get("x-request-id")?.slice(0, 100) || crypto.randomUUID(); }
export function success(data: unknown, id: string, meta: Record<string, unknown> = {}, status = 200) { return NextResponse.json({ data, meta, request_id: id }, { status, headers: { "x-request-id": id } }); }
export function failure(error: unknown, id: string) {
  if (!(error instanceof DomainError)) console.error("Unhandled API error", { request_id: id, error });
  const domain = error instanceof DomainError ? error : new DomainError("ERROR_INTERNO", "No pudimos completar la solicitud.", 500);
  const headers: Record<string, string> = { "x-request-id": id };
  if (domain.status === 429 && typeof domain.details.retry_after === "number") headers["Retry-After"] = String(domain.details.retry_after);
  return NextResponse.json({ error: { code: domain.code, message: domain.message, details: domain.details }, request_id: id }, { status: domain.status, headers });
}
