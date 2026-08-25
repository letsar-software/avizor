// Fuente única de los enums de Empresas / API (plan §6, fase 5).
// validation.ts y la UI derivan de acá.
export const EMPRESA_ESTADOS = ["activa", "inactiva"] as const;

// Los scopes de API key son texto libre a propósito: el producto todavía no definió
// una taxonomía cerrada (a diferencia de rol o tipo_regla, que sí vienen del plan).
// Cuando exista, esta lista pasa a ser un enum cerrado como el resto de los specs.
export const API_KEY_SCOPE_PATTERN = /^[a-z][a-z0-9_]{1,40}$/;
