import type { EstadoGeneral, ResultadoReglaV2 } from "@/types";

export class ScoreEngineV2 {
  evaluate(results: ResultadoReglaV2[]): { estadoGeneral: EstadoGeneral; explicacion: string } {
    const active = results.filter((item) => item.estado === "favorables" || item.estado === "condiciones_detectadas");
    if (active.length) return { estadoGeneral: "Atención recomendada", explicacion: `Se detectaron condiciones ambientales en ${active.length} categoría(s).` };
    if (results.some((item) => item.estado === "moderadas" || item.estado === "indeterminado")) return { estadoGeneral: "Monitoreo preventivo sugerido", explicacion: "Conviene mantener el monitoreo: hay condiciones moderadas o datos que no permiten cerrar todas las evaluaciones." };
    return { estadoGeneral: "Sin alertas activas", explicacion: "Las condiciones observadas no alcanzaron los umbrales de las reglas evaluadas." };
  }
}
