import assert from "node:assert/strict";
import test from "node:test";
import { Cloud, CloudLightning, CloudRain, CloudSun, Sun } from "lucide-react";
import { weatherIconForCode } from "../components/results/ResultSummaryV2";

test("los códigos de Open-Meteo se traducen a iconos de previsión", () => {
  assert.equal(weatherIconForCode(0), Sun);
  assert.equal(weatherIconForCode(2), CloudSun);
  assert.equal(weatherIconForCode(61), CloudRain);
  assert.equal(weatherIconForCode(95), CloudLightning);
});

test("un código desconocido o ausente conserva la previsión con icono neutro", () => {
  assert.equal(weatherIconForCode(null), Cloud);
  assert.equal(weatherIconForCode(999), Cloud);
});
