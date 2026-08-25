import { query } from "@/lib/db/postgres";
import type { Empresa } from "@/types";

export async function getEmpresas() {
  const result = await query<Empresa>("select * from empresas order by nombre");
  return result.rows;
}

export async function getEmpresaById(id: string) {
  const result = await query<Empresa>("select * from empresas where id = $1", [id]);
  return result.rows[0] ?? null;
}

export async function createEmpresa(input: { nombre: string; contacto_nombre?: string | null; contacto_email?: string | null }) {
  const result = await query<Empresa>(
    "insert into empresas(nombre,contacto_nombre,contacto_email) values($1,$2,$3) returning *",
    [input.nombre, input.contacto_nombre ?? null, input.contacto_email ?? null],
  );
  return result.rows[0];
}

export async function updateEmpresa(id: string, patch: { nombre?: string; contacto_nombre?: string | null; contacto_email?: string | null; estado?: Empresa["estado"] }) {
  const result = await query<Empresa>(
    `update empresas set
       nombre = coalesce($2, nombre),
       contacto_nombre = coalesce($3, contacto_nombre),
       contacto_email = coalesce($4, contacto_email),
       estado = coalesce($5, estado),
       updated_at = now()
     where id = $1 returning *`,
    [id, patch.nombre ?? null, patch.contacto_nombre ?? null, patch.contacto_email ?? null, patch.estado ?? null],
  );
  return result.rows[0] ?? null;
}
