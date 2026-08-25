import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { query } from "@/lib/db/postgres";

const SCRYPT_KEYLEN = 64;
const SESSION_TTL_HOURS = 12;
export const ADMIN_SESSION_COOKIE = "avizor_admin_session";

export type AdminRole = "administrador" | "agronomo" | "soporte";
export interface AdminActor { id: string; email: string; nombre: string; rol: AdminRole }

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(usuarioId: string) {
  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);
  await query("insert into sesiones_admin(usuario_id,token_hash,expira_en) values($1,$2,$3)", [usuarioId, hashToken(token), expiraEn.toISOString()]);
  return { token, expiraEn };
}

export async function getAdminSession(token: string | undefined): Promise<AdminActor | null> {
  if (!token) return null;
  const result = await query<AdminActor>(
    `select u.id,u.email,u.nombre,u.rol from sesiones_admin s
     join usuarios_admin u on u.id = s.usuario_id
     where s.token_hash = $1 and s.expira_en > now() and u.estado = 'activo'`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}

export async function revokeAdminSession(token: string) {
  await query("delete from sesiones_admin where token_hash=$1", [hashToken(token)]);
}
