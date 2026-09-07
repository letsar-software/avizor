import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { parsePublicId } from "@/lib/security/validation";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid=requestId(request); try { if(!hasDatabaseConfig()) throw new DomainError("CONSULTA_NO_ENCONTRADA","No encontramos esa consulta.",404);
    const result=await query<{resultado:unknown;vigente:boolean}>("select case when plagas_json is null then resultado else resultado || jsonb_build_object('plagas',plagas_json) end resultado, created_at >= now() - interval '30 days' as vigente from consultas where share_token=$1",[parsePublicId((await params).id)]);
    if(!result.rows[0]) throw new DomainError("CONSULTA_NO_ENCONTRADA","No encontramos esa consulta.",404);
    if(!result.rows[0].vigente) throw new DomainError("ENLACE_VENCIDO","Este resultado ya no estÃ¡ disponible. Los resultados de Avizor representan condiciones de un perÃ­odo determinado. RealizÃ¡ una nueva consulta para obtener informaciÃ³n actualizada.",410);
    return success(result.rows[0].resultado,rid);
  } catch(error){return failure(error,rid);} }
