// Fuente única de los enums del modelo de fenología (plan §3.3, fase 6).
// types/index.ts, lib/security/validation.ts y la UI del panel derivan de acá.
export const GRUPOS_MADUREZ = ["III", "IV corto", "IV largo", "V"] as const;

// El set de hitos queda fijo en esta fase (no administrable): cambiarlo afectaría
// tipos y pantallas públicas (FenologiaEstimada.hitos, /resultado/fenologia) que
// asumen exactamente estos cinco códigos. Lo administrable son los coeficientes
// (offsets_dias, margen_dias), no la forma del modelo.
export const HITOS_FENOLOGICOS_CODIGOS = ["E", "R1", "R3", "R5", "R7"] as const;
