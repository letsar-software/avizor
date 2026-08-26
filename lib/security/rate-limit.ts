import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";

export const RATE_LIMITS = {
  publicConsultation: { scope: "public_consultation", limit: 20, windowSeconds: 3600 },
  emailSave: { scope: "email_save", limit: 3, windowSeconds: 3600 },
  enterpriseBurst: { scope: "enterprise_burst", limit: 30, windowSeconds: 60 },
  adminLogin: { scope: "admin_login", limit: 8, windowSeconds: 900 },
  adminInviteAccept: { scope: "admin_invite_accept", limit: 10, windowSeconds: 900 },
} as const;

export type RateLimitDefinition = { scope: string; limit: number; windowSeconds: number };
type Query = typeof query;

export function resolveClientIp(request: Request) {
  const proxy = process.env.RATE_LIMIT_TRUSTED_PROXY;
  if (proxy === "railway") {
    const value = request.headers.get("x-real-ip")?.trim() ?? "";
    if (isIP(value)) return value;
    throw new DomainError("IP_CLIENTE_NO_DISPONIBLE", "No pudimos validar el origen de la solicitud.", 503);
  }
  if (process.env.NODE_ENV === "production") {
    throw new DomainError("RATE_LIMIT_NO_CONFIGURADO", "El servicio no está disponible temporalmente.", 503);
  }
  return "development-local";
}

function hashIdentity(scope: string, identity: string) {
  const secret = process.env.RATE_LIMIT_HASH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new DomainError("RATE_LIMIT_NO_CONFIGURADO", "El servicio no está disponible temporalmente.", 503);
  }
  return createHmac("sha256", secret || "avizor-development-only").update(`${scope}:${identity}`).digest("hex");
}

export async function enforceRateLimit(limit: RateLimitDefinition, identity: string, queryImpl: Query = query) {
  if (!hasDatabaseConfig()) {
    if (process.env.NODE_ENV === "production") throw new DomainError("RATE_LIMIT_NO_CONFIGURADO", "El servicio no está disponible temporalmente.", 503);
    return { remaining: limit.limit, retryAfter: limit.windowSeconds };
  }
  const identityHash = hashIdentity(limit.scope, identity.trim().toLowerCase());
  return consumeRateLimit(limit, identityHash, queryImpl);
}

export async function consumeRateLimit(limit: RateLimitDefinition, identityHash: string, queryImpl: Query) {
  const result = await queryImpl<{ request_count: number; retry_after: number }>(
    `insert into rate_limit_buckets(scope,identity_hash,window_start,request_count,expires_at)
     values($1,$2,to_timestamp(floor(extract(epoch from now())/$3)*$3),1,to_timestamp(floor(extract(epoch from now())/$3)*$3)+make_interval(secs=>$3))
     on conflict(scope,identity_hash,window_start) do update
       set request_count=rate_limit_buckets.request_count+1
       where rate_limit_buckets.request_count < $4
     returning request_count, greatest(1,ceil(extract(epoch from (expires_at-now()))))::integer retry_after`,
    [limit.scope, identityHash, limit.windowSeconds, limit.limit],
  );
  await queryImpl("delete from rate_limit_buckets where expires_at < now()").catch(() => undefined);
  const row = result.rows[0];
  if (!row) throw new DomainError("RATE_LIMIT_EXCEDIDO", "Se alcanzó el límite de solicitudes. Intentá nuevamente más tarde.", 429, { retry_after: limit.windowSeconds });
  return { remaining: Math.max(0, limit.limit - row.request_count), retryAfter: row.retry_after };
}

export function enforcePublicConsultationLimit(request: Request) {
  return enforceRateLimit(RATE_LIMITS.publicConsultation, resolveClientIp(request));
}

export function enforceEmailSaveLimit(email: string) {
  return enforceRateLimit(RATE_LIMITS.emailSave, email);
}

export function enforceEnterpriseBurstLimit(apiKeyId: string) {
  return enforceRateLimit(RATE_LIMITS.enterpriseBurst, apiKeyId);
}
