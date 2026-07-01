import type { ClimateData, ConsultaRequest, ResultadoConsulta, ReglaAgronomica } from "@/types";
import { hasDatabaseConfig, query } from "@/lib/db/postgres";

interface CreateConsultaInput {
  request: ConsultaRequest;
  climateData: ClimateData;
  rules: ReglaAgronomica[];
  result: ResultadoConsulta;
}

interface InteractionBase {
  share_token?: string;
  session_id?: string;
}

export interface SaveInteresadoInput extends InteractionBase {
  email: string;
  localidad?: string;
  cultivo?: string;
}

export interface SaveObservacionInput extends InteractionBase {
  opciones: string[];
  detalle?: string;
}

export interface SaveFeedbackInput extends InteractionBase {
  utilidad?: "si" | "parcialmente" | "no";
  observaciones: string[];
  sugerencia?: string;
}

async function getConsultaIdByShareToken(shareToken?: string) {
  if (!shareToken || !hasDatabaseConfig()) return null;

  const result = await query<{ id: string }>("select id::text from consultas where share_token = $1", [shareToken]);
  return result.rows[0]?.id ?? null;
}

export async function createConsulta(input: CreateConsultaInput) {
  if (!hasDatabaseConfig()) {
    console.info("consulta", {
      request: input.request,
      localidad_normalizada: input.climateData.localidad,
      resultado: input.result,
    });
    return null;
  }

  const result = await query<{ id: string }>(
    `insert into consultas (
      share_token,
      session_id,
      localidad_input,
      localidad_normalizada,
      provincia,
      cultivo,
      fecha_siembra,
      estado_general,
      confianza,
      dias_datos,
      datos_climaticos_usados,
      reglas_evaluadas,
      resultado,
      versiones_reglas
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14)
    returning id::text`,
    [
      input.result.share_token,
      input.request.session_id ?? null,
      input.request.localidad,
      input.climateData.localidad.nombre,
      input.climateData.localidad.provincia,
      input.request.cultivo,
      input.request.fecha_siembra ?? null,
      input.result.estado_general,
      input.result.confianza,
      input.result.dias_datos,
      JSON.stringify(input.climateData),
      JSON.stringify(input.rules),
      JSON.stringify(input.result),
      input.rules.map((rule) => rule.regla_version),
    ],
  );

  return result.rows[0]?.id ?? null;
}

export async function saveInteresado(input: SaveInteresadoInput) {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Email invalido");
  }

  if (!hasDatabaseConfig()) {
    console.info("interesado", { ...input, email });
    return null;
  }

  const consultaId = await getConsultaIdByShareToken(input.share_token);
  const result = await query<{ id: string }>(
    `insert into interesados (consulta_id, session_id, email, localidad, cultivo)
    values ($1, $2, $3, $4, $5)
    returning id::text`,
    [consultaId, input.session_id ?? null, email, input.localidad ?? null, input.cultivo ?? null],
  );

  return result.rows[0]?.id ?? null;
}

export async function saveObservacion(input: SaveObservacionInput) {
  const opciones = input.opciones.map((value) => value.trim()).filter(Boolean);
  const detalle = input.detalle?.trim() || null;

  if (opciones.length === 0 && !detalle) {
    throw new Error("Observacion vacia");
  }

  if (!hasDatabaseConfig()) {
    console.info("observacion", { ...input, opciones, detalle });
    return null;
  }

  const consultaId = await getConsultaIdByShareToken(input.share_token);
  const result = await query<{ id: string }>(
    `insert into observaciones (consulta_id, session_id, opciones, detalle)
    values ($1, $2, $3, $4)
    returning id::text`,
    [consultaId, input.session_id ?? null, opciones, detalle],
  );

  return result.rows[0]?.id ?? null;
}

export async function saveFeedback(input: SaveFeedbackInput) {
  const observaciones = input.observaciones.map((value) => value.trim()).filter(Boolean);
  const sugerencia = input.sugerencia?.trim() || null;

  if (!input.utilidad && observaciones.length === 0 && !sugerencia) {
    throw new Error("Feedback vacio");
  }

  if (!hasDatabaseConfig()) {
    console.info("feedback", { ...input, observaciones, sugerencia });
    return null;
  }

  const consultaId = await getConsultaIdByShareToken(input.share_token);
  const result = await query<{ id: string }>(
    `insert into feedback (consulta_id, session_id, utilidad, observaciones, sugerencia)
    values ($1, $2, $3, $4, $5)
    returning id::text`,
    [consultaId, input.session_id ?? null, input.utilidad ?? null, observaciones, sugerencia],
  );

  return result.rows[0]?.id ?? null;
}
