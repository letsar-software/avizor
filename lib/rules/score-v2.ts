import type { EstadoGeneral, ResultadoReglaV2 } from "@/types";

export class ScoreEngineV2 {
  evaluate(results: ResultadoReglaV2[]): {
    estadoGeneral: EstadoGeneral;
    explicacion: string;
  } {
    const scoreable = results.filter(
      (item) =>
        item.regla.estado !== "experimental" &&
        item.regla.modo !== "experimental",
    );
    const active = scoreable.filter(
      (item) =>
        item.estado === "favorable",
    );
    if (active.length)
      return {
        estadoGeneral: "Atención recomendada",
        explicacion:
          "Se detectaron una o más señales ambientales que merecen atención.",
      };
    if (
      scoreable.some(
        (item) =>
          item.estado === "vigilancia" ||
          item.estado === "requiere_validacion_agronoma",
      )
    )
      return {
        estadoGeneral: "Monitoreo preventivo sugerido",
        explicacion:
          "Conviene mantener el monitoreo: hay condiciones para seguir de cerca o datos del lote que pueden completar la evaluación.",
      };
    return {
      estadoGeneral: "Sin alertas activas",
      explicacion:
        "Las condiciones observadas no alcanzaron los umbrales de las reglas evaluadas.",
    };
  }
}
