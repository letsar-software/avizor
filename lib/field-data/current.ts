import type { FieldDataSource } from "@/lib/variables/catalog";
import type { FieldValueSource } from "@/types";
import { canonicalVariable } from "@/lib/rules/variables";

export type FieldDatumStatus = "vigente" | "historico";

/** Dato de lote genérico por variable (tabla datos_campo). */
export interface FieldDatum {
  id?: string;
  field_id: string;
  variable_key: string;
  value: unknown;
  unit?: string | null;
  observed_at: string;
  /** Vencimiento explícito; si falta se usa vigencia_dias del catálogo. */
  valid_until?: string | null;
  status: FieldDatumStatus;
  source: FieldDataSource;
  recorded_by?: string | null;
  notes?: string | null;
}

/** Datos vigentes por variable canónica, listos para el motor. */
export type CurrentFieldData = ReadonlyMap<string, FieldDatum>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fecha hasta la que el dato puede usarse; null = no vence. */
export function expiresAt(datum: FieldDatum, validityDays?: number | null) {
  if (datum.valid_until) return new Date(datum.valid_until);
  if (validityDays === null || validityDays === undefined) return null;
  return new Date(new Date(datum.observed_at).getTime() + validityDays * DAY_MS);
}

export function isCurrent(datum: FieldDatum, at: string | Date, validityDays?: number | null) {
  const moment = new Date(at);
  if (datum.status !== "vigente") return false;
  if (new Date(datum.observed_at) > moment) return false;
  const expiry = expiresAt(datum, validityDays);
  return expiry === null || expiry > moment;
}

/**
 * El dato vigente más reciente por variable. Los vencidos o marcados como
 * históricos no se usan: la variable vuelve a pedirse en "Para completar la evaluación".
 */
export function currentFieldData(
  records: FieldDatum[],
  at: string | Date,
  validityDays: ReadonlyMap<string, number | null> = new Map(),
): CurrentFieldData {
  const current = new Map<string, FieldDatum>();
  for (const record of records) {
    const key = canonicalVariable(record.variable_key);
    if (!isCurrent(record, at, validityDays.get(key))) continue;
    const previous = current.get(key);
    if (!previous || new Date(record.observed_at) > new Date(previous.observed_at)) current.set(key, record);
  }
  return current;
}

/** Valor numérico del dato, si lo tiene (para reemplazar una estimación climática). */
export function numericValue(datum: FieldDatum | undefined) {
  if (!datum) return null;
  const value = typeof datum.value === "string" ? Number(datum.value.replace(",", ".")) : datum.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Origen visible de un dato de lote: manual → field_data; el resto conserva su tipo. */
export function fieldValueSource(source: FieldDataSource): FieldValueSource {
  return source === "manual" ? "field_data" : source;
}
