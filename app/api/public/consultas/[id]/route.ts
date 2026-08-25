import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { DomainError } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import { parsePublicId } from "@/lib/security/validation";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rid=requestId(request); try { if(!hasDatabaseConfig()) throw new DomainError("CONSULTA_NO_ENCONTRADA","No encontramos esa consulta.",404);
    const result=await query<{resultado:unknown}>("select case when plagas_json is null then resultado else resultado || jsonb_build_object('plagas',plagas_json) end resultado from consultas where share_token=$1",[parsePublicId((await params).id)]);
    if(!result.rows[0]) throw new DomainError("CONSULTA_NO_ENCONTRADA","No encontramos esa consulta.",404); return success(result.rows[0].resultado,rid);
  } catch(error){return failure(error,rid);} }
