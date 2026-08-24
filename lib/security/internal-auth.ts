import { timingSafeEqual } from "node:crypto";
import { DomainError } from "@/lib/consultas/service";

export function requireInternalAuth(request: Request) {
  const expected = process.env.AVIZOR_INTERNAL_TOKEN;
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !received) throw new DomainError("NO_AUTORIZADO", "No autorizado.", 401);
  const a = Buffer.from(expected); const b = Buffer.from(received);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new DomainError("NO_AUTORIZADO", "No autorizado.", 401);
  return process.env.AVIZOR_INTERNAL_ACTOR_ID || "service";
}
