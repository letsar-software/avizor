// Fuente única de los enums del contrato de condiciones climáticas (engine-v2).
// La validación (lib/security/validation.ts), los tipos compartidos (types/index.ts)
// y el editor tipado del panel admin (components/admin/rule-editor) derivan de acá,
// así que sumar una variable/operador nuevo es un solo cambio, no tres.

export const SPEC_VARIABLES = [
  "humedad_relativa", "precipitacion", "temperatura_media", "temperatura_min", "temperatura_max",
  "viento_medio", "punto_rocio", "deficit_presion_vapor", "evapotranspiracion", "et0_fao_56",
  "humedad_suelo_0_1cm", "humedad_suelo_1_3cm", "humedad_suelo_3_9cm", "humedad_suelo_9_27cm", "humedad_suelo_27_81cm",
  "temperatura_suelo_0cm", "temperatura_suelo_6cm", "temperatura_suelo_18cm", "temperatura_suelo_54cm",
  "radiacion_solar",
] as const;

export const SPEC_AGGREGATORS = ["media_ventana", "min_ventana", "suma_ventana", "dias_con_condicion"] as const;

export const SPEC_OPERATORS = ["gt", "gte", "lt", "lte", "eq", "between"] as const;

export const REGLA_ESTADOS = ["experimental", "revisada", "vigente", "retirada"] as const;
