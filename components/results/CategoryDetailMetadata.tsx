import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { ResultadoConsultaV2Publica, SerieClimaticaDiaria } from "@/types";
import { formatDate, formatDateTime } from "@/lib/results/presentation";

export function CategoryDetailMetadata({
  result,
  days,
  ruleSeries,
}: {
  result: ResultadoConsultaV2Publica;
  days: number;
  ruleSeries: SerieClimaticaDiaria[];
}) {
  return (
    <div className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
      <Fact
        Icon={CalendarDays}
        label="Período analizado"
        value={`${days} días (${formatDate(ruleSeries[0]?.fecha ?? "", true)} – ${formatDate(result.clima.rango_temporal.hasta, true)})`}
      />
      <Fact
        Icon={MapPin}
        label="Estación de referencia"
        value={`${result.localidad?.nombre ?? "—"} (${result.proveedor_climatico})`}
      />
      <Fact
        Icon={CheckCircle2}
        label="Cobertura"
        value={`${Math.round(result.clima.cobertura * 100)} %`}
      />
      <Fact
        Icon={Timer}
        label="Actualización"
        value={formatDateTime(result.generado_en)}
      />
    </div>
  );
}

function Fact({
  Icon,
  label,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="h-5 w-5 text-[#087b4b]" />
      <p className="text-xs text-[#526477]">
        {label}
        <strong className="mt-1 block text-sm text-[#081a31]">{value}</strong>
      </p>
    </div>
  );
}
