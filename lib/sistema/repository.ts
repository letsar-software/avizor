import { query, hasDatabaseConfig } from "@/lib/db/postgres";

export interface TablaClave { tabla: string; existe: boolean; filas: number | null }
export interface EstadoSistema {
  baseDeDatos: { conectada: boolean; latenciaMs: number | null; version: string | null };
  tablas: TablaClave[];
  ultimaConsultaEn: string | null;
}

// Lista fija definida acá mismo, nunca entrada de usuario: no hay superficie de
// inyección al interpolar el nombre de tabla en getTablaInfo.
const TABLAS_CLAVE = ["reglas_agronomicas", "usuarios_admin", "catalogo_plagas", "empresas", "modelos_fenologicos", "consultas"] as const;

async function getTablaInfo(tabla: string): Promise<TablaClave> {
  const existeResult = await query<{ existe: boolean }>("select to_regclass($1) is not null as existe", [`public.${tabla}`]);
  if (!existeResult.rows[0]?.existe) return { tabla, existe: false, filas: null };
  const filasResult = await query<{ total: string }>(`select count(*)::text as total from ${tabla}`);
  return { tabla, existe: true, filas: Number(filasResult.rows[0]?.total ?? 0) };
}

async function getUltimaConsultaEn() {
  const result = await query<{ ultima: string | null }>("select max(created_at)::text as ultima from consultas");
  return result.rows[0]?.ultima ?? null;
}

export async function getEstadoSistema(): Promise<EstadoSistema> {
  const sinTablas = TABLAS_CLAVE.map((tabla) => ({ tabla, existe: false, filas: null }));
  if (!hasDatabaseConfig()) {
    return { baseDeDatos: { conectada: false, latenciaMs: null, version: null }, tablas: sinTablas, ultimaConsultaEn: null };
  }

  const started = performance.now();
  let version: string | null = null;
  try {
    version = (await query<{ version: string }>("select version()")).rows[0]?.version ?? null;
  } catch {
    return { baseDeDatos: { conectada: false, latenciaMs: null, version: null }, tablas: sinTablas, ultimaConsultaEn: null };
  }
  const latenciaMs = Math.round(performance.now() - started);

  const [tablas, ultimaConsultaEn] = await Promise.all([
    Promise.all(TABLAS_CLAVE.map(getTablaInfo)),
    getUltimaConsultaEn(),
  ]);

  return { baseDeDatos: { conectada: true, latenciaMs, version }, tablas, ultimaConsultaEn };
}
