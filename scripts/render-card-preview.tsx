// Renderiza las tarjetas del resumen con el componente real y las reglas reales
// (migraciones 001–032 aplicadas en un PostgreSQL embebido, sin tocar ninguna base).
// Clima, lote y datos de campo son ilustrativos: no corresponden a un lote real.
//
// Uso: npx tsx scripts/render-card-preview.tsx <directorio-salida>
// Escribe roya-mancha.html, lote.html, lote-detalle.html, trigo.html y soja.html.
import { writeFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { migratedDatabase, loadRules } from "../tests/helpers/migrated-db";
import { evaluateRules } from "@/lib/rules/evaluation-core";
import { consolidateCategoryRisks } from "@/lib/rules/consolidation";
import { categoriesForResult, type CategoryCardModel } from "@/lib/results/category-presentation";
import { currentFieldData, type FieldDatum } from "@/lib/field-data/current";
import { ConsultaService } from "@/lib/consultas/service";
import { CategoryRiskCard } from "@/components/results/CategoryRiskCard";
import { CategoryMatches } from "@/components/results/CategoryMatches";
import type { ContextoFenologico, ReglaAgronomicaV2, RiskCategory, SerieClimaticaDiaria } from "@/types";

const at = "2026-10-19T12:00:00.000Z";
const noPhenology: ContextoFenologico = { disponible: false, motivo: "entradas_insuficientes", modifica_reglas: false };
const ILLUSTRATIVE_LOT = { id: "00000000-0000-4000-8000-000000000001", empresa_id: "empresa-ilustrativa", nombre: "Lote ilustrativo", cultivo: "trigo", activo: true };

/** Serie diaria tipo Open-Meteo: sin horas de mojado foliar. */
function openMeteoSeries({ temp, min, rain, humidity }: { temp: number; min: number; rain: number; humidity: number }): SerieClimaticaDiaria[] {
  return Array.from({ length: 14 }, (_, i) => ({
    fecha: `2026-10-${String(6 + i).padStart(2, "0")}`, temperaturaMedia: temp, temperaturaMinima: min, temperaturaMaxima: temp + 7,
    humedadRelativa: humidity, precipitacion: rain, vientoMedio: 12, puntoRocio: temp - 4, deficitPresionVapor: 0.6, evapotranspiracion: 2.5, et0: 3,
    humedadSuelo: { profundidad0a1cm: 0.28, profundidad1a3cm: 0.29, profundidad3a9cm: 0.3, profundidad9a27cm: 0.31, profundidad27a81cm: 0.32 },
    temperaturaSuelo: { profundidad0cm: temp, profundidad6cm: temp, profundidad18cm: temp, profundidad54cm: temp },
    radiacionSolar: 210, leafWetnessHours: null,
  }));
}

const cardsHtml = (cards: CategoryCardModel[]) =>
  cards.map((category) => renderToStaticMarkup(React.createElement(CategoryRiskCard, { category, basePath: "/resultado" }))).join("\n");

async function main() {
  const out = process.argv[2] ?? ".";
  const write = (name: string, html: string) => writeFileSync(path.join(out, name), html);
  const { query } = await migratedDatabase({ until: "033" });
  const categories = await query<RiskCategory>("select id::text, clave as key, nombre as name from categorias_agronomicas where activa order by clave");
  const order = ["enfermedades_foliares", "plagas", "heladas", "estres_hidrico", "exceso_hidrico"];
  categories.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  const trigoSeries = openMeteoSeries({ temp: 12, min: 4, rain: 2, humidity: 78 });
  const load = (crop: string, filter = "true") =>
    loadRules(query, `r.cultivo = $1 and r.activa = true and r.estado in ('vigente', 'experimental') and ${filter}`, [crop]);
  const consolidated = (rules: ReglaAgronomicaV2[], series: SerieClimaticaDiaria[]) => {
    const evaluated = evaluateRules({ rules, series, evaluatedAt: at, phenology: noPhenology });
    return categoriesForResult({ reglas: evaluated, categorias: consolidateCategoryRisks(categories, evaluated, []) });
  };

  // 1) Roya amarilla + mancha amarilla, 12 °C, sin mojado foliar.
  const royaMancha = await load("trigo", "(r.clave like 'roya_amarilla%' or r.clave = 'mancha_amarilla')");
  write("roya-mancha.html", cardsHtml(consolidated(royaMancha, trigoSeries).slice(0, 1)));

  // 2) Misma consulta con lot_id: un dato de sensor vigente completa el mojado foliar.
  const records: FieldDatum[] = [{
    id: "dato-ilustrativo", field_id: ILLUSTRATIVE_LOT.id, variable_key: "leaf_wetness_hours", value: 8, unit: "h",
    observed_at: "2026-10-18T09:00:00.000Z", status: "vigente", source: "sensor", recorded_by: "ilustrativo",
  }];
  const service = new ConsultaService({
    climate: { obtenerSerie: async (input) => ({
      proveedor: "Open-Meteo (ilustrativo)", coordenadas: { latitud: input.localidad.latitud, longitud: input.localidad.longitud }, fechaConsulta: input.fechaRef,
      rangoTemporal: { desde: trigoSeries[0].fecha, hasta: trigoSeries.at(-1)!.fecha }, variablesDisponibles: [], variablesFaltantes: [], diasSolicitados: 14,
      diasDisponibles: 14, obtenidoEn: at, cobertura: 1, errores: [], adapterVersion: "preview", serie: trigoSeries, prevision: [],
    }) },
    loadRules: async () => royaMancha, persist: async () => null, phenology: { estimarEstadio: async () => noPhenology },
    loadCategories: async () => categories, loadAdvisories: async () => [], loadVariableLabels: async () => new Map(),
    loadLot: async () => ILLUSTRATIVE_LOT, loadFieldData: async (_lot, when) => currentFieldData(records, when),
  });
  const withLot = await service.ejecutar(
    { cultivo: "trigo", localidad: "Tandil", fechaRef: "2026-10-19", lotId: ILLUSTRATIVE_LOT.id },
    "preview", { actor: { kind: "empresa", empresaId: ILLUSTRATIVE_LOT.empresa_id } },
  );
  const lotCards = categoriesForResult(withLot);
  write("lote.html", cardsHtml(lotCards.slice(0, 1)));
  write("lote-detalle.html", renderToStaticMarkup(React.createElement(CategoryMatches, { matches: lotCards[0].matched_rules })));
  write("lote-procedencia.json", JSON.stringify(withLot.data_provenance, null, 2));

  // 3) Todas las reglas de cada cultivo.
  write("trigo.html", cardsHtml(consolidated(await load("trigo"), trigoSeries)));
  write("soja.html", cardsHtml(consolidated(await load("soja"), openMeteoSeries({ temp: 22, min: 14, rain: 3, humidity: 86 }))));
  console.log(`roya-mancha y lote (${lotCards[0].display_status}) renderizados en ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
