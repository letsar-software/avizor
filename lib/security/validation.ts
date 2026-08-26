import { z } from "zod";
import { DomainError } from "@/lib/consultas/service";
import {
  PLAGA_ESTADOS_CATALOGO,
  REGIONAL_PRIORIDADES,
  REGLA_ESTADOS,
  SPEC_AGGREGATORS,
  SPEC_OPERATORS,
  SPEC_VARIABLES,
  TIPOS_REGLA,
} from "@/lib/rules/condition-spec";
import { ADMIN_ROLES, ADMIN_USER_ESTADOS } from "@/lib/admin/user-spec";
import { API_KEY_SCOPES, EMPRESA_ESTADOS } from "@/lib/empresas/spec";
import { GRUPOS_MADUREZ, HITOS_FENOLOGICOS_MAX, HITOS_FENOLOGICOS_MIN, HITO_FENOLOGICO_CODIGO_PATTERN } from "@/lib/phenology/spec";

const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Fecha inválida");
const uuid = z.string().uuid();
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const grupoMadurez = z.enum(GRUPOS_MADUREZ);

export const consultaV2Schema = z.object({
  localidad: shortText(120), cultivo: shortText(30), fechaSiembra: isoDate.optional(),
  grupoMadurez: grupoMadurez.optional(), cultivar: optionalText(120),
  sessionId: optionalText(128), canal: z.enum(["web", "whatsapp", "api_empresa", "admin"]).optional(), fechaRef: isoDate.optional(),
}).strict();

export const consultaLegacySchema = z.object({
  localidad: shortText(120), cultivo: shortText(30), session_id: optionalText(128), fecha_siembra: isoDate.optional(),
  grupo_madurez: grupoMadurez.optional(), cultivar_id: optionalText(120),
  observacion: optionalText(2000), email: email.optional(),
}).strict();

export const interesadoSchema = z.object({
  email, consentimiento: z.literal(true), consentimiento_version: shortText(40), consentimiento_fecha: z.string().datetime({ offset: true }),
  nombre_lote: optionalText(120), share_token: uuid.optional(), session_id: optionalText(128), localidad: optionalText(120), cultivo: optionalText(30),
}).strict();

export const guardarSchema = z.object({ email }).strict();
const observation = z.enum(["Nada relevante", "Posibles plagas", "Posibles enfermedades", "Exceso de agua", "Sequía", "Otro"]);
export const observacionV2Schema = z.object({ tipo: observation, descripcion: optionalText(2000) }).strict();
export const observacionLegacySchema = z.object({ opciones: z.array(observation).max(6).default([]), detalle: optionalText(2000), share_token: uuid.optional(), session_id: optionalText(128) }).strict()
  .refine((value) => value.opciones.length > 0 || Boolean(value.detalle), "Observación vacía");
export const feedbackV2Schema = z.object({ coincide_campo: z.enum(["si", "no", "parcialmente"]), sugerencia: optionalText(2000), canal: z.enum(["web", "whatsapp", "api_empresa", "admin"]).optional() }).strict();
export const feedbackLegacySchema = z.object({ utilidad: z.enum(["si", "parcialmente", "no"]).optional(), observaciones: z.array(shortText(120)).max(10).default([]), sugerencia: optionalText(2000), share_token: uuid.optional(), session_id: optionalText(128) }).strict()
  .refine((value) => Boolean(value.utilidad) || value.observaciones.length > 0 || Boolean(value.sugerencia), "Feedback vacío");

const operator = z.enum(SPEC_OPERATORS);
const variable = z.enum(SPEC_VARIABLES);
const aggregator = z.enum(SPEC_AGGREGATORS);
const finite = z.number().finite();
const conditionSchema = z.object({
  variable, agregador: aggregator, operador: operator, valor: z.union([finite, z.tuple([finite, finite])]), unidad: shortText(30),
  cobertura_minima: finite.min(0).max(1).optional(), subcondicion: z.object({ operador: operator, valor: finite, unidad: shortText(30) }).strict().optional(), provisorio: z.boolean().optional(),
}).strict().superRefine((condition, context) => {
  if (condition.operador === "between" && !Array.isArray(condition.valor)) context.addIssue({ code: z.ZodIssueCode.custom, message: "between requiere dos valores", path: ["valor"] });
  if (condition.operador !== "between" && Array.isArray(condition.valor)) context.addIssue({ code: z.ZodIssueCode.custom, message: "el operador requiere un valor", path: ["valor"] });
  if (Array.isArray(condition.valor) && condition.valor[0] > condition.valor[1]) context.addIssue({ code: z.ZodIssueCode.custom, message: "rango inválido", path: ["valor"] });
  if (condition.agregador === "dias_con_condicion" && !condition.subcondicion) context.addIssue({ code: z.ZodIssueCode.custom, message: "dias_con_condicion requiere subcondición", path: ["subcondicion"] });
  if (condition.agregador !== "dias_con_condicion" && condition.subcondicion) context.addIssue({ code: z.ZodIssueCode.custom, message: "subcondición no permitida", path: ["subcondicion"] });
  if (condition.subcondicion?.operador === "between") context.addIssue({ code: z.ZodIssueCode.custom, message: "between no está soportado en subcondición", path: ["subcondicion", "operador"] });
});
export const ruleDefinitionSchema = z.object({
  niveles: z.array(z.object({ orden: z.number().int().min(1), clave: shortText(80), orden_visual: z.number().int().min(1), etiqueta: shortText(240), explicacion: optionalText(1000), recomendacion: optionalText(1000), condiciones: z.array(conditionSchema).min(1).max(20) }).strict()).min(1).max(20),
  sin_coincidencia: z.object({ estado: shortText(80), motivo: optionalText(240) }).strict().optional(),
}).strict();

export const adminRulePatchSchema = z.object({
  estado: z.enum(REGLA_ESTADOS).optional(),
  definicion: ruleDefinitionSchema.optional(),
  validado_por: shortText(120).optional(),
  validado_en: z.string().datetime({ offset: true }).optional(),
}).strict()
  .refine((value) => value.estado !== undefined || value.definicion !== undefined || value.validado_por !== undefined || value.validado_en !== undefined, "No hay cambios");
export const adminLoginSchema = z.object({ email, password: z.string().min(8).max(200) }).strict();

const adminPassword = z.string().min(8).max(200);
// Sin password: el alta invita, nunca fija una contraseña elegida por el admin
// (ver lib/admin/auth.ts, createAdminInvitation).
export const adminUserCreateSchema = z.object({
  email, nombre: shortText(120), rol: z.enum(ADMIN_ROLES),
}).strict();
export const adminUserPatchSchema = z.object({
  nombre: shortText(120).optional(), rol: z.enum(ADMIN_ROLES).optional(),
  estado: z.enum(ADMIN_USER_ESTADOS).optional(), password: adminPassword.optional(),
}).strict()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios");
export const adminAcceptInvitationSchema = z.object({ token: shortText(256), password: adminPassword }).strict();
export const adminCropCreateSchema = z.object({ clave: shortText(40).regex(/^[a-z0-9_]+$/), nombre: shortText(120), activo: z.boolean().optional(), feature_flag: z.union([shortText(80), z.null()]).optional() }).strict();
export const adminCropPatchSchema = z.object({ nombre: shortText(120).optional(), activo: z.boolean().optional(), feature_flag: z.union([shortText(80), z.null()]).optional() }).strict()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios");

export const adminZonaCreateSchema = z.object({
  clave: shortText(60).regex(/^[a-z0-9_]+$/),
  nombre: shortText(120),
  definicion_geografica: z.record(z.unknown()).optional(),
}).strict();

export const adminPlagaCreateSchema = z.object({
  cultivo: shortText(30),
  grupo_plaga: shortText(60).regex(/^[a-z0-9_]+$/),
  especie: optionalText(120),
  nombre: shortText(160),
  nombre_cientifico: optionalText(160),
  tipo_regla: z.enum(TIPOS_REGLA),
  estado_catalogo: z.enum(PLAGA_ESTADOS_CATALOGO).optional(),
  version: shortText(20),
}).strict();

export const adminPlagaPatchSchema = z.object({
  nombre: shortText(160).optional(),
  nombre_cientifico: optionalText(160),
  estado_catalogo: z.enum(PLAGA_ESTADOS_CATALOGO).optional(),
  tipo_regla: z.enum(TIPOS_REGLA).optional(),
}).strict()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios");

export const adminRegionalCreateSchema = z.object({
  zona_id: uuid,
  prioridad: z.enum(REGIONAL_PRIORIDADES),
  meses_desde: z.number().int().min(1).max(12).optional(),
  meses_hasta: z.number().int().min(1).max(12).optional(),
  fuente_id: optionalText(80),
  fecha_fuente: isoDate.optional(),
  observaciones: optionalText(1000),
}).strict();

export const adminEmpresaCreateSchema = z.object({
  nombre: shortText(160), contacto_nombre: optionalText(160), contacto_email: email.optional(),
}).strict();
export const adminEmpresaPatchSchema = z.object({
  nombre: shortText(160).optional(), contacto_nombre: optionalText(160), contacto_email: email.optional(),
  estado: z.enum(EMPRESA_ESTADOS).optional(),
}).strict()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios");

export const adminApiKeyCreateSchema = z.object({
  nombre: shortText(120),
  scopes: z.array(z.enum(API_KEY_SCOPES)).max(API_KEY_SCOPES.length).default([]),
  limite_mensual: z.number().int().positive().optional(),
  expira_en: isoDate.optional(),
}).strict();

// Fenología (plan §3.3): el set de hitos es dato administrable (docs/panel-admin-pendientes.md,
// punto 6) — lo único fijo es el formato de cada código y una cantidad razonable de hitos
// por modelo. offsets_dias[grupo] debe tener exactamente un valor por hito, en el mismo
// orden, para cada grupo de madurez válido — eso se valida cruzado en el superRefine.
const hitoModeloSchema = z.object({ codigo: shortText(10).regex(HITO_FENOLOGICO_CODIGO_PATTERN), nombre: shortText(80) }).strict();
export const parametrosFenologicosSchema = z.object({
  hitos: z.array(hitoModeloSchema).min(HITOS_FENOLOGICOS_MIN).max(HITOS_FENOLOGICOS_MAX)
    .refine((hitos) => new Set(hitos.map((hito) => hito.codigo.toUpperCase())).size === hitos.length, "los códigos de hito no pueden repetirse"),
  offsets_dias: z.record(z.string(), z.array(z.number().int().min(0).max(400))),
  margen_dias: z.number().int().min(0).max(60),
}).strict().superRefine((value, ctx) => {
  const gruposEsperados = GRUPOS_MADUREZ.length === Object.keys(value.offsets_dias).length && GRUPOS_MADUREZ.every((grupo) => grupo in value.offsets_dias);
  if (!gruposEsperados) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "offsets_dias debe tener exactamente los grupos de madurez válidos", path: ["offsets_dias"] });
  for (const grupo of GRUPOS_MADUREZ) {
    if (value.offsets_dias[grupo]?.length !== value.hitos.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `offsets_dias.${grupo} debe tener un valor por cada hito (${value.hitos.length})`, path: ["offsets_dias", grupo] });
    }
  }
});

export const adminModeloFenologicoCreateSchema = z.object({
  cultivo: shortText(30), version: shortText(20), proveedor: optionalText(60),
  parametros: parametrosFenologicosSchema, fuente_tecnica: optionalText(500),
}).strict();
export const adminModeloFenologicoPatchSchema = z.object({
  estado: z.enum(REGLA_ESTADOS).optional(), parametros: parametrosFenologicosSchema.optional(),
  fuente_tecnica: optionalText(500), validado_por: shortText(120).optional(), validado_en: z.string().datetime({ offset: true }).optional(),
}).strict()
  .refine((value) => Object.keys(value).length > 0, "No hay cambios");

export function parseInput<T extends z.ZodTypeAny>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new DomainError("REQUEST_INVALIDO", "La solicitud no tiene los datos necesarios.", 400);
  return result.data;
}

export function parsePublicId(value: string) {
  const result = uuid.safeParse(value);
  if (!result.success) throw new DomainError("CONSULTA_NO_ENCONTRADA", "No encontramos esa consulta.", 404);
  return result.data;
}

export function parseAdminId(value: string) {
  const result = uuid.safeParse(value);
  if (!result.success) throw new DomainError("REQUEST_INVALIDO", "El identificador no es válido.", 400);
  return result.data;
}
