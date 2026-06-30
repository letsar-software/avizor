import type { ClimateData, ConsultaRequest, ResultadoConsulta, ReglaAgronomica } from "@/types";
import { hasDatabaseConfig, query } from "@/lib/db/postgres";

interface ConsultaLogInput {
  request: ConsultaRequest;
  climateData?: ClimateData;
  rules?: ReglaAgronomica[];
  result?: ResultadoConsulta;
  error?: unknown;
}

export async function logConsulta(input: ConsultaLogInput) {
  const payload = {
    localidad: input.request.localidad,
    cultivo: input.request.cultivo,
    session_id: input.request.session_id ?? null,
    fecha_siembra: input.request.fecha_siembra ?? null,
    datos_climaticos_usados: input.climateData ?? null,
    reglas_evaluadas: input.rules ?? [],
    resultado: input.result ?? null,
    versiones_reglas: input.rules?.map((rule) => rule.regla_version) ?? [],
    error: input.error instanceof Error ? input.error.message : input.error ? String(input.error) : null,
  };

  if (!hasDatabaseConfig()) {
    console.info("consulta_log", payload);
    return;
  }

  try {
    await query(
      `insert into consulta_logs (
      localidad,
      cultivo,
      session_id,
      fecha_siembra,
      datos_climaticos_usados,
      reglas_evaluadas,
      resultado,
      versiones_reglas,
      error
    ) values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9)`,
    [
      payload.localidad,
      payload.cultivo,
      payload.session_id,
      payload.fecha_siembra,
      payload.datos_climaticos_usados ? JSON.stringify(payload.datos_climaticos_usados) : null,
      JSON.stringify(payload.reglas_evaluadas),
      payload.resultado ? JSON.stringify(payload.resultado) : null,
      payload.versiones_reglas,
        payload.error,
      ],
    );
  } catch (error) {
    console.error("No se pudo guardar consulta_log", error);
  }
}


