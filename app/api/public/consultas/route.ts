import { ConsultaService } from "@/lib/consultas/service";
import { failure, requestId, success } from "@/lib/http/responses";
import type { ConsultaInput } from "@/types";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const body = await request.json() as Partial<ConsultaInput>;
    if (typeof body.localidad !== "string" || typeof body.cultivo !== "string") throw new Error("invalid");
    const result = await new ConsultaService().ejecutar({ ...body, localidad: body.localidad, cultivo: body.cultivo, canal: "web" }, id);
    return success(result, id, { version: "2.0" }, 201);
  } catch (error) { return failure(error, id); }
}
