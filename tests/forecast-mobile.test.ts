import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ForecastSection } from "../components/results/ResultSummaryV2";

test("la previsión inicia colapsada en mobile y permanece expandida en desktop", () => {
  const html = renderToStaticMarkup(React.createElement(ForecastSection, { forecast: [{ fecha: "2026-09-08", codigoMeteorologico: 0, temperaturaMinima: 10, temperaturaMaxima: 20, precipitacion: 0, humedadRelativa: 60, vientoMedio: 12 }] }));
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /hidden border-t/);
  assert.match(html, /lg:block/);
  assert.match(html, /Próximos 5 días/);
});
