import type { CategoriaResultado, Confianza, EstadoGeneral } from "@/types";

export class ScoreEngine {
  getEstadoGeneral(categorias: CategoriaResultado[]): EstadoGeneral {
    if (categorias.some((categoria) => categoria.condicion === "favorable")) {
      return "Atención recomendada";
    }

    if (categorias.some((categoria) => categoria.condicion === "moderada")) {
      return "Monitoreo preventivo sugerido";
    }

    return "Sin alertas activas";
  }

  getConfianza(diasDatos: number): Confianza {
    if (diasDatos >= 14) return "Alta";
    if (diasDatos >= 7) return "Media";
    return "Baja";
  }
}

