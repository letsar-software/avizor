import { NextResponse } from "next/server";
import type { ConsultaErrorCode, ConsultaRequest, ResultadoConsulta } from "@/types";
import { ClimateProvider } from "@/lib/climate/provider";
import { logConsulta } from "@/lib/consultas/logs";
import { createConsulta } from "@/lib/consultas/repository";
import { featureFlags } from "@/lib/config/featureFlags";
import { normalizeLocalidad } from "@/lib/localidades/normalize";
import { getReglasAgronomicas } from "@/lib/rules/repository";
import { RulesEngine } from "@/lib/rules/engine";
import { ScoreEngine } from "@/lib/rules/score";

const USER_MESSAGES: Record<ConsultaErrorCode, string> = {
  CLIMA_NO_DISPONIBLE: "No pudimos obtener datos climáticos. Intentá nuevamente en unos minutos.",
  LOCALIDAD_NO_RECONOCIDA: "No encontramos esa localidad. Probá con el nombre completo.",
  CULTIVO_NO_SOPORTADO: "Avizor todavía no cubre ese cultivo. Por ahora solo soja está disponible.",
  REGLAS_NO_DISPONIBLES: "No pudimos evaluar las reglas agronómicas. Intentá nuevamente en unos minutos.",
  REQUEST_INVALIDO: "La consulta no tiene los datos necesarios.",
};

function jsonError(code: ConsultaErrorCode, status: number) {
  return NextResponse.json({ error: USER_MESSAGES[code], code }, { status });
}

function isValidRequest(value: unknown): value is ConsultaRequest {
  if (!value || typeof value !== "object") return false;

  const request = value as Partial<ConsultaRequest>;
  return typeof request.localidad === "string" && request.localidad.trim().length > 0 && typeof request.cultivo === "string";
}

function normalizeCultivo(cultivo: string) {
  return cultivo.trim().toLowerCase();
}

function isCultivoSoportado(cultivo: string) {
  if (cultivo === "soja") return true;
  if (cultivo === "maiz" || cultivo === "maíz") return featureFlags.enableMaiz;
  return false;
}

export async function POST(request: Request) {
  let body: ConsultaRequest | null = null;

  try {
    const payload = await request.json();

    if (!isValidRequest(payload)) {
      return jsonError("REQUEST_INVALIDO", 400);
    }

    body = {
      ...payload,
      localidad: payload.localidad.trim(),
      cultivo: normalizeCultivo(payload.cultivo),
    };

    if (!isCultivoSoportado(body.cultivo)) {
      await logConsulta({ request: body, error: USER_MESSAGES.CULTIVO_NO_SOPORTADO });
      return jsonError("CULTIVO_NO_SOPORTADO", 400);
    }

    const localidad = normalizeLocalidad(body.localidad);

    if (!localidad) {
      await logConsulta({ request: body, error: USER_MESSAGES.LOCALIDAD_NO_RECONOCIDA });
      return jsonError("LOCALIDAD_NO_RECONOCIDA", 404);
    }

    let rules;
    try {
      rules = await getReglasAgronomicas(body.cultivo);
    } catch (error) {
      await logConsulta({ request: body, error });
      return jsonError("REGLAS_NO_DISPONIBLES", 503);
    }

    if (rules.length === 0) {
      await logConsulta({ request: body, rules, error: "No hay reglas activas" });
      return jsonError("REGLAS_NO_DISPONIBLES", 503);
    }

    const climateProvider = new ClimateProvider();
    const climateData = await climateProvider.getLast14Days(localidad);
    const rulesEngine = new RulesEngine();
    const scoreEngine = new ScoreEngine();
    const categorias = rulesEngine.evaluate(rules, climateData.resumen);
    const result: ResultadoConsulta = {
      estado_general: scoreEngine.getEstadoGeneral(categorias),
      confianza: scoreEngine.getConfianza(climateData.resumen.dias_datos),
      dias_datos: climateData.resumen.dias_datos,
      categorias,
      share_token: crypto.randomUUID(),
      localidad,
      clima_resumen: climateData.resumen,
    };

    try {
      await createConsulta({ request: body, climateData, rules, result });
    } catch (error) {
      console.error("No se pudo guardar consulta", error);
    }

    await logConsulta({ request: body, climateData, rules, result });

    return NextResponse.json(result);
  } catch (error) {
    if (body) {
      await logConsulta({ request: body, error });
    }

    return jsonError("CLIMA_NO_DISPONIBLE", 503);
  }
}


