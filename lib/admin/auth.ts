import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { query as defaultQuery } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { ADMIN_ROLES } from "@/lib/admin/user-spec";

const SCRYPT_KEYLEN = 64;
const SESSION_TTL_HOURS = 12;
const INVITATION_TTL_HOURS = 24 * 7;

export type AdminRole = typeof ADMIN_ROLES[number];
export interface AdminActor { id: string; email: string; nombre: string; rol: AdminRole }

// Mismo patrón de inyección que lib/security/rate-limit.ts: la dependencia de datos entra
// como parámetro con default, así cada función es testeable sin tocar Postgres.
type Query = typeof defaultQuery;

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

interface AdminUserRow { id: string; nombre: string; rol: AdminRole; password_hash: string | null; estado: string }

export async function authenticateAdmin(email: string, password: string, queryImpl: Query = defaultQuery) {
  const result = await queryImpl<AdminUserRow>("select id,nombre,rol,password_hash,estado from usuarios_admin where email=$1", [email]);
  const user = result.rows[0];
  if (!user || user.estado !== "activo" || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    throw new DomainError("CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos.", 401);
  }
  return { id: user.id, nombre: user.nombre, rol: user.rol };
}

export async function touchAdminLastAccess(usuarioId: string, queryImpl: Query = defaultQuery) {
  await queryImpl("update usuarios_admin set ultimo_acceso=now() where id=$1", [usuarioId]);
}

export async function createAdminSession(usuarioId: string, queryImpl: Query = defaultQuery) {
  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);
  await queryImpl("insert into sesiones_admin(usuario_id,token_hash,expira_en) values($1,$2,$3)", [usuarioId, hashToken(token), expiraEn.toISOString()]);
  return { token, expiraEn };
}

export async function getAdminSession(token: string | undefined, queryImpl: Query = defaultQuery): Promise<AdminActor | null> {
  if (!token) return null;
  const result = await queryImpl<AdminActor>(
    `select u.id,u.email,u.nombre,u.rol from sesiones_admin s
     join usuarios_admin u on u.id = s.usuario_id
     where s.token_hash = $1 and s.expira_en > now() and u.estado = 'activo'`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}

export async function revokeAdminSession(token: string, queryImpl: Query = defaultQuery) {
  await queryImpl("delete from sesiones_admin where token_hash=$1", [hashToken(token)]);
}

// Invitación de usuarios (RN de alta: el admin nunca elige la contraseña de otro
// usuario). No hay envío de email en el proyecto, así que el token se genera y se
// devuelve una sola vez para que el panel lo muestre como enlace copiable — mismo
// patrón que la clave de una API key nueva.
export interface AdminInvitation { id: string; usuarioId: string; email: string; nombre: string; rol: AdminRole }

export async function createAdminInvitation(usuarioId: string, queryImpl: Query = defaultQuery) {
  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + INVITATION_TTL_HOURS * 3600 * 1000);
  await queryImpl("insert into invitaciones_admin(usuario_id,token_hash,expira_en) values($1,$2,$3)", [usuarioId, hashToken(token), expiraEn.toISOString()]);
  return { token, expiraEn };
}

interface InvitationRow { id: string; usuario_id: string; email: string; nombre: string; rol: AdminRole; expira_en: string; aceptada_en: string | null; estado: string }

// Válida solo si no venció, no se aceptó todavía y el usuario sigue en estado 'invitado'
// (si un admin lo pasó a otro estado mientras tanto, el enlace deja de servir).
export async function getAdminInvitation(token: string, queryImpl: Query = defaultQuery): Promise<AdminInvitation | null> {
  const result = await queryImpl<InvitationRow>(
    `select i.id, i.usuario_id, u.email, u.nombre, u.rol, i.expira_en::text, i.aceptada_en::text, u.estado
     from invitaciones_admin i join usuarios_admin u on u.id = i.usuario_id
     where i.token_hash = $1`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  if (!row || row.aceptada_en || row.estado !== "invitado" || new Date(row.expira_en) <= new Date()) return null;
  return { id: row.id, usuarioId: row.usuario_id, email: row.email, nombre: row.nombre, rol: row.rol };
}

export async function acceptAdminInvitation(token: string, password: string, queryImpl: Query = defaultQuery) {
  const invitation = await getAdminInvitation(token, queryImpl);
  if (!invitation) throw new DomainError("INVITACION_INVALIDA", "El enlace de invitación no es válido o venció.", 410);

  await queryImpl("update usuarios_admin set password_hash=$2, estado='activo', updated_at=now() where id=$1", [invitation.usuarioId, hashPassword(password)]);
  await queryImpl("update invitaciones_admin set aceptada_en=now() where id=$1", [invitation.id]);
  return { id: invitation.usuarioId, email: invitation.email, nombre: invitation.nombre, rol: invitation.rol };
}
