"use client";

import { useState } from "react";
import { formatDate, formatNumber } from "@/lib/results/presentation";

interface Props {
  dates: string[];
  values: Array<number | null>;
  label: string;
  unit: string;
  bars?: Array<number | null>;
  barLabel?: string;
}

export default function InteractiveLineChart({ dates, values, label, unit, bars, barLabel }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));
  const min = Math.min(...valid, 0);
  const max = Math.max(...valid, 1);
  const span = Math.max(1, max - min);
  const x = (index: number) => 20 + (index / Math.max(1, values.length - 1)) * 300;
  const y = (value: number) => 115 - ((value - min) / span) * 85;
  const points = values.map((value, index) => value === null ? null : `${x(index)},${y(value)}`).filter(Boolean).join(" ");
  const activeValue = active === null ? null : values[active];

  return <div className="relative mt-4">
    <svg viewBox="0 0 340 145" className="w-full touch-manipulation" role="img" aria-label={`${label}. Pasá el cursor sobre la línea para consultar los valores.`} onMouseLeave={() => setActive(null)}>
      <line x1="20" y1="115" x2="320" y2="115" stroke="#dfe7e2"/>
      {bars?.map((value, index) => {
        const amount = value ?? 0;
        const barMax = Math.max(...bars.map((item) => item ?? 0), 1);
        const height = (amount / barMax) * 55;
        return <rect key={index} x={x(index) - Math.max(2, 115 / Math.max(bars.length, 1))} y={115 - height} width={Math.max(4, 230 / Math.max(bars.length, 1))} height={height} fill="#438bd5" opacity=".45"/>;
      })}
      <polyline points={points} fill="none" stroke="#1970cf" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {values.map((value, index) => value === null ? null : <g key={index} tabIndex={0} role="button" aria-label={`${formatDate(dates[index], true)}: ${formatNumber(value)} ${unit}`} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onClick={() => setActive(index)} className="cursor-default outline-none">
        <circle cx={x(index)} cy={y(value)} r="11" fill="transparent"/>
        <circle cx={x(index)} cy={y(value)} r={active === index ? 4.5 : 2.5} fill={active === index ? "#087b4b" : "#1970cf"} stroke="white" strokeWidth="2"/>
      </g>)}
      <text x="20" y="138" fontSize="9">{formatDate(dates[0] ?? "")}</text>
      <text x="278" y="138" fontSize="9">{formatDate(dates.at(-1) ?? "")}</text>
    </svg>
    {active !== null && activeValue !== null && <div className="pointer-events-none absolute z-20 min-w-36 -translate-x-1/2 -translate-y-full rounded-lg bg-[#081a31] px-3 py-2 text-xs text-white shadow-lg" style={{ left: `${(x(active) / 340) * 100}%`, top: `${(y(activeValue) / 145) * 100}%` }}>
      <strong className="block">{formatDate(dates[active], true)}</strong>
      <span className="mt-1 block">{label}: {formatNumber(activeValue)} {unit}</span>
      {bars && <span className="mt-0.5 block text-white/75">{barLabel ?? "Valor diario"}: {formatNumber(bars[active])} {unit}</span>}
    </div>}
  </div>;
}
