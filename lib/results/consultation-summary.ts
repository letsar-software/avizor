import type { ResultadoReglaV2 } from "@/types";

export interface ResumenConsulta {
  descripcion: string;
  destaque: string;
}

const ACTIVE_STATES = new Set(["favorables", "condiciones_detectadas"]);

export function buildConsultationSummary(results: ResultadoReglaV2[]): ResumenConsulta {
  const active = results.filter((result) => ACTIVE_STATES.has(result.estado));
  const moderate = results.filter((result) => result.estado === "moderadas");
  const indeterminate = results.filter((result) => result.estado === "indeterminado");
  const insufficient = results.length === 0 || indeterminate.length === results.length;

  const opening = insufficient
    ? "Los datos disponibles no permiten realizar una evaluación completa de las condiciones ambientales."
    : active.length === 0
    ? moderate.length > 0
      ? "Las condiciones ambientales analizadas indican que conviene mantener un monitoreo preventivo del lote."
      : "Las condiciones ambientales analizadas no muestran situaciones que requieran atención especial en este momento."
    : active.length === 1
      ? "Las condiciones ambientales analizadas indican que conviene prestar atención a un factor del cultivo."
      : "Las condiciones ambientales analizadas indican que conviene prestar atención a varios factores del cultivo.";

  const details = categoryDetails(results);
  const uncertainty = indeterminate.length === 1
    ? "Una de las categorías no pudo evaluarse con suficiente información y conviene revisar su detalle."
    : indeterminate.length > 1
      ? "Algunas categorías no pudieron evaluarse con suficiente información y conviene revisar su detalle."
      : "";

  return {
    descripcion: [opening, ...details, uncertainty].filter(Boolean).join(" "),
    destaque: insufficient
      ? "Tomá este resultado como orientativo y revisá las categorías con información insuficiente."
      : closing(active, moderate),
  };
}

function categoryDetails(results: ResultadoReglaV2[]) {
  const byRisk = new Map(results.map((result) => [result.riesgo, result]));
  const details: string[] = [];
  const frost = byRisk.get("temperatura_bajo_umbral");
  const foliar = byRisk.get("enfermedades_foliares");
  const drought = byRisk.get("baja_precipitacion");
  const excess = byRisk.get("precipitacion_elevada");

  if (frost) details.push(ACTIVE_STATES.has(frost.estado)
    ? "Se detectaron temperaturas mínimas por debajo del umbral considerado para heladas."
    : frost.estado === "indeterminado"
      ? "No fue posible evaluar las condiciones para heladas con la información disponible."
      : "No se detectaron temperaturas mínimas por debajo del umbral considerado para heladas.");

  if (foliar) details.push(ACTIVE_STATES.has(foliar.estado)
    ? "Se identificaron condiciones de humedad, precipitaciones y temperatura que pueden favorecer enfermedades foliares."
    : foliar.estado === "moderadas"
      ? "Algunas de las condiciones ambientales analizadas pueden favorecer enfermedades foliares, aunque no se cumplen todos los criterios evaluados."
      : foliar.estado === "indeterminado"
        ? "No fue posible determinar las condiciones para enfermedades foliares con la información disponible."
        : "No se identificaron condiciones ambientales favorables para enfermedades foliares durante el período analizado.");

  if (drought && excess && drought.estado === "sin_condiciones" && excess.estado === "sin_condiciones") {
    details.push("Las precipitaciones acumuladas no muestran condiciones favorables para estrés hídrico ni exceso hídrico según los criterios evaluados.");
  } else {
    if (drought) details.push(ACTIVE_STATES.has(drought.estado)
      ? "Las precipitaciones acumuladas del período se encuentran por debajo del umbral considerado para estrés hídrico."
      : drought.estado === "indeterminado"
        ? "No fue posible evaluar las condiciones para estrés hídrico con la información disponible."
        : "Las precipitaciones acumuladas no muestran condiciones favorables para estrés hídrico según los criterios evaluados.");
    if (excess) details.push(ACTIVE_STATES.has(excess.estado)
      ? "Las precipitaciones acumuladas superaron el umbral considerado para condiciones de exceso hídrico."
      : excess.estado === "indeterminado"
        ? "No fue posible evaluar las condiciones para exceso hídrico con la información disponible."
        : "Las precipitaciones acumuladas no muestran condiciones favorables para exceso hídrico según los criterios evaluados.");
  }
  return details;
}

function closing(active: ResultadoReglaV2[], moderate: ResultadoReglaV2[]) {
  if (active.length > 1) return "Hay más de una condición que merece atención. Revisá el detalle de las categorías señaladas para conocer qué conviene observar en el lote.";
  if (active.length === 1) return `Principal condición a observar: ${focusFor(active[0].riesgo)}.`;
  if (moderate.length > 0) return "Conviene mantener un monitoreo preventivo y revisar el detalle de las categorías señaladas.";
  return "No se identifican condiciones que requieran atención especial en este momento. Continuá con el monitoreo habitual.";
}

function focusFor(risk: string) {
  if (risk === "temperatura_bajo_umbral") return "bajas temperaturas";
  if (risk === "enfermedades_foliares") return "condiciones ambientales asociadas a enfermedades foliares";
  if (risk === "baja_precipitacion") return "disponibilidad hídrica";
  if (risk === "precipitacion_elevada") return "acumulación de precipitaciones";
  return "la categoría señalada";
}
