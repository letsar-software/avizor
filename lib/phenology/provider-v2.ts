import type { ContextoFenologico, GrupoMadurez, ModeloFenologico } from "@/types";
import { DEFAULT_PARAMETROS_FENOLOGICOS, PhenologyProvider } from "@/lib/phenology/provider";
import { getModeloVigente } from "@/lib/fenologia/repository";
import { GRUPOS_MADUREZ } from "@/lib/phenology/spec";

export interface PhenologyInput { fechaSiembra?: string; grupoMadurez?: string; cultivar?: string; latitud: number; longitud: number; fechaRef: string; cultivo?: string; }
export interface PhenologyProviderV2 { estimarEstadio(input: PhenologyInput): Promise<ContextoFenologico>; }

type ModeloLoader = (cultivo: string) => Promise<ModeloFenologico | null>;

export class CalculatedPhenologyProvider implements PhenologyProviderV2 {
  // getModeloVigente como default inyectable: mismo patrón que el resto de lib/admin
  // y lib/security, para poder testear sin Postgres real.
  constructor(private readonly cargarModelo: ModeloLoader = getModeloVigente) {}

  async estimarEstadio(input: PhenologyInput): Promise<ContextoFenologico> {
    if (!input.fechaSiembra || !input.grupoMadurez) return { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
    if (!(GRUPOS_MADUREZ as readonly string[]).includes(input.grupoMadurez)) return { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };

    // Si falla la lectura del modelo administrado, degradamos al default hardcodeado
    // en vez de perder la estimación por completo — es una dependencia nueva sobre
    // una tabla nueva, no motivo para romper una funcionalidad que ya andaba.
    const modelo = await this.cargarModelo(input.cultivo ?? "soja").catch(() => null);
    const calculator = new PhenologyProvider(modelo?.parametros ?? DEFAULT_PARAMETROS_FENOLOGICOS);

    const detail = calculator.estimate({
      fechaSiembra: input.fechaSiembra,
      grupoMadurez: input.grupoMadurez as GrupoMadurez,
      cultivarId: input.cultivar,
      fechaConsulta: new Date(`${input.fechaRef}T12:00:00Z`),
    });
    return {
      disponible: true,
      estadio_estimado: detail.estadio_actual_estimado,
      descripcion: detail.nombre_estadio,
      fuente: modelo ? `Modelo calendario administrado v${modelo.version}` : "Modelo calendario por grupo de madurez v1.0 (default)",
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
