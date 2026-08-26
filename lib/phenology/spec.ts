// Fuente única de los enums del modelo de fenología (plan §3.3, fase 6).
// types/index.ts, lib/security/validation.ts y la UI del panel derivan de acá.
export const GRUPOS_MADUREZ = ["III", "IV corto", "IV largo", "V"] as const;

// El set de hitos es dato administrable, no un enum cerrado: PhenologyProvider.estimate()
// (lib/phenology/provider.ts) ya recorre this.parametros.hitos genéricamente, así que la
// única rigidez estaba acá y en la UI/validación. Se valida el formato de cada código
// (mismo patrón de estadio V/R que ya usa lib/pests/engine.ts) y una cantidad razonable
// de hitos por modelo, no una lista fija de valores.
export const HITO_FENOLOGICO_CODIGO_PATTERN = /^(VE|VC|[EVR]\d{0,2})$/i;
export const HITOS_FENOLOGICOS_MIN = 1;
export const HITOS_FENOLOGICOS_MAX = 12;
