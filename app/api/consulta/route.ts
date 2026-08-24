import { NextResponse } from "next/server";
import type { ConsultaErrorCode, ConsultaRequest, ResultadoConsulta } from "@/types";
import { ClimateProvider } from "@/lib/climate/provider";
import { logConsulta } from "@/lib/consultas/logs";
import { createConsulta } from "@/lib/consultas/repository";
import { featureFlags } from "@/lib/config/featureFlags";
import { resolveLocalidad } from "@/lib/localidades/normalize";
import { getReglasAgronomicas } from "@/lib/rules/repository";
import { RulesEngine } from "@/lib/rules/engine";
import { ScoreEngine } from "@/lib/rules/score";
import { PhenologyProvider } from "@/lib/phenology/provider";
import { DomainError } from "@/lib/consultas/service";
import { readJsonBody } from "@/lib/http/json-body";
import { consultaLegacySchema,parseInput } from "@/lib/security/validation";
import { enforcePublicConsultationLimit } from "@/lib/security/rate-limit";

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

const GRUPOS_MADUREZ = new Set(["III", "IV corto", "IV largo", "V"]);

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
    await enforcePublicConsultationLimit(request);
    const payload = parseInput(consultaLegacySchema,await readJsonBody(request));

    body = {
      ...payload,
      localidad: payload.localidad.trim(),
      cultivo: normalizeCultivo(payload.cultivo),
    };

    if (!isCultivoSoportado(body.cultivo)) {
      await logConsulta({ request: body, error: USER_MESSAGES.CULTIVO_NO_SOPORTADO });
      return jsonError("CULTIVO_NO_SOPORTADO", 400);
    }

    let localidad;
    try {
      localidad = await resolveLocalidad(body.localidad);
    } catch (error) {
      await logConsulta({ request: body, error });
      return jsonError("CLIMA_NO_DISPONIBLE", 503);
    }

    if (!localidad) {
      await logConsulta({ request: body, error: USER_MESSAGES.LOCALIDAD_NO_RECONOCIDA });
      return jsonError("LOCALIDAD_NO_RECONOCIDA", 404);
    }

    const climateProvider = new ClimateProvider();
    let rules;
    let climateData;
    try {
      [rules, climateData] = await Promise.all([
        getReglasAgronomicas(body.cultivo),
        climateProvider.getLast14Days(localidad),
      ]);
    } catch (error) {
      await logConsulta({ request: body, error });
      const message = error instanceof Error ? error.message : String(error);
      return jsonError(message.includes("Open-Meteo") || message.includes("climatica") ? "CLIMA_NO_DISPONIBLE" : "REGLAS_NO_DISPONIBLES", 503);
    }

    if (rules.length === 0) {
      await logConsulta({ request: body, rules, error: "No hay reglas evaluables" });
      return jsonError("REGLAS_NO_DISPONIBLES", 503);
    }


    const rulesEngine = new RulesEngine();
    const scoreEngine = new ScoreEngine();
    const categorias = rulesEngine.evaluate(rules, climateData.resumen);
    const fenologia = body.fecha_siembra && body.grupo_madurez && GRUPOS_MADUREZ.has(body.grupo_madurez)
      ? new PhenologyProvider().estimate({ fechaSiembra: body.fecha_siembra, grupoMadurez: body.grupo_madurez, cultivarId: body.cultivar_id })
      : undefined;
    const result: ResultadoConsulta = {
      estado_general: scoreEngine.getEstadoGeneral(categorias),
      confianza: scoreEngine.getConfianza(climateData.resumen.dias_datos),
      dias_datos: climateData.resumen.dias_datos,
      categorias,
      share_token: crypto.randomUUID(),
      localidad,
      clima_resumen: climateData.resumen,
      fenologia,
    };

    const persistenceResults = await Promise.allSettled([
      createConsulta({ request: body, climateData, rules, result }),
      logConsulta({ request: body, climateData, rules, result }),
    ]);

    persistenceResults.forEach((persistenceResult) => {
      if (persistenceResult.status === "rejected") {
        console.error("No se pudo guardar informacion de consulta", persistenceResult.reason);
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DomainError && (error.status === 400 || error.status === 413 || error.status === 429 || error.status === 503)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers: error.status === 429 ? { "Retry-After": String(error.details.retry_after ?? 3600) } : undefined });
    }
    if (body) {
      await logConsulta({ request: body, error });
    }

    return jsonError("CLIMA_NO_DISPONIBLE", 503);
  }
}


