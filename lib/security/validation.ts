import { z } from "zod";
import { DomainError } from "@/lib/consultas/service";

const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Fecha inválida");
const uuid = z.string().uuid();
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());

export const consultaV2Schema = z.object({
  localidad: shortText(120), cultivo: shortText(30), fechaSiembra: isoDate.optional(),
  grupoMadurez: z.enum(["III", "IV corto", "IV largo", "V"]).optional(), cultivar: optionalText(120),
  sessionId: optionalText(128), canal: z.enum(["web", "whatsapp", "api_empresa", "admin"]).optional(), fechaRef: isoDate.optional(),
}).strict();

export const consultaLegacySchema = z.object({
  localidad: shortText(120), cultivo: shortText(30), session_id: optionalText(128), fecha_siembra: isoDate.optional(),
  grupo_madurez: z.enum(["III", "IV corto", "IV largo", "V"]).optional(), cultivar_id: optionalText(120),
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

const operator = z.enum(["gt", "gte", "lt", "lte", "eq", "between"]);
const variable = z.enum(["humedad_relativa", "precipitacion", "temperatura_media", "temperatura_min", "temperatura_max", "viento_medio", "punto_rocio", "deficit_presion_vapor", "evapotranspiracion", "et0_fao_56", "humedad_suelo_0_1cm", "humedad_suelo_1_3cm", "humedad_suelo_3_9cm", "humedad_suelo_9_27cm", "humedad_suelo_27_81cm", "temperatura_suelo_0cm", "temperatura_suelo_6cm", "temperatura_suelo_18cm", "temperatura_suelo_54cm", "radiacion_solar"]);
const aggregator = z.enum(["media_ventana", "min_ventana", "suma_ventana", "dias_con_condicion"]);
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
  estado: z.enum(["experimental", "revisada", "vigente", "retirada"]).optional(),
  definicion: ruleDefinitionSchema.optional(),
  validado_por: shortText(120).optional(),
  validado_en: z.string().datetime({ offset: true }).optional(),
}).strict()
  .refine((value) => value.estado !== undefined || value.definicion !== undefined || value.validado_por !== undefined || value.validado_en !== undefined, "No hay cambios");
export const adminLoginSchema = z.object({ email, password: z.string().min(8).max(200) }).strict();
export const adminCropCreateSchema = z.object({ clave: shortText(40).regex(/^[a-z0-9_]+$/), nombre: shortText(120), activo: z.boolean().optional(), feature_flag: z.union([shortText(80), z.null()]).optional() }).strict();
export const adminCropPatchSchema = z.object({ nombre: shortText(120).optional(), activo: z.boolean().optional(), feature_flag: z.union([shortText(80), z.null()]).optional() }).strict()
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
