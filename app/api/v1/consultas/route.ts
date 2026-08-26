import { ConsultaService } from "@/lib/consultas/service";
import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { failure, requestId, success } from "@/lib/http/responses";
import { authenticateApiKey } from "@/lib/security/api-keys";
import type { ConsultaInput } from "@/types";
import { readJsonBody } from "@/lib/http/json-body";
import { consultaV2Schema, parseInput } from "@/lib/security/validation";
import { enforceEnterpriseBurstLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const id = requestId(request); const started = performance.now(); let keyId: string | null = null; let status = 201;
  try {
    keyId = await authenticateApiKey(request, "consultas:crear", { requestId: id, endpoint: "POST /api/v1/consultas" });
    await enforceEnterpriseBurstLimit(keyId);
    const body = parseInput(consultaV2Schema, await readJsonBody(request)) as ConsultaInput;
    const result = await new ConsultaService().ejecutar({ ...body, canal: "api_empresa" }, id);
    return success(result, id, { version: "v1" }, status);
  } catch (error) { status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500; return failure(error, id); }
  finally { if (keyId && hasDatabaseConfig()) await query("update api_uso set status=$3,duracion_ms=$4 where api_key_id=$1 and request_id=$2", [keyId,id,status,Math.round(performance.now()-started)]).catch(() => undefined); }
}
