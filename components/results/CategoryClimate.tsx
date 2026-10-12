"use client";

import { useState } from "react";
import { Droplets, Thermometer, Umbrella } from "lucide-react";
import type { HistoricalTemperature } from "@/lib/climate/historical-provider";
import type { SerieClimaticaDiaria } from "@/types";
import {
  aggregateClimate,
  formatDate,
  formatNumber,
} from "@/lib/results/presentation";
import InteractiveLineChart from "@/components/results/InteractiveLineChart";

type ClimateView = "observed" | "historical";

export function CategoryClimate({
  series,
  category,
  historico,
}: {
  series: SerieClimaticaDiaria[];
  category?: string;
  historico?: HistoricalTemperature;
}) {
  const [view, setView] = useState<ClimateView>("observed");
  const [expanded, setExpanded] = useState(false);
  const climate = aggregateClimate(series);
  const temperatures = series
    .flatMap((day) => [day.temperaturaMinima, day.temperaturaMaxima])
    .filter((value): value is number => value !== null);
  const period = series.length
    ? `${formatDate(series[0].fecha, true)} – ${formatDate(series[series.length - 1].fecha, true)}`
    : "Sin datos disponibles";
  const isWaterCategory =
    category === "estres_hidrico" || category === "exceso_hidrico";
  const historicalSeries = historico?.serie_historica ?? [];
  const historicalTemperatureKey =
    category === "heladas" ? "temperatura_minima" : "temperatura_media";
  const historicalMetric = (key: string) =>
    historico?.comparaciones.find((comparison) => comparison.clave === key);

  return (
    <section className="rounded-xl border bg-white p-5 lg:col-span-3">
      <h2 className="text-lg font-bold">Condiciones ambientales observadas</h2>
      <p className="mt-1 text-sm text-[#526477]">
        Serie climática visualizada: {period} ({series.length} días).
      </p>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="mt-3 min-h-11 text-sm font-bold text-[#087b4b] md:hidden"
      >
        {expanded ? "Ocultar condiciones" : "Ver condiciones ambientales"}
      </button>
      <div className={expanded ? "" : "hidden md:block"}>
        <div
          className="mt-4 flex gap-2 border-b"
          role="tablist"
          aria-label="Datos climáticos"
        >
          <Tab
            active={view === "observed"}
            onClick={() => setView("observed")}
            label="Datos observados"
          />
          <Tab
            active={view === "historical"}
            onClick={() => setView("historical")}
            label="Comparación histórica"
          />
        </div>
        {view === "observed" ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <Card
              Icon={Thermometer}
              title={
                category === "heladas" ? "Temperatura mínima" : "Temperatura"
              }
              primary={
                category === "heladas"
                  ? `Mínima: ${formatNumber(temperatures.length ? Math.min(...temperatures) : null)} °C`
                  : `Media: ${formatNumber(climate.temperature)} °C`
              }
              details={[
                `Mínima: ${formatNumber(temperatures.length ? Math.min(...temperatures) : null)} °C`,
                `Máxima: ${formatNumber(temperatures.length ? Math.max(...temperatures) : null)} °C`,
              ]}
              dates={series.map((day) => day.fecha)}
              values={series.map((day) =>
                category === "heladas"
                  ? day.temperaturaMinima
                  : day.temperaturaMedia,
              )}
              unit="°C"
            />
            <Card
              Icon={Droplets}
              title={
                isWaterCategory
                  ? "Humedad del suelo (0–1 cm)"
                  : "Humedad relativa"
              }
              primary={
                isWaterCategory
                  ? "Datos observados"
                  : `Media: ${formatNumber(climate.humidity)} %`
              }
              dates={series.map((day) => day.fecha)}
              values={series.map((day) =>
                isWaterCategory
                  ? day.humedadSuelo.profundidad0a1cm
                  : day.humedadRelativa,
              )}
              unit={isWaterCategory ? "m³/m³" : "%"}
            />
            <Card
              Icon={Umbrella}
              title="Precipitaciones"
              primary={`Acumulado: ${formatNumber(climate.precipitation)} mm`}
              details={[`Días con lluvia: ${climate.rainyDays}`]}
              dates={series.map((day) => day.fecha)}
              values={series.map((day) => day.precipitacion)}
              unit="mm"
              bars
            />
          </div>
        ) : historico?.disponible && historicalSeries.length ? (
          <div className="mt-4">
            <p className="text-sm text-[#526477]">
              Referencia histórica {historico.periodo_referencia}, para las
              mismas fechas del período visualizado.
            </p>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <Card
                Icon={Thermometer}
                title={
                  category === "heladas" ? "Temperatura mínima" : "Temperatura"
                }
                primary={`Referencia: ${formatNumber(historicalMetric(historicalTemperatureKey)?.historico ?? null)} °C`}
                details={[`Período: ${historico.periodo_referencia}`]}
                dates={series.map((day) => day.fecha)}
                values={series.map((day) =>
                  category === "heladas"
                    ? day.temperaturaMinima
                    : day.temperaturaMedia,
                )}
                comparisonValues={historicalSeries.map((day) =>
                  category === "heladas" ? day.minima : day.media,
                )}
                unit="°C"
              />
              {isWaterCategory ? (
                <UnavailableHistoricalCard
                  Icon={Droplets}
                  title="Humedad del suelo (0–1 cm)"
                  message="No hay una referencia histórica metodológicamente comparable para esta variable."
                />
              ) : (
                <Card
                  Icon={Droplets}
                  title="Humedad relativa"
                  primary={`Referencia: ${formatNumber(historicalMetric("humedad_relativa")?.historico ?? null)} %`}
                  details={[`Período: ${historico.periodo_referencia}`]}
                  dates={series.map((day) => day.fecha)}
                  values={series.map((day) => day.humedadRelativa)}
                  comparisonValues={historicalSeries.map(
                    (day) => day.humedad ?? null,
                  )}
                  unit="%"
                />
              )}
              <Card
                Icon={Umbrella}
                title="Precipitaciones"
                primary={`Referencia: ${formatNumber(historicalMetric("precipitacion")?.historico ?? null)} mm`}
                details={[`Período: ${historico.periodo_referencia}`]}
                dates={series.map((day) => day.fecha)}
                values={series.map((day) => day.precipitacion)}
                comparisonValues={historicalSeries.map(
                  (day) => day.precipitacion ?? null,
                )}
                unit="mm"
                bars
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-[#f7f9f8] p-4 text-sm text-[#526477]">
            La comparación histórica no está disponible para esta consulta. Esta
            información contextual no modifica las evaluaciones agronómicas.
          </p>
        )}
      </div>
    </section>
  );
}

function Tab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-10 border-b-2 px-3 text-sm font-semibold ${active ? "border-[#087b4b] text-[#087b4b]" : "border-transparent text-[#526477]"}`}
    >
      {label}
    </button>
  );
}

function UnavailableHistoricalCard({
  Icon,
  title,
  message,
}: {
  Icon: typeof Thermometer;
  title: string;
  message: string;
}) {
  return (
    <article className="rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[#087b4b]" />
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="mt-4 text-sm text-[#526477]">{message}</p>
    </article>
  );
}

function Card({
  Icon,
  title,
  primary,
  details = [],
  dates,
  values,
  unit,
  bars = false,
  comparisonValues,
}: {
  Icon: typeof Thermometer;
  title: string;
  primary: string;
  details?: string[];
  dates: string[];
  values: Array<number | null>;
  unit: string;
  bars?: boolean;
  comparisonValues?: Array<number | null>;
}) {
  return (
    <article className="rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[#087b4b]" />
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm font-semibold">{primary}</p>
        </div>
      </div>
      {details.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#405369]">
          {details.map((detail) => (
            <span key={detail} className="rounded bg-[#f7f9f8] p-2">
              {detail}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 h-40">
        <InteractiveLineChart
          dates={dates}
          values={values}
          label={title}
          unit={unit}
          bars={bars ? values : undefined}
          comparisonValues={comparisonValues}
        />
      </div>
    </article>
  );
}
