import type { ClimateData, ConsultaRequest, ResultadoConsulta, ReglaAgronomica } from "@/types";
import { hasSupabaseConfig, supabaseRest } from "@/lib/supabase/rest";

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

  if (!hasSupabaseConfig()) {
    console.info("consulta_log", payload);
    return;
  }

  await supabaseRest("consulta_logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
