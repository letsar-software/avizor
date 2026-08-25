import { cookies } from "next/headers";
import { query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { readJsonBody } from "@/lib/http/json-body";
import { adminLoginSchema, parseInput } from "@/lib/security/validation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { ADMIN_SESSION_COOKIE, createAdminSession, verifyPassword, type AdminRole } from "@/lib/admin/auth";

interface AdminUserRow { id: string; nombre: string; rol: AdminRole; password_hash: string | null; estado: string }

export async function POST(request: Request) {
  const rid = requestId(request);
  try {
    const body = parseInput(adminLoginSchema, await readJsonBody(request));
    await enforceRateLimit(RATE_LIMITS.adminLogin, body.email);

    const result = await query<AdminUserRow>("select id,nombre,rol,password_hash,estado from usuarios_admin where email=$1", [body.email]);
    const user = result.rows[0];
    if (!user || user.estado !== "activo" || !user.password_hash || !verifyPassword(body.password, user.password_hash)) {
      throw new DomainError("CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos.", 401);
    }

    const session = await createAdminSession(user.id);
    await query("update usuarios_admin set ultimo_acceso=now() where id=$1", [user.id]);

    (await cookies()).set(ADMIN_SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiraEn,
    });

    return success({ id: user.id, nombre: user.nombre, rol: user.rol }, rid);
  } catch (error) {
    return failure(error, rid);
  }
}
