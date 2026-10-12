import assert from "node:assert/strict";
import test from "node:test";
import {
  FICHAS_SANITARIAS,
  filtrarFichas,
} from "../lib/plagas/catalogo-publico";

test("el catálogo público conserva información trazable por cultivo", () => {
  assert.ok(FICHAS_SANITARIAS.length > 0);
  assert.ok(
    FICHAS_SANITARIAS.every(
      (ficha) =>
        ["soja", "trigo"].includes(ficha.cultivo) && ficha.fuentes.length > 0,
    ),
  );
});
test("combina el filtro de tipo con búsqueda por nombre científico", () => {
  assert.deepEqual(
    filtrarFichas({
      cultivo: "soja",
      tipo: "enfermedad",
      busqueda: "Phakopsora",
    }).map((ficha) => ficha.id),
    ["roya-asiatica"],
  );
});
test("no confunde una ficha en validación con una evaluación climática disponible", () => {
  assert.ok(
    FICHAS_SANITARIAS.every((ficha) =>
      ["informacion", "en_validacion", "no_evaluable"].includes(ficha.estado),
    ),
  );
});

test("separa plagas y enfermedades por el tipo estructurado del catálogo", () => {
  const plagas = filtrarFichas({
    cultivo: "soja",
    tipo: "plaga",
    busqueda: "",
  });
  const enfermedades = filtrarFichas({
    cultivo: "soja",
    tipo: "enfermedad",
    busqueda: "",
  });
  assert.ok(
    plagas.length > 0 && plagas.every((ficha) => ficha.tipo === "plaga"),
  );
  assert.ok(
    enfermedades.length > 0 &&
      enfermedades.every((ficha) => ficha.tipo === "enfermedad"),
  );
});

test("importa todas las filas incorporables de los catálogos de soja sin duplicados", () => {
  const plagas = filtrarFichas({
    cultivo: "soja",
    tipo: "plaga",
    busqueda: "",
  });
  const patogenos = filtrarFichas({
    cultivo: "soja",
    tipo: "enfermedad",
    busqueda: "",
  });

  assert.equal(plagas.length, 14);
  assert.equal(patogenos.length, 23);
  assert.equal(FICHAS_SANITARIAS.length, 57);
  assert.equal(new Set(FICHAS_SANITARIAS.map((ficha) => ficha.id)).size, 57);
});

test("incluye los diez patógenos documentados para trigo con su estado de catálogo", () => {
  const patogenos = filtrarFichas({
    cultivo: "trigo",
    tipo: "enfermedad",
    busqueda: "",
  });
  assert.equal(patogenos.length, 10);
  assert.ok(
    patogenos.every(
      (ficha) =>
        ficha.estadoReglaClimatica !== "aprobada" && ficha.fuentes.length > 1,
    ),
  );
});

test("conserva el estado informativo separado de una regla climática", () => {
  const trips = FICHAS_SANITARIAS.find((ficha) => ficha.id === "trips");
  const barrenador = FICHAS_SANITARIAS.find(
    (ficha) => ficha.id === "barrenador-menor-tallo",
  );
  assert.equal(trips?.estadoReglaClimatica, "pendiente_validacion");
  assert.equal(barrenador?.estadoReglaClimatica, "experimental");
  assert.ok(FICHAS_SANITARIAS.every((ficha) => ficha.fuentes.length > 0));
});

test("incluye las diez plagas documentadas de trigo sin activar reglas climaticas", () => {
  const plagas = filtrarFichas({
    cultivo: "trigo",
    tipo: "plaga",
    busqueda: "",
  });

  assert.equal(plagas.length, 10);
  assert.equal(new Set(plagas.map((ficha) => ficha.id)).size, 10);
  assert.ok(plagas.every((ficha) => ficha.estadoReglaClimatica !== "aprobada"));
  assert.ok(
    plagas.every((ficha) =>
      ficha.fuentes.some((fuente) => fuente.includes("Plagas del trigo")),
    ),
  );
});

test("permite encontrar una plaga de trigo por su nombre cientifico", () => {
  assert.deepEqual(
    filtrarFichas({
      cultivo: "trigo",
      tipo: "plaga",
      busqueda: "Schizaphis",
    }).map((ficha) => ficha.id),
    ["trigo-pulgon-verde-cereales"],
  );
});
