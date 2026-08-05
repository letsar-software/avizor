import type { ContextoFenologico, GrupoMadurez } from "@/types";
import { PhenologyProvider } from "@/lib/phenology/provider";

export interface PhenologyInput { fechaSiembra?: string; grupoMadurez?: string; cultivar?: string; latitud: number; longitud: number; fechaRef: string; }
export interface PhenologyProviderV2 { estimarEstadio(input: PhenologyInput): Promise<ContextoFenologico>; }

export class CalculatedPhenologyProvider implements PhenologyProviderV2 {
  constructor(private readonly calculator = new PhenologyProvider()) {}
  async estimarEstadio(input: PhenologyInput): Promise<ContextoFenologico> {
    if (!input.fechaSiembra || !input.grupoMadurez) return { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
    const allowed: GrupoMadurez[] = ["III", "IV corto", "IV largo", "V"];
    if (!allowed.includes(input.grupoMadurez as GrupoMadurez)) return { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
    const detail = this.calculator.estimate({
      fechaSiembra: input.fechaSiembra,
      grupoMadurez: input.grupoMadurez as GrupoMadurez,
      cultivarId: input.cultivar,
      fechaConsulta: new Date(`${input.fechaRef}T12:00:00Z`),
    });
    return {
      disponible: true,
      estadio_estimado: detail.estadio_actual_estimado,
      descripcion: detail.nombre_estadio,
      fuente: "Modelo calendario por grupo de madurez v1.0",
      entradas: { fecha_siembra: detail.fecha_siembra, grupo_madurez: detail.grupo_madurez, cultivar: detail.cultivar_id ?? null },
      incertidumbre: { nota: `Estimación orientativa con un margen de ± ${detail.margen_dias} días.` },
      detalle: detail,
      modifica_reglas: false,
    };
  }
}

export class UnconfiguredPhenologyProvider implements PhenologyProviderV2 {
  async estimarEstadio(input: PhenologyInput): Promise<ContextoFenologico> {
    if (!input.fechaSiembra || !input.grupoMadurez) return { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
    return { disponible: false, motivo: "proveedor_no_configurado", modifica_reglas: false };
  }
}