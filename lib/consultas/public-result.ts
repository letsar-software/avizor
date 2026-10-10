import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { parsePublicId } from "@/lib/security/validation";
import type { ResultadoConsultaV2Publica } from "@/types";

export async function getPublicResult(token: string, execute: typeof query = query, configured = hasDatabaseConfig()) {
  const id = parsePublicId(token);
  if (!configured) throw new DomainError("CONSULTA_NO_ENCONTRADA", "No encontramos esa consulta.", 404);
  const response = await execute<{ id: string; resultado: ResultadoConsultaV2Publica; vigente: boolean }>(
    `select id::text, case when plagas_json is null then resultado else resultado || jsonb_build_object('plagas',plagas_json) end resultado,
      created_at >= now() - interval '30 days' as vigente from consultas where share_token=$1`, [id]);
  const row = response.rows[0];
  if (!row) throw new DomainError("CONSULTA_NO_ENCONTRADA", "No encontramos esa consulta.", 404);
  if (!row.vigente) throw new DomainError("ENLACE_VENCIDO", "Este resultado ya no está disponible. Los resultados de Avizor representan condiciones de un período determinado. Realizá una nueva consulta para obtener información actualizada.", 410);
  // Solo los snapshots V2 pueden presentarse en las pantallas actuales.
  if (!Array.isArray(row.resultado?.reglas) || !Array.isArray(row.resultado?.clima?.serie)) {
    throw new DomainError("CONSULTA_NO_ENCONTRADA", "No encontramos un resultado compatible. Realizá una nueva consulta.", 404);
  }
  return { ...row.resultado, id: row.id, share_token: id };
}
