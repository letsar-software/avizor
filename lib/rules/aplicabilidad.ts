import type { AplicabilidadDefinicion, ContextoEvaluacion, ResultadoAplicabilidad } from "@/types";

// Resuelve si una regla de plaga aplica antes de evaluar clima (plan §3.1, paso 1).
// Vive separado de engine-v2.ts para poder testear cada dimensión (zona/fenología/período)
// en aislamiento, sin construir una serie climática ni una regla completa.
//
// Nota de alcance: el orden de fenología (V1..Vn, R1..R7) es una comparación ordinal
// simple, no un calendario por cultivar — eso es "Fenología parametrizable" (fase 6 del
// plan) y no corresponde resolverlo acá. Si el estadio no se puede interpretar con este
// parser mínimo, la dimensión queda como no evaluable en vez de asumir algo.
export function resolverAplicabilidad(aplicabilidad: AplicabilidadDefinicion | undefined, context: ContextoEvaluacion): ResultadoAplicabilidad {
  if (!aplicabilidad) return { aplica: true };

  if (aplicabilidad.zona) {
    const zonaResultado = resolverZona(aplicabilidad.zona, context.zona);
    if (!zonaResultado.aplica) return zonaResultado;
  }

  if (aplicabilidad.periodo) {
    const periodoResultado = resolverPeriodo(aplicabilidad.periodo, context.fechaRef);
    if (!periodoResultado.aplica) return periodoResultado;
  }

  if (aplicabilidad.fenologia) {
    const fenologiaResultado = resolverFenologia(aplicabilidad.fenologia, context.fenologiaEstadio);
    if (!fenologiaResultado.aplica) return fenologiaResultado;
  }

  return { aplica: true };
}

function resolverZona(zona: NonNullable<AplicabilidadDefinicion["zona"]>, zonaActual: string | undefined): ResultadoAplicabilidad {
  if (!zonaActual) return { aplica: false, submotivo: "zona_no_disponible" };
  const enLista = zona.zonas.includes(zonaActual);
  if (zona.modo === "exclusion") {
    return enLista ? { aplica: false, submotivo: "zona_excluida" } : { aplica: true };
  }
  // modo "prioridad": la regla solo se considera prioritaria en las zonas listadas.
  return enLista ? { aplica: true } : { aplica: false, submotivo: "zona_no_prioritaria" };
}

function resolverPeriodo(periodo: NonNullable<AplicabilidadDefinicion["periodo"]>, fechaRef: string | undefined): ResultadoAplicabilidad {
  if (!fechaRef) return { aplica: false, submotivo: "periodo_no_disponible" };
  const mes = Number(fechaRef.slice(5, 7));
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) return { aplica: false, submotivo: "periodo_no_disponible" };

  const { meses_desde: desde, meses_hasta: hasta } = periodo;
  const dentroDelRango = desde <= hasta ? mes >= desde && mes <= hasta : mes >= desde || mes <= hasta; // rango que cruza fin de año (ej. 11 a 3)
  return dentroDelRango ? { aplica: true } : { aplica: false, submotivo: "fuera_de_periodo" };
}

const STAGE_PATTERN = /^([EVR])(\d*)$/i;

function parseStage(code: string): number | null {
  const match = STAGE_PATTERN.exec(code.trim());
  if (!match) return null;
  const [, letter, digits] = match;
  const index = digits ? Number(digits) : 0;
  const rank: Record<string, number> = { E: 0, V: 1000, R: 2000 };
  return rank[letter.toUpperCase()] + index;
}

function resolverFenologia(fenologia: NonNullable<AplicabilidadDefinicion["fenologia"]>, estadioActual: string | undefined): ResultadoAplicabilidad {
  if (!estadioActual) return { aplica: false, fenologiaNoEstimable: true, submotivo: "fenologia_no_disponible" };

  const actual = parseStage(estadioActual);
  const desde = parseStage(fenologia.desde);
  const hasta = parseStage(fenologia.hasta);
  if (actual === null || desde === null || hasta === null) return { aplica: false, fenologiaNoEstimable: true, submotivo: "fenologia_no_disponible" };

  return actual >= desde && actual <= hasta ? { aplica: true } : { aplica: false, submotivo: "fuera_de_ventana_fenologica" };
}
