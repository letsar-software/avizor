// Reporte de impacto de la migración 031 (vínculos de categoría y variables).
// Sólo lectura, salvo simulate(): aplica 031 dos veces dentro de una transacción
// y SIEMPRE termina en ROLLBACK, para medir antes/después e idempotencia.
const fs = require("node:fs");
const path = require("node:path");

const MIGRATION_031 = path.join(__dirname, "../../db/migrations/031_variables_criticas_complementarias.sql");

// Misma derivación de candidatas que la migración: clave climática, catálogo
// sanitario (cultivo + clave) y categoria_nombre sólo si es una clave de categoría.
const CANDIDATES_SQL = `
with senales as (
  select r.id, case r.clave
      when 'temperatura_bajo_umbral' then 'heladas'
      when 'baja_precipitacion' then 'estres_hidrico'
      when 'precipitacion_elevada' then 'exceso_hidrico'
    end as categoria_clave, 'clave_climatica' as origen
  from reglas_agronomicas r
  union all
  select r.id, 'enfermedades_foliares', 'catalogo_sanitario'
  from reglas_agronomicas r
  where exists (select 1 from catalogo_enfermedades c where c.cultivo = r.cultivo and c.clave = r.clave)
  union all
  select r.id, r.categoria_nombre, 'categoria_nombre'
  from reglas_agronomicas r
  where exists (select 1 from categorias_agronomicas ca where ca.clave = r.categoria_nombre)
),
candidatos as (
  select s.id, array_agg(distinct s.categoria_clave order by s.categoria_clave) as claves,
    array_agg(distinct s.origen order by s.origen) as origenes
  from senales s join categorias_agronomicas ca on ca.clave = s.categoria_clave
  group by s.id
)
select r.id::text as id, r.cultivo, r.clave, r.version, r.categoria_nombre, r.activa,
  actual.clave as categoria_actual, coalesce(c.claves, '{}') as candidatas, coalesce(c.origenes, '{}') as origenes,
  case
    when r.categoria_id is not null and (c.claves is null or actual.clave = any(c.claves)) then 'ya_vinculada'
    when r.categoria_id is not null then 'ya_vinculada_difiere'
    when c.claves is null then 'sin_correspondencia'
    when cardinality(c.claves) = 1 then 'vinculable'
    else 'ambigua'
  end as clasificacion
from reglas_agronomicas r
left join candidatos c on c.id = r.id
left join categorias_agronomicas actual on actual.id = r.categoria_id
order by r.cultivo, r.clave, r.version`;

async function tableExists(query, name) {
  const rows = await query(`select to_regclass('public.${name}') is not null as ok`);
  return rows[0].ok === true || rows[0].ok === "t";
}

async function columnExists(query, table, column) {
  const rows = await query(
    `select count(*)::int as n from information_schema.columns where table_schema = 'public' and table_name = '${table}' and column_name = '${column}'`,
  );
  return Number(rows[0].n) > 0;
}

/** Foto del estado actual; query(sql) debe devolver filas como objetos. */
async function impactReport(query) {
  const hasLists = await columnExists(query, "reglas_agronomicas", "critical_required_variables");
  const reglas = await query(CANDIDATES_SQL);
  const count = (fn) => reglas.filter(fn).length;
  const groupBy = (rows, key) =>
    Object.fromEntries(
      [...rows.reduce((map, row) => map.set(row[key] ?? "(sin categoría)", (map.get(row[key] ?? "(sin categoría)") ?? 0) + 1), new Map())]
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    );
  const vinculables = reglas.filter((row) => row.clasificacion === "vinculable");
  const duplicados = await query(`
    select cultivo, clave, count(*)::int as versiones_activas, array_agg(version order by version) as versiones
    from reglas_agronomicas where activa = true and estado in ('vigente', 'experimental')
    group by cultivo, clave having count(*) > 1 order by cultivo, clave`);
  const categoriaNombreNoReconocida = await query(`
    select categoria_nombre, count(*)::int as reglas, array_agg(distinct cultivo order by cultivo) as cultivos
    from reglas_agronomicas r
    where not exists (select 1 from categorias_agronomicas ca where ca.clave = r.categoria_nombre)
    group by categoria_nombre order by categoria_nombre`);
  const categoriaInactiva = await query(`
    select r.id::text as id, r.cultivo, r.clave, ca.clave as categoria
    from reglas_agronomicas r join categorias_agronomicas ca on ca.id = r.categoria_id
    where ca.activa = false`);
  const listasSuperpuestas = hasLists
    ? await query(`
      select id::text as id, cultivo, clave,
        array(select unnest(critical_required_variables) intersect select unnest(complementary_required_variables)) as repetidas
      from reglas_agronomicas
      where critical_required_variables && complementary_required_variables`)
    : [];
  const variablesFueraDeCatalogo = hasLists && (await tableExists(query, "variables_agronomicas"))
    ? await query(`
      select distinct v.variable, r.cultivo, r.clave
      from reglas_agronomicas r,
        unnest(coalesce(r.critical_required_variables, '{}') || coalesce(r.complementary_required_variables, '{}')) as v(variable)
      where not exists (select 1 from variables_agronomicas va where va.clave = v.variable)
      order by v.variable`)
    : [];
  return {
    total_reglas: reglas.length,
    sin_categoria: count((row) => row.categoria_actual === null),
    por_categoria: groupBy(reglas, "categoria_actual"),
    clasificacion: groupBy(reglas, "clasificacion"),
    vinculables: vinculables.map(pick),
    afectadas_por_cultivo: groupBy(vinculables, "cultivo"),
    afectadas_por_categoria: groupBy(vinculables.map((row) => ({ ...row, destino: row.candidatas[0] })), "destino"),
    sin_correspondencia: reglas.filter((row) => row.clasificacion === "sin_correspondencia").map(pick),
    ambiguas: reglas.filter((row) => row.clasificacion === "ambigua").map(pick),
    ya_vinculadas: reglas.filter((row) => row.clasificacion.startsWith("ya_vinculada")).map(pick),
    existentes_que_difieren: reglas.filter((row) => row.clasificacion === "ya_vinculada_difiere").map(pick),
    duplicados_potenciales: duplicados,
    categoria_nombre_no_reconocida: categoriaNombreNoReconocida,
    categoria_inactiva: categoriaInactiva,
    listas_superpuestas: listasSuperpuestas,
    variables_fuera_de_catalogo: variablesFueraDeCatalogo,
  };
}

function pick(row) {
  return {
    id: row.id, cultivo: row.cultivo, clave: row.clave, version: row.version,
    categoria_nombre: row.categoria_nombre, categoria_actual: row.categoria_actual,
    candidatas: row.candidatas, origenes: row.origenes,
  };
}

async function snapshotRules(query) {
  return query(`select id::text as id, categoria_id::text as categoria_id, jsonb_strip_nulls(to_jsonb(r) - 'updated_at') as fila
    from reglas_agronomicas r order by id`);
}

/**
 * Antes → 031 → después → 031 otra vez, todo en una transacción revertida.
 * db: { query(sql) => rows, exec(sql) } sobre una única conexión.
 */
async function simulate(db, migrationSql = fs.readFileSync(MIGRATION_031, "utf8")) {
  await db.exec("begin");
  try {
    const antes = await impactReport(db.query);
    const fotoAntes = await snapshotRules(db.query);
    await db.exec(migrationSql);
    const despues = await impactReport(db.query);
    const fotoDespues = await snapshotRules(db.query);
    await db.exec(migrationSql);
    const fotoRepeticion = await snapshotRules(db.query);
    const before = new Map(fotoAntes.map((row) => [row.id, row]));
    const existentesModificadas = fotoDespues.filter((row) => {
      const previous = before.get(row.id);
      return previous && previous.categoria_id !== null && previous.categoria_id !== row.categoria_id;
    });
    return {
      antes,
      despues,
      reglas_modificadas: fotoDespues.filter((row) => JSON.stringify(row.fila) !== JSON.stringify(before.get(row.id)?.fila)).length,
      categorias_existentes_modificadas: existentesModificadas.map((row) => row.id),
      idempotente: JSON.stringify(fotoDespues) === JSON.stringify(fotoRepeticion),
    };
  } finally {
    await db.exec("rollback");
  }
}

function toMarkdown(result, title = "Reporte de impacto — migración 031") {
  const { antes, despues } = result;
  const lines = [`# ${title}`, "", "Simulación en transacción revertida (ROLLBACK): no persiste cambios.", ""];
  const table = (rows, columns) => rows.length
    ? [`| ${columns.join(" | ")} |`, `| ${columns.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${columns.map((c) => format(row[c])).join(" | ")} |`)]
    : ["_Ninguna._"];
  const format = (value) => Array.isArray(value) ? value.join(", ") : value ?? "—";
  lines.push("## Resumen", "", "| Indicador | Antes | Después |", "| --- | --- | --- |",
    `| Reglas totales | ${antes.total_reglas} | ${despues.total_reglas} |`,
    `| Reglas sin categoria_id | ${antes.sin_categoria} | ${despues.sin_categoria} |`,
    `| Reglas modificadas por 031 | — | ${result.reglas_modificadas} |`,
    `| categoria_id existentes sobrescritos | — | ${result.categorias_existentes_modificadas.length} |`,
    `| Idempotente (segunda ejecución sin cambios) | — | ${result.idempotente ? "sí" : "NO"} |`, "");
  const categories = [...new Set([...Object.keys(antes.por_categoria), ...Object.keys(despues.por_categoria)])].sort();
  lines.push("## Reglas por categoría", "", "| Categoría | Antes | Después |", "| --- | --- | --- |",
    ...categories.map((key) => `| ${key} | ${antes.por_categoria[key] ?? 0} | ${despues.por_categoria[key] ?? 0} |`), "");
  lines.push("## Reglas a vincular (antes de aplicar)", "", ...table(antes.vinculables, ["cultivo", "clave", "version", "candidatas", "origenes"]), "");
  lines.push("### Afectadas por cultivo", "", ...table(Object.entries(antes.afectadas_por_cultivo).map(([k, v]) => ({ cultivo: k, reglas: v })), ["cultivo", "reglas"]), "");
  lines.push("### Afectadas por categoría", "", ...table(Object.entries(antes.afectadas_por_categoria).map(([k, v]) => ({ categoria: k, reglas: v })), ["categoria", "reglas"]), "");
  lines.push("## Sin correspondencia (no se modifican, revisar)", "", ...table(antes.sin_correspondencia, ["cultivo", "clave", "version", "categoria_nombre"]), "");
  lines.push("## Ambiguas (no se modifican, revisar)", "", ...table(antes.ambiguas, ["cultivo", "clave", "version", "candidatas", "origenes"]), "");
  lines.push("## Con categoria_id existente (no se modifican)", "", ...table(antes.ya_vinculadas, ["cultivo", "clave", "version", "categoria_actual", "candidatas"]), "");
  lines.push("### Existentes cuya categoría difiere de la derivada (sólo reporte)", "", ...table(antes.existentes_que_difieren, ["cultivo", "clave", "categoria_actual", "candidatas"]), "");
  lines.push("## Duplicados potenciales (más de una versión activa)", "", ...table(antes.duplicados_potenciales, ["cultivo", "clave", "versiones_activas", "versiones"]), "");
  lines.push("## Valores no reconocidos", "", "### categoria_nombre que no es clave de categoría", "", ...table(antes.categoria_nombre_no_reconocida, ["categoria_nombre", "reglas", "cultivos"]), "");
  lines.push("### Reglas vinculadas a categorías inactivas", "", ...table(despues.categoria_inactiva, ["cultivo", "clave", "categoria"]), "");
  lines.push("### Variables repetidas en ambas listas (después)", "", ...table(despues.listas_superpuestas, ["cultivo", "clave", "repetidas"]), "");
  lines.push("### Variables fuera del catálogo (después)", "", ...table(despues.variables_fuera_de_catalogo, ["variable", "cultivo", "clave"]), "");
  return lines.join("\n");
}

// --- 030 → 031 → 032 en conjunto -------------------------------------------------

const PENDING_MIGRATIONS = [
  "030_agronomic_advisories.sql",
  "031_variables_criticas_complementarias.sql",
  "032_variables_y_datos_de_campo.sql",
];
const TRACKED_TABLES = [
  "reglas_agronomicas", "categorias_agronomicas", "agronomic_advisories", "variables_agronomicas",
  "lotes", "datos_campo", "migracion_031_respaldo", "migracion_031_vinculos", "auditoria", "consultas", "consulta_logs",
];

async function tableCounts(query) {
  const counts = {};
  for (const table of TRACKED_TABLES) {
    counts[table] = (await tableExists(query, table)) ? Number((await query(`select count(*)::int as n from ${table}`))[0].n) : null;
  }
  return counts;
}

function readPending(files = PENDING_MIGRATIONS) {
  return files.map((file) => ({ file, sql: fs.readFileSync(path.join(__dirname, "../../db/migrations", file), "utf8").replace(/^﻿/, "") }));
}

/** Aplica 030, 031 y 032 en orden, dos veces, dentro de una transacción revertida. */
async function simulatePending(db, migrations = readPending()) {
  await db.exec("begin");
  try {
    const filasAntes = await tableCounts(db.query);
    const reporteAntes = await impactReport(db.query);
    const fotoAntes = await snapshotRules(db.query);
    for (const migration of migrations) await db.exec(migration.sql);
    const filasDespues = await tableCounts(db.query);
    const reporteDespues = await impactReport(db.query);
    const fotoDespues = await snapshotRules(db.query);
    for (const migration of migrations) await db.exec(migration.sql);
    const filasRepeticion = await tableCounts(db.query);
    const fotoRepeticion = await snapshotRules(db.query);
    const before = new Map(fotoAntes.map((row) => [row.id, row]));
    const modificadas = fotoDespues.filter((row) => JSON.stringify(row.fila) !== JSON.stringify(before.get(row.id)?.fila));
    return {
      migraciones: migrations.map((migration) => migration.file),
      filas_antes: filasAntes,
      filas_despues: filasDespues,
      antes: reporteAntes,
      despues: reporteDespues,
      reglas_modificadas: modificadas.length,
      reglas_no_modificadas: fotoDespues.length - modificadas.length,
      categorias_existentes_modificadas: fotoDespues
        .filter((row) => before.get(row.id)?.categoria_id && before.get(row.id).categoria_id !== row.categoria_id)
        .map((row) => row.id),
      idempotente: JSON.stringify(fotoDespues) === JSON.stringify(fotoRepeticion) && JSON.stringify(filasDespues) === JSON.stringify(filasRepeticion),
    };
  } finally {
    await db.exec("rollback");
  }
}

const RIESGOS_PENDIENTES = [
  "031 corrige textos visibles de reglas de trigo y soja por reemplazo exacto: un texto editado a mano después no se toca (queda como está).",
  "031 completa variables críticas/complementarias sólo en roya amarilla (dos reglas) y exceso hídrico; el resto sigue usando variables_requeridas como críticas.",
  "Las tablas migracion_031_respaldo y migracion_031_vinculos quedan en la base hasta confirmar que no hace falta revertir.",
  "032 crea lotes y datos de campo vacíos: el uso de lot_id requiere dar de alta lotes y vincularlos a una empresa.",
  "El runner aplica 030–032 al ejecutar db:migrate: no correrlo contra producción sin aprobación explícita del reporte.",
];

function toMarkdownPending(result, title = "Reporte de impacto — migraciones 030, 031 y 032") {
  const base = toMarkdown({ ...result }, title).split("\n");
  const tables = Object.keys(result.filas_despues);
  const rows = tables.map((table) => {
    const before = result.filas_antes[table];
    const after = result.filas_despues[table];
    const delta = after === null ? "—" : before === null ? `${after} (tabla nueva)` : String(after - before);
    return `| ${table} | ${before ?? "no existe"} | ${after ?? "no existe"} | ${delta} |`;
  });
  const header = [
    `# ${title}`, "",
    "Simulación en transacción revertida (ROLLBACK) sobre una copia: no persiste cambios.", "",
    "## Migraciones que se incorporarían (orden de ejecución)", "",
    ...result.migraciones.map((file, index) => `${index + 1}. \`${file}\``), "",
    "Dependencias: 030 y 031 requieren `categorias_agronomicas` (027); 032 requiere `empresas` (014). Ninguna depende de datos de desarrollo.", "",
    "## Filas por tabla", "", "| Tabla | Antes | Después | Nuevas |", "| --- | --- | --- | --- |", ...rows, "",
    "## Reglas", "", "| Indicador | Valor |", "| --- | --- |",
    `| Reglas modificadas | ${result.reglas_modificadas} |`,
    `| Reglas no modificadas | ${result.reglas_no_modificadas} |`,
    `| categoria_id existentes sobrescritos | ${result.categorias_existentes_modificadas.length} |`,
    `| Idempotente (030–032 repetidas sin cambios) | ${result.idempotente ? "sí" : "NO"} |`, "",
  ];
  // Detalle de 031 (vínculos, ambiguas, sin correspondencia, duplicados, inválidos).
  const detail = base.slice(base.findIndex((line) => line.startsWith("## Reglas por categoría")));
  const footer = [
    "", "## Estrategia de rollback", "",
    "- 032: tablas nuevas sin datos (salvo la semilla del catálogo); revertir con `drop table datos_campo, lotes, variables_agronomicas` si todavía no se cargaron datos.",
    "- 031: `db/operations/031_rollback.sql` deshace sólo los vínculos registrados en `migracion_031_vinculos` y restaura listas y textos desde `migracion_031_respaldo`. Termina en `rollback;` para revisar antes de confirmar.",
    "- 030: tabla nueva `agronomic_advisories`, vacía; revertir con `drop table agronomic_advisories` si no se publicaron avisos.",
    "- En todos los casos, quitar la fila correspondiente de `schema_migrations`.", "",
    "## Riesgos pendientes", "", ...RIESGOS_PENDIENTES.map((risk) => `- ${risk}`),
  ];
  return [...header, ...detail, ...footer].join("\n");
}

module.exports = { CANDIDATES_SQL, PENDING_MIGRATIONS, impactReport, simulate, simulatePending, toMarkdown, toMarkdownPending, MIGRATION_031 };
