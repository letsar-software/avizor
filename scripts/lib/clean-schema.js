const EXPECTED_TABLES = [
  "api_keys",
  "api_uso",
  "auditoria",
  "catalogo_enfermedades",
  "catalogo_plagas",
  "consulta_logs",
  "consultas",
  "cultivos",
  "empresas",
  "feedback",
  "fuentes_agronomicas",
  "interesados",
  "invitaciones_admin",
  "modelos_fenologicos",
  "observaciones",
  "plagas_regionales",
  "rate_limit_buckets",
  "reglas_agronomicas",
  "reglas_plagas",
  "reglas_plagas_fuentes",
  "sesiones_admin",
  "usuarios_admin",
  "zonas_agronomicas",
];

function assertCleanSchema(snapshot) {
  const tables = snapshot.tables;
  const missing = EXPECTED_TABLES.filter((name) => !tables.includes(name));
  const extra = tables.filter((name) => !EXPECTED_TABLES.includes(name));
  const problems = [];

  if (missing.length > 0) problems.push(`faltan tablas: ${missing.join(", ")}`);
  if (extra.length > 0) problems.push(`tablas no esperadas: ${extra.join(", ")}`);
  if (snapshot.extension !== "pgcrypto") problems.push("falta la extensión pgcrypto");
  if (snapshot.pestColumns.length > 0) {
    problems.push(`columnas de plagas todavía en reglas_agronomicas: ${snapshot.pestColumns.join(", ")}`);
  }
  if (snapshot.scopesConstraint !== "api_keys_scopes_check") {
    problems.push("falta el constraint api_keys_scopes_check");
  }

  if (problems.length > 0) {
    throw new Error(problems.join("; "));
  }

  return { tablas_public: tables.length, pgcrypto: snapshot.extension };
}

function readSchemaSnapshot(query) {
  const tables = query("select tablename from pg_tables where schemaname = 'public' order by tablename")
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);
  const pestColumns = query(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'reglas_agronomicas' and column_name in ('tipo_regla', 'grupo_plaga', 'especie', 'nivel_evidencia_climatica') order by 1",
  )
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    tables,
    extension: query("select extname from pg_extension where extname = 'pgcrypto'"),
    pestColumns,
    scopesConstraint: query("select conname from pg_constraint where conname = 'api_keys_scopes_check'"),
  };
}

module.exports = { EXPECTED_TABLES, assertCleanSchema, readSchemaSnapshot };
