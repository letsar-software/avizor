import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import type { ClimateSeriesResult } from "@/lib/climate/contract";
import type { ConsultaInput, LocalidadNormalizada, ReglaAgronomicaV2 } from "@/types";
import type { ConsultaResultadoV2 } from "./service";

export async function persistConsultaV2(data: { input: ConsultaInput; localidad: LocalidadNormalizada; climate: ClimateSeriesResult; rules: ReglaAgronomicaV2[]; result: ConsultaResultadoV2 }) {
  if (!hasDatabaseConfig()) return null;
  const result = await query<{ id: string }>(`insert into consultas (
    share_token, session_id, localidad_input, localidad_normalizada, provincia, cultivo, fecha_siembra, estado_general, confianza,
    dias_datos, datos_climaticos_usados, reglas_evaluadas, resultado, versiones_reglas, localidad_original, latitud, longitud,
    fecha_ref, canal, entrada_json, clima_json, indicadores_json, resultados_json, contexto_fenologico_json, proveedor_climatico,
    duracion_ms, request_id, plagas_json
  ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18,$19,$20::jsonb,$21::jsonb,$22::jsonb,$23::jsonb,$24::jsonb,$25,$26,$27,$28::jsonb)
  returning id::text`, [data.result.share_token, data.input.sessionId ?? null, data.input.localidad, data.localidad.nombre, data.localidad.provincia,
    data.input.cultivo, data.input.fechaSiembra ?? null, data.result.estado_general, coverageLabel(data.climate.cobertura), data.climate.serie.length,
    JSON.stringify(data.climate), JSON.stringify(data.rules), JSON.stringify(data.result), data.rules.map((rule) => rule.version), data.input.localidad,
    data.localidad.latitud, data.localidad.longitud, data.input.fechaRef, data.input.canal, JSON.stringify(data.input), JSON.stringify(data.climate),
    JSON.stringify(data.result.reglas.flatMap((rule) => rule.observado)), JSON.stringify(data.result.reglas), JSON.stringify(data.result.contexto_fenologico),
    data.climate.proveedor, data.result.duracion_ms, data.result.request_id, JSON.stringify(data.result.plagas ?? null)]);
  return result.rows[0]?.id ?? null;
}
function coverageLabel(coverage: number) { return coverage >= 1 ? "Alta" : coverage >= 0.5 ? "Media" : "Baja"; }
