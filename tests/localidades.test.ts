import test from "node:test";
import assert from "node:assert/strict";
import { resolveLocalidad } from "../lib/localidades/normalize";

test("mantiene la normalización local para localidades conocidas", async () => {
  const localidad = await resolveLocalidad("Gral. Pico");
  assert.equal(localidad?.nombre, "General Pico");
  assert.equal(localidad?.provincia, "La Pampa");
});

test("resuelve una ciudad argentina mediante geocodificación", async () => {
  let requestedUrl = "";
  const fakeFetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ results: [{
      name: "Rafaela",
      latitude: -31.25033,
      longitude: -61.4867,
      country_code: "AR",
      admin1: "Santa Fe",
    }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  const localidad = await resolveLocalidad("Rafaela, Santa Fe", fakeFetch);
  assert.equal(localidad?.nombre, "Rafaela");
  assert.equal(localidad?.provincia, "Santa Fe");
  assert.equal(localidad?.pais, "Argentina");
  assert.match(requestedUrl, /countryCode=AR/);
  assert.match(requestedUrl, /Rafaela/);
});

test("rechaza resultados fuera de Argentina", async () => {
  const fakeFetch = (async () => new Response(JSON.stringify({ results: [{
    name: "Córdoba",
    latitude: 37.88,
    longitude: -4.77,
    country_code: "ES",
    admin1: "Andalucía",
  }] }), { status: 200 })) as typeof fetch;

  assert.equal(await resolveLocalidad("Córdoba", fakeFetch), null);
});
