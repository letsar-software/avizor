"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronUp,
  CloudRain,
  Droplets,
  MapPin,
  Thermometer,
} from "lucide-react";
import type { HistoricalComparison } from "@/lib/climate/historical-provider";
import { formatDate, formatNumber } from "@/lib/results/presentation";
import type { ResultadoConsultaV2Publica } from "@/types";

type ClimateMetric =
  | "temperatura_media"
  | "temperatura_minima"
  | "temperatura_maxima"
  | "precipitacion"
  | "dias_lluvia"
  | "humedad_relativa";

const metrics: Array<{
  key: ClimateMetric;
  label: string;
  description: string;
  unit: "°C" | "mm" | "días" | "%";
  Icon: typeof Thermometer;
  bars?: boolean;
}> = [
  {
    key: "temperatura_media",
    label: "Temperatura media",
    description: "Promedio diario de las temperaturas máxima y mínima.",
    unit: "°C",
    Icon: Thermometer,
  },
  {
    key: "temperatura_minima",
    label: "Temperatura mínima",
    description: "Promedio de las temperaturas mínimas diarias.",
    unit: "°C",
    Icon: Thermometer,
  },
  {
    key: "temperatura_maxima",
    label: "Temperatura máxima",
    description: "Promedio de las temperaturas máximas diarias.",
    unit: "°C",
    Icon: Thermometer,
  },
  {
    key: "precipitacion",
    label: "Precipitaciones",
    description: "Precipitación acumulada durante el período consultado.",
    unit: "mm",
    Icon: CloudRain,
    bars: true,
  },
  {
    key: "dias_lluvia",
    label: "Días con lluvia",
    description: "Días con precipitación diaria de al menos 1 mm.",
    unit: "días",
    Icon: CalendarDays,
    bars: true,
  },
  {
    key: "humedad_relativa",
    label: "Humedad relativa",
    description: "Promedio de la humedad relativa diaria.",
    unit: "%",
    Icon: Droplets,
  },
];

function comparisonFor(
  result: ResultadoConsultaV2Publica,
  key: ClimateMetric,
): HistoricalComparison | undefined {
  return result.historico_temperatura?.comparaciones.find(
    (comparison) => comparison.clave === key,
  );
}

function valueForDay(
  day: NonNullable<
    ResultadoConsultaV2Publica["historico_temperatura"]
  >["serie_observada"][number],
  key: ClimateMetric,
) {
  if (key === "temperatura_media") return day.media;
  if (key === "temperatura_minima") return day.minima;
  if (key === "temperatura_maxima") return day.maxima;
  if (key === "precipitacion") return day.precipitacion ?? null;
  if (key === "humedad_relativa") return day.humedad ?? null;
  return day.precipitacion === null || day.precipitacion === undefined
    ? null
    : day.precipitacion >= 1
      ? 1
      : 0;
}

function historicalValueForDay(
  day: NonNullable<
    ResultadoConsultaV2Publica["historico_temperatura"]
  >["serie_historica"][number],
  key: ClimateMetric,
) {
  if (key === "temperatura_media") return day.media;
  if (key === "temperatura_minima") return day.minima;
  if (key === "temperatura_maxima") return day.maxima;
  if (key === "precipitacion") return day.precipitacion ?? null;
  if (key === "humedad_relativa") return day.humedad ?? null;
  return null;
}

export default function ClimateHistoricalPanel({
  result,
  onClose,
  className = "",
}: {
  result: ResultadoConsultaV2Publica;
  onClose: () => void;
  className?: string;
}) {
  const [selected, setSelected] = useState<ClimateMetric>("temperatura_media");
  const metric = metrics.find((item) => item.key === selected) ?? metrics[0];
  const comparison = comparisonFor(result, selected);
  const historical = result.historico_temperatura;
  const observed = historical?.serie_observada ?? [];
  const historicalSeries = historical?.serie_historica ?? [];
  const period = `${formatDate(result.clima.rango_temporal.desde)} – ${formatDate(result.clima.rango_temporal.hasta)}`;

  const referencePeriod =
    historical?.periodo_referencia ?? "Últimos 10 años completos";

  return (
    <section
      className={`mt-5 rounded-xl border border-[#b7dac5] bg-white p-4 sm:p-5 ${className}`}
      aria-labelledby="climate-analysis-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e2ece6] pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#087b4b]">
            <BarChart3 className="h-6 w-6" />
          </span>
          <div>
            <h2 id="climate-analysis-heading" className="text-xl font-bold">
              Análisis climático
            </h2>
            <p className="mt-1 text-sm text-[#526477]">
              Datos recientes frente a la referencia histórica {referencePeriod}
              .
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#087b4b]"
          aria-label="Cerrar análisis climático"
        >
          <ChevronUp className="h-4 w-4" />
          Cerrar análisis
        </button>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <Metadata icon={<MapPin />} label="Localidad">
          {result.localidad?.nombre ?? "Localidad no disponible"}
        </Metadata>
        <Metadata icon={<CalendarDays />} label="Período analizado">
          {period}
        </Metadata>
        <Metadata icon={<BarChart3 />} label="Referencia histórica">
          {referencePeriod}
        </Metadata>
        <Metadata icon={<CloudRain />} label="Fuente">
          {historical?.fuente ?? "No disponible"}
        </Metadata>
      </dl>

      <div
        className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
        role="tablist"
        aria-label="Variables del análisis climático"
      >
        {metrics.map((item) => {
          const Icon = item.Icon;
          const active = item.key === selected;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(item.key)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-bold transition sm:text-sm ${
                active
                  ? "border-[#087b4b] bg-green-50 text-[#087b4b]"
                  : "border-[#e0e8e3] bg-[#fbfcfb] text-[#405369] hover:border-[#8fc9a8]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.72fr_1.5fr_0.78fr]">
        <div>
          <MetricCards comparison={comparison} unit={metric.unit} />
          <p className="mt-3 rounded-lg bg-[#f3faf6] p-3 text-sm leading-5 text-[#405369]">
            {interpretation(metric.label, comparison)}
          </p>
        </div>
        <ClimateSeriesChart
          label={metric.label}
          unit={metric.unit}
          dates={observed.map((day) => day.fecha)}
          observed={observed.map((day) => valueForDay(day, selected))}
          historical={historicalSeries.map((day) =>
            historicalValueForDay(day, selected),
          )}
          bars={metric.bars}
          showHistoricalLine={selected !== "dias_lluvia"}
        />
        <aside className="rounded-xl border border-[#e0e8e3] bg-[#fbfcfb] p-4">
          <h3 className="font-bold">Sobre esta variable</h3>
          <p className="mt-2 text-sm leading-5 text-[#526477]">
            {metric.description}
          </p>
          <dl className="mt-4 space-y-2 border-t pt-3 text-xs text-[#405369]">
            <InfoRow label="Unidad" value={metric.unit} />
            <InfoRow label="Período reciente" value={period} />
            <InfoRow
              label="Período histórico"
              value={`${referencePeriod} (mismas fechas)`}
            />
            <InfoRow
              label="Años válidos"
              value={
                historical?.disponible
                  ? `${historical.anios_validos} de 10`
                  : "No disponible"
              }
            />
            <InfoRow
              label="Fuente"
              value={historical?.fuente ?? "No disponible"}
            />
          </dl>
          <p className="mt-4 text-xs leading-5 text-[#526477]">
            {historical?.metodo ??
              "La referencia histórica no está disponible para esta consulta."}
          </p>
        </aside>
      </div>
    </section>
  );
}

function Metadata({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[#087b4b]">{icon}</span>
      <div>
        <dt className="text-xs text-[#526477]">{label}</dt>
        <dd className="font-semibold text-[#263a4d]">{children}</dd>
      </div>
    </div>
  );
}

function MetricCards({
  comparison,
  unit,
}: {
  comparison?: HistoricalComparison;
  unit: string;
}) {
  const values = [
    ["Observado", comparison?.actual],
    ["Histórico", comparison?.historico],
    ["Diferencia", comparison?.diferencia],
  ] as const;
  return (
    <div className="grid grid-cols-3 gap-2">
      {values.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-[#f6f9f7] p-3">
          <p className="text-xs text-[#526477]">{label}</p>
          <strong
            className={`mt-1 block text-lg ${
              label === "Diferencia" && value !== null && value !== undefined
                ? value > 0
                  ? "text-[#087b4b]"
                  : value < 0
                    ? "text-[#1970cf]"
                    : "text-[#263a4d]"
                : "text-[#263a4d]"
            }`}
          >
            {value === null || value === undefined
              ? "—"
              : `${label === "Diferencia" && value > 0 ? "+" : ""}${formatNumber(value)} ${unit}`}
          </strong>
        </div>
      ))}
    </div>
  );
}

function interpretation(label: string, comparison?: HistoricalComparison) {
  if (!comparison?.disponible || comparison.diferencia === null) {
    return `No hay una referencia histórica comparable disponible para ${label.toLowerCase()}.`;
  }
  if (Math.abs(comparison.diferencia) < 0.25) {
    return `${label} similar a la referencia histórica del período analizado.`;
  }
  return `${label} ${comparison.diferencia > 0 ? "por encima" : "por debajo"} de la referencia histórica durante el período analizado.`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#e5ece7] pb-2 last:border-b-0">
      <dt>{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function ClimateSeriesChart({
  label,
  unit,
  dates,
  observed,
  historical,
  bars,
  showHistoricalLine,
}: {
  label: string;
  unit: string;
  dates: string[];
  observed: Array<number | null>;
  historical: Array<number | null>;
  bars?: boolean;
  showHistoricalLine: boolean;
}) {
  const points = useMemo(() => {
    const values = [
      ...observed,
      ...(showHistoricalLine ? historical : []),
    ].filter(
      (value): value is number => value !== null && Number.isFinite(value),
    );
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = Math.max(1, max - min);
    const x = (index: number) =>
      38 + (index / Math.max(1, dates.length - 1)) * 292;
    const y = (value: number) => 124 - ((value - min) / range) * 92;
    const polyline = (valuesForLine: Array<number | null>) =>
      valuesForLine
        .map((value, index) =>
          value === null ? null : `${x(index)},${y(value)}`,
        )
        .filter(Boolean)
        .join(" ");
    return {
      min,
      max,
      x,
      y,
      observed: polyline(observed),
      historical: polyline(historical),
    };
  }, [dates.length, historical, observed, showHistoricalLine]);
  const maxBar = Math.max(...observed.map((value) => value ?? 0), 1);

  return (
    <section className="rounded-xl border border-[#e0e8e3] p-4" role="tabpanel">
      <h3 className="font-bold">{label} — evolución diaria</h3>
      <svg
        viewBox="0 0 360 168"
        className="mt-3 w-full"
        role="img"
        aria-label={`${label}, período ${dates.length} días`}
      >
        {[32, 63, 94, 124].map((y) => (
          <line key={y} x1="38" y1={y} x2="330" y2={y} stroke="#e2e9e5" />
        ))}
        <text
          x="4"
          y="92"
          fontSize="10"
          fill="#526477"
          transform="rotate(-90 10 92)"
        >
          {unit}
        </text>
        {bars
          ? observed.map((value, index) => {
              const height = ((value ?? 0) / maxBar) * 88;
              return (
                <rect
                  key={dates[index]}
                  x={points.x(index) - 6}
                  y={124 - height}
                  width="12"
                  height={height}
                  rx="2"
                  fill="#087b4b"
                />
              );
            })
          : null}
        {!bars ? (
          <polyline
            points={points.observed}
            fill="none"
            stroke="#087b4b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : null}
        {showHistoricalLine && points.historical ? (
          <polyline
            points={points.historical}
            fill="none"
            stroke="#1970cf"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        ) : null}
        {!bars
          ? observed.map((value, index) =>
              value === null ? null : (
                <circle
                  key={dates[index]}
                  cx={points.x(index)}
                  cy={points.y(value)}
                  r="3"
                  fill="#087b4b"
                />
              ),
            )
          : null}
        <text x="38" y="150" fontSize="10" fill="#526477">
          {formatDate(dates[0] ?? "")}
        </text>
        <text x="286" y="150" fontSize="10" fill="#526477">
          {formatDate(dates.at(-1) ?? "")}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#526477]">
        <span className="inline-flex items-center gap-1">
          <i className="h-2 w-4 rounded bg-[#087b4b]" /> Observado
        </span>
        {showHistoricalLine ? (
          <span className="inline-flex items-center gap-1">
            <i className="w-4 border-t-2 border-dashed border-[#1970cf]" />
            Referencia histórica (promedio)
          </span>
        ) : (
          <span>La referencia histórica se informa como valor agregado.</span>
        )}
      </div>
    </section>
  );
}
