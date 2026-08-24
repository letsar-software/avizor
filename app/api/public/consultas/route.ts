import { ConsultaService } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import type { ConsultaInput } from "@/types";
import { readJsonBody } from "@/lib/http/json-body";
import { consultaV2Schema, parseInput } from "@/lib/security/validation";
import { enforcePublicConsultationLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    await enforcePublicConsultationLimit(request);
    const body = parseInput(consultaV2Schema, await readJsonBody(request)) as ConsultaInput;
    const result = await new ConsultaService().ejecutar({ ...body, localidad: body.localidad, cultivo: body.cultivo, canal: "web" }, id);
    return success(result, id, { version: "2.0" }, 201);
  } catch (error) { return failure(error, id); }
}
