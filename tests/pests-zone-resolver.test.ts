import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// resolveAgronomicZone (lib/pests/zone-resolver.ts) referenció durante un tiempo
// z.estado y z.version, columnas que zonas_agronomicas nunca tuvo (solo tiene
// activa boolean) — el bug pasó desapercibido porque ENABLE_PLAGAS está apagado
// en producción y ningún test corría esa query contra un esquema real. Este test
// no reemplaza probarlo contra Postgres real, pero evita que un nombre de columna
// inventado vuelva a colarse sin que ningún test lo note: parsea las columnas
// reales de la migración y valida que la query no referencie ninguna otra.
function columnasDe(tabla: string, migracionCruda: string): string[] {
  const migracion = migracionCruda.replace(/\r\n/g, "\n");
  const match = new RegExp(`create table if not exists ${tabla} \\(([\\s\\S]*?)\\n\\);`).exec(migracion);
  if (!match) throw new Error(`no se encontró la tabla ${tabla} en la migración`);
  return match[1]
    .split("\n")
    .map((line) => line.replace(/--.*$/, "").trim().replace(/,$/, ""))
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[0]);
}

test("resolveAgronomicZone solo referencia columnas que existen en zonas_agronomicas", () => {
  const migracion = readFileSync("db/migrations/012_plagas.sql", "utf8");
  const columnas = columnasDe("zonas_agronomicas", migracion);
  assert.ok(columnas.includes("activa"), "la migración debería declarar la columna activa");
  assert.ok(!columnas.includes("estado") && !columnas.includes("version"), "zonas_agronomicas no tiene estado ni version");

  const fuente = readFileSync("lib/pests/zone-resolver.ts", "utf8");
  const referencias = [...fuente.matchAll(/\bz\.(\w+)/g)].map((match) => match[1]);
  assert.ok(referencias.length > 0, "la query debería referenciar al menos una columna de z");
  for (const columna of referencias) {
    assert.ok(columnas.includes(columna), `zone-resolver.ts referencia z.${columna}, que no existe en zonas_agronomicas`);
  }
});
