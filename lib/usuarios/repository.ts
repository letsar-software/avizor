import { query } from "@/lib/db/postgres";
import { hashPassword } from "@/lib/admin/auth";
import type { AdminUsuario } from "@/types";

// Todas las consultas acá seleccionan columnas explícitas, nunca `select *`:
// password_hash no debe poder filtrarse a una respuesta de API por descuido.
const COLUMNAS = `u.id, u.email, u.nombre, u.rol, u.estado, u.invitado_por, i.nombre as invitado_por_nombre,
  u.ultimo_acceso::text, u.created_at::text, u.updated_at::text`;

export async function getUsuarios() {
  const result = await query<AdminUsuario>(
    `select ${COLUMNAS} from usuarios_admin u left join usuarios_admin i on i.id = u.invitado_por order by u.nombre`,
  );
  return result.rows;
}

export async function getUsuarioById(id: string) {
  const result = await query<AdminUsuario>(
    `select ${COLUMNAS} from usuarios_admin u left join usuarios_admin i on i.id = u.invitado_por where u.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getUsuarioByEmail(email: string) {
  const result = await query<{ id: string }>("select id from usuarios_admin where email = $1", [email]);
  return result.rows[0] ?? null;
}

// Nace 'invitado' y sin password_hash: el admin ya no elige la contraseña de otro
// usuario (ver lib/admin/auth.ts, createAdminInvitation). El caller de la ruta es
// quien genera y devuelve la invitación después de este insert.
export async function createUsuario(input: { email: string; nombre: string; rol: AdminUsuario["rol"]; invitadoPor: string | null }) {
  const result = await query<AdminUsuario>(
    `insert into usuarios_admin(email,nombre,rol,estado,invitado_por)
     values($1,$2,$3,'invitado',$4)
     returning id, email, nombre, rol, estado, invitado_por, null as invitado_por_nombre, ultimo_acceso::text, created_at::text, updated_at::text`,
    [input.email, input.nombre, input.rol, input.invitadoPor],
  );
  return result.rows[0];
}

export async function updateUsuario(id: string, patch: { nombre?: string; rol?: AdminUsuario["rol"]; estado?: AdminUsuario["estado"]; password?: string }) {
  const result = await query<AdminUsuario>(
    `update usuarios_admin set
       nombre = coalesce($2, nombre),
       rol = coalesce($3, rol),
       estado = coalesce($4, estado),
       password_hash = coalesce($5, password_hash),
       updated_at = now()
     where id = $1
     returning id, email, nombre, rol, estado, invitado_por, null as invitado_por_nombre, ultimo_acceso::text, created_at::text, updated_at::text`,
    [id, patch.nombre ?? null, patch.rol ?? null, patch.estado ?? null, patch.password ? hashPassword(patch.password) : null],
  );
  return result.rows[0] ?? null;
}
