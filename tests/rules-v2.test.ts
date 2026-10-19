import test from "node:test";
import assert from "node:assert/strict";
import { RulesEngineV2 } from "../lib/rules/engine-v2";
import { IndicatorEngine } from "../lib/indicators/engine";
import type { ReglaAgronomicaV2, SerieClimaticaDiaria } from "../types";

const engine = new RulesEngineV2();
const at = "2026-07-24T12:00:00.000Z";
const base = (
  clave: string,
  window: number,
  niveles: ReglaAgronomicaV2["definicion"]["niveles"],
  fallback: any = { estado: "sin_condiciones" },
): ReglaAgronomicaV2 => ({
  id: clave,
  clave,
  version: "1.0",
  cultivo: "soja",
  estado: "vigente",
  ventana_dias: window,
  fuente_tecnica: "fixture",
  limitaciones_declaradas: "fixture",
  validado_por: "fixture",
  validado_en: at,
  condiciones_revision: "fixture",
  decisiones_pendientes: [],
  definicion: { niveles, sin_coincidencia: fallback },
});
function c(
  variable: any,
  agregador: any,
  operador: any,
  valor: any,
  unidad: string,
) {
  return { variable, agregador, operador, valor, unidad };
}
function rain(operador: any, valor: any) {
  return {
    ...c("precipitacion", "dias_con_condicion", operador, valor, "dias"),
    subcondicion: { operador: "gte" as const, valor: 1, unidad: "mm" },
  };
}
const foliar = base(
  "enfermedades_foliares",
  5,
  [
    {
      orden: 1,
      clave: "favorable",
      orden_visual: 1,
      etiqueta: "Favorables",
      condiciones: [
        c("humedad_relativa", "media_ventana", "gt", 80, "%"),
        rain("gte", 3),
        c("temperatura_media", "media_ventana", "between", [18, 28], "C"),
      ],
    },
    {
      orden: 2,
      clave: "vigilancia",
      orden_visual: 2,
      etiqueta: "Moderadas",
      condiciones: [
        c("humedad_relativa", "media_ventana", "between", [65, 80], "%"),
        rain("between", [1, 2]),
        c("temperatura_media", "media_ventana", "between", [18, 28], "C"),
      ],
    },
    {
      orden: 3,
      clave: "sin_condiciones",
      orden_visual: 3,
      etiqueta: "Desfavorables",
      condiciones: [
        c("humedad_relativa", "media_ventana", "lt", 65, "%"),
        rain("eq", 0),
      ],
    },
  ],
  { estado: "no_evaluable", motivo: "sin_nivel_coincidente" },
);
const frost = base("temperatura_bajo_umbral", 3, [
  {
    orden: 1,
    clave: "favorable",
    orden_visual: 1,
    etiqueta: "FrÃ­o",
    condiciones: [c("temperatura_min", "min_ventana", "lt", 2, "C")],
  },
]);
const dry = base("baja_precipitacion", 14, [
  {
    orden: 1,
    clave: "favorable",
    orden_visual: 1,
    etiqueta: "Baja P",
    condiciones: [c("precipitacion", "suma_ventana", "lt", 10, "mm")],
  },
]);
const wet = base("precipitacion_elevada", 7, [
  {
    orden: 1,
    clave: "favorable",
    orden_visual: 1,
    etiqueta: "Alta P",
    condiciones: [c("precipitacion", "suma_ventana", "gt", 100, "mm")],
  },
]);
const royaAmarillaOpenMeteo = {
  ...base("roya_amarilla", 1, [
  {
    orden: 1,
    clave: "vigilancia",
    orden_visual: 1,
    etiqueta: "Vigilancia tÃ©rmica",
    condiciones: [c("temperatura_media", "media_ventana", "between", [10, 15], "Â°C")],
  },
  ]),
  variables_requeridas: ["temperatura_media"],
};
const royaAmarillaMojado = {
  ...base("roya_amarilla_mojado_foliar", 1, [
    {
      orden: 1,
      clave: "favorable",
      orden_visual: 1,
      etiqueta: "Mojado foliar medido",
      condiciones: [
        c("temperatura_media", "media_ventana", "between", [10, 15], "Â°C"),
        c("leaf_wetness_hours", "media_ventana", "gte", 6, "h"),
      ],
    },
  ]),
  variables_requeridas: ["temperatura_media", "leaf_wetness_hours"],
};
function days(
  count: number,
  {
    hr = 75,
    temp = 22,
    rainDays = 0,
    totalRain = rainDays,
    min = 5,
  }: {
    hr?: number;
    temp?: number;
    rainDays?: number;
    totalRain?: number;
    min?: number;
  } = {},
): SerieClimaticaDiaria[] {
  return Array.from({ length: count }, (_, i) => ({
    fecha: `2026-07-${String(10 + i).padStart(2, "0")}`,
    temperaturaMedia: temp,
    temperaturaMinima: min,
    temperaturaMaxima: temp + 5,
    humedadRelativa: hr,
    precipitacion: i < rainDays ? totalRain / rainDays : 0,
    vientoMedio: 10,
    puntoRocio: null,
    deficitPresionVapor: null,
    evapotranspiracion: null,
    et0: 2,
    humedadSuelo: {
      profundidad0a1cm: null,
      profundidad1a3cm: null,
      profundidad3a9cm: null,
      profundidad9a27cm: null,
      profundidad27a81cm: null,
    },
    temperaturaSuelo: {
      profundidad0cm: null,
      profundidad6cm: null,
      profundidad18cm: null,
      profundidad54cm: null,
    },
    radiacionSolar: null,
  }));
}
const cases: [string, SerieClimaticaDiaria[], string][] = [
  [
    "1 favorable",
    days(5, { hr: 85, rainDays: 3, totalRain: 6, temp: 22 }),
    "favorable",
  ],
  [
    "2 moderada",
    days(5, { hr: 75, rainDays: 2, totalRain: 4, temp: 21 }),
    "vigilancia",
  ],
  ["3 desfavorable", days(5, { hr: 60 }), "sin_condiciones"],
  [
    "4 HR alta y poca lluvia",
    days(5, { hr: 85, rainDays: 1, temp: 24 }),
    "no_evaluable",
  ],
  [
    "5 HR intermedia y mucha lluvia",
    days(5, { hr: 70, rainDays: 4, temp: 22 }),
    "no_evaluable",
  ],
  [
    "6 temperatura fuera de rango",
    days(5, { hr: 85, rainDays: 4, temp: 31 }),
    "no_evaluable",
  ],
  ["7 HR baja con lluvia", days(5, { hr: 60, rainDays: 2 }), "no_evaluable"],
  ["8 invierno", days(5, { hr: 75, rainDays: 2, temp: 8 }), "no_evaluable"],
  ["9 borde HR 80", days(5, { hr: 80, rainDays: 2 }), "vigilancia"],
  [
    "10 borde HR 80 lluvia fuera",
    days(5, { hr: 80, rainDays: 3 }),
    "no_evaluable",
  ],
  ["11 borde HR 65", days(5, { hr: 65, rainDays: 1, temp: 20 }), "vigilancia"],
];
for (const [name, series, expected] of cases)
  test(name, () =>
    assert.equal(engine.evaluate(foliar, series, at).estado, expected),
  );
test("12 traza 0.3 no cuenta", () => {
  const condition = rain("eq", 0);
  const result = new IndicatorEngine().calculate(
    condition,
    [...days(4), { ...days(1)[0], fecha: "2026-07-20", precipitacion: 0.3 }],
    5,
  );
  assert.equal(result.valor, 0);
});
test("13 helada activa", () =>
  assert.equal(
    engine.evaluate(frost, days(3, { min: 1.9 }), at).estado,
    "favorable",
  ));
test("14 helada borde", () =>
  assert.equal(
    engine.evaluate(frost, days(3, { min: 2 }), at).estado,
    "sin_condiciones",
  ));
test("15 un dÃ­a bajo umbral", () => {
  const s = days(3);
  s[0].temperaturaMinima = 4.1;
  s[1].temperaturaMinima = 1.7;
  s[2].temperaturaMinima = 3.5;
  assert.equal(engine.evaluate(frost, s, at).estado, "favorable");
});
test("16 baja precipitaciÃ³n bordes", () => {
  assert.equal(
    engine.evaluate(dry, days(14, { totalRain: 9.9, rainDays: 1 }), at).estado,
    "favorable",
  );
  assert.equal(
    engine.evaluate(dry, days(14, { totalRain: 10, rainDays: 1 }), at).estado,
    "sin_condiciones",
  );
});
test("17 precipitaciÃ³n elevada bordes", () => {
  assert.equal(
    engine.evaluate(wet, days(7, { totalRain: 100, rainDays: 1 }), at).estado,
    "sin_condiciones",
  );
  assert.equal(
    engine.evaluate(wet, days(7, { totalRain: 100.1, rainDays: 1 }), at).estado,
    "favorable",
  );
});
test("18 null no es cero", () => {
  const s = days(14, { totalRain: 3, rainDays: 1 });
  s[4].precipitacion = null;
  const r = engine.evaluate(dry, s, at);
  assert.equal(r.estado, "no_evaluable");
  assert.equal(r.motivo, "datos_insuficientes");
});
test("19 variables nuevas quedan disponibles para agregaciones futuras", () => {
  const s = days(3);
  s.forEach((day, index) => {
    day.deficitPresionVapor = index + 1;
    day.humedadSuelo.profundidad9a27cm = 0.2 + index * 0.1;
  });
  assert.equal(
    new IndicatorEngine().calculate(
      c("deficit_presion_vapor", "media_ventana", "gt", 0, "kPa"),
      s,
      3,
    ).valor,
    2,
  );
  assert.equal(
    new IndicatorEngine().calculate(
      c("humedad_suelo_9_27cm", "min_ventana", "gt", 0, "m3/m3"),
      s,
      3,
    ).valor,
    0.2,
  );
});
test("20 una regla configurable aplica Zadoks sin ramificaciones por cultivo", () => {
  const configurable: ReglaAgronomicaV2 = {
    ...base("helada_floracion", 1, [
      {
        orden: 1,
        clave: "vigilancia",
        orden_visual: 1,
        etiqueta: "Temperatura mÃ­nima a monitorear",
        condiciones: [c("temperatura_min", "min_ventana", "lte", -1, "Â°C")],
      },
    ]),
    cultivo: "trigo",
    variables_requeridas: ["temperatura_min", "codigo_zadoks"],
    zadoks_desde: 60,
    zadoks_hasta: 69,
    nivel_resultado: "vigilancia",
    texto_alerta: "Temperatura mÃ­nima a monitorear",
    condiciones_logicas: {
      all: [c("temperatura_min", "min_ventana", "lte", -1, "Â°C")],
      sin_coincidencia: { estado: "sin_condiciones" },
    },
  };
  const result = engine.evaluate(configurable, days(1, { min: -1 }), at, {
    disponible: true,
    estadio_estimado: "FloraciÃ³n",
    descripcion: "",
    fuente: "manual",
    modifica_reglas: false as const,
    codigo_zadoks: 65,
  });
  assert.equal(result.estado, "vigilancia");
  // No inferir Zadoks a partir del nombre del estadio ni de variables climáticas.
  for (const missing of [undefined, null]) {
    const withoutZadoks = engine.evaluate(configurable, days(1, { min: -1 }), at, {
      disponible: true,
      estadio_estimado: "Floración",
      modifica_reglas: false,
      codigo_zadoks: missing,
    });
    assert.equal(withoutZadoks.estado, "no_evaluable");
    assert.equal(withoutZadoks.motivo, "dato_requerido_no_disponible:codigo_zadoks");
  }
  assert.equal(engine.evaluate(configurable, days(1, { min: -1 }), at, {
    disponible: true, modifica_reglas: false, codigo_zadoks: 59,
  }).motivo, "fuera_fenologia");
});
test("21 una variable de plan pago ausente devuelve no evaluable", () => {
  const requiresSoil: ReglaAgronomicaV2 = {
    ...base("estres_suelo", 3, [
      {
        orden: 1,
        clave: "vigilancia",
        orden_visual: 1,
        etiqueta: "Contexto hÃ­drico",
        condiciones: [
          c("humedad_suelo_9_27cm", "media_ventana", "lt", 0.2, "mÂ³/mÂ³"),
        ],
      },
    ]),
    variables_requeridas: ["humedad_suelo_9_27cm"],
    texto_no_evaluable:
      "Se requiere informaciÃ³n de suelo o balance hÃ­drico del lote.",
  };
  const result = engine.evaluate(requiresSoil, days(3), at);
  assert.equal(result.estado, "no_evaluable");
  assert.equal(
    result.explicacion,
    "Se requiere informaciÃ³n de suelo o balance hÃ­drico del lote.",
  );
});
test("22 roya amarilla prioriza vigilancia tÃ©rmica si falta mojado foliar real", () => {
  const series = days(1, { temp: 12 });
  const phenology = {
    disponible: true,
    estadio_estimado: "EncaÃ±azÃ³n",
    descripcion: "",
    fuente: "manual" as const,
    modifica_reglas: false,
    codigo_zadoks: 35,
  } as const;
  assert.equal(engine.evaluate(royaAmarillaMojado, series, at, phenology).estado, "no_evaluable");
  assert.equal(engine.evaluate(royaAmarillaOpenMeteo, series, at, phenology).estado, "vigilancia");
});
test("23 roya amarilla completa requiere temperatura y mojado foliar medido", () => {
  const series = days(1, { temp: 12 });
  series[0].leafWetnessHours = 6;
  assert.equal(engine.evaluate(royaAmarillaMojado, series, at).estado, "favorable");
  series[0].leafWetnessHours = 5;
  assert.equal(engine.evaluate(royaAmarillaMojado, series, at).estado, "sin_condiciones");
  assert.equal(engine.evaluate(royaAmarillaOpenMeteo, days(1, { temp: 16 }), at).estado, "sin_condiciones");
  const withoutTemperature = days(1, { temp: 12 });
  withoutTemperature[0].temperaturaMedia = null;
  assert.equal(engine.evaluate(royaAmarillaOpenMeteo, withoutTemperature, at).estado, "no_evaluable");
});
