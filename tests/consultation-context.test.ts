import assert from "node:assert/strict";
import test from "node:test";
import { consultationContext } from "../components/results/ResultSummaryV2";
import type { ResultadoConsultaV2Publica } from "../types";

function result(overrides: Partial<ResultadoConsultaV2Publica> = {}) { return { cultivo: "soja", localidad: { nombre: "Tandil", provincia: "Buenos Aires" }, contexto_fenologico: { disponible: true, estadio_estimado: "R3", descripcion: "Inicio de formación de vainas", modifica_reglas: false }, ...overrides } as ResultadoConsultaV2Publica; }

test("muestra ubicación, cultivo y fenología informada de la consulta", () => assert.deepEqual(consultationContext(result()), { ubicacion: "Tandil, Buenos Aires", cultivo: "Soja", fenologia: "R3 · Inicio de formación de vainas" }));
test("distingue fenología no informada y ubicación sin provincia", () => assert.deepEqual(consultationContext(result({ localidad: { nombre: "Tandil", provincia: "" } as ResultadoConsultaV2Publica["localidad"], contexto_fenologico: { disponible: false, modifica_reglas: false } })), { ubicacion: "Tandil", cultivo: "Soja", fenologia: "No informada" }));
