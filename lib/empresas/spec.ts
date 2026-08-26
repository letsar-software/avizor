// Fuente única de los enums de Empresas / API (plan §6, fase 5).
// validation.ts y la UI derivan de acá.
export const EMPRESA_ESTADOS = ["activa", "inactiva"] as const;

// Taxonomía cerrada de scopes de API key — antes era texto libre sin ningún
// enforcement real en /api/v1 (documento de pendientes del panel admin, punto 5).
// Un scope por endpoint que exista hoy en /api/v1; sumar un endpoint nuevo es
// agregar un valor acá + un chequeo de scope en esa ruta (ver lib/security/api-keys.ts).
export const API_KEY_SCOPES = ["consultas:crear"] as const;
