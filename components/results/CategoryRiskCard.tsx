import React from "react";
import Link from "next/link";
import { ArrowRight, Bug, Leaf, type LucideIcon } from "lucide-react";
import { additionalMatchesLabel, type CategoryCardModel } from "@/lib/results/category-presentation";
import { formatDate } from "@/lib/results/presentation";
import { CategoryIconChip, SEVERITY_TONES, categoryIcons } from "@/components/results/shared";

export const CATEGORY_ICONS: Record<string, LucideIcon> = { ...categoryIcons, plagas: Bug };

/** Tarjeta única para cualquier cultivo y categoría: sólo usa el modelo de display. */
export function CategoryRiskCard({ category, basePath }: { category: CategoryCardModel; basePath: string }) {
  const tone = SEVERITY_TONES[category.tone];
  return (
    <Link
      href={`${basePath}/${category.slug}`}
      className="flex min-h-[92px] items-start gap-2 rounded-xl border bg-white p-4 text-left"
      data-testid={`category-card-${category.key}`}
    >
      <CategoryIconChip Icon={CATEGORY_ICONS[category.key] ?? Leaf} severity={category.tone} />
      <span className="min-w-0 flex-1">
        <strong className="text-sm">{category.title}</strong>
        <span className={`mt-1 block text-xs font-semibold sm:text-sm ${tone.text}`}>{category.display_status}</span>
        {category.matches.names.length > 1 && !category.advisory ? (
          <span className="mt-1 block text-xs leading-5 text-[#405369]">
            <span className="block">Condiciones compatibles con:</span>
            <span role="list" className="mt-0.5 block space-y-0.5">
              {category.matches.names.map((name) => (
                <span role="listitem" key={name} className="flex gap-1.5"><span aria-hidden="true">•</span><span>{name}</span></span>
              ))}
            </span>
            {category.matches.additional > 0 ? <span className="mt-0.5 block">{additionalMatchesLabel(category.matches.additional)}</span> : null}
          </span>
        ) : (
          <span className="mt-1 block text-xs leading-5 text-[#405369]">{category.message}</span>
        )}
        {/* Con alerta técnica, la tarjeta muestra la validación; los datos pendientes quedan en el detalle. */}
        {category.advisory ? null : <RequiredDataList items={category.required_data} compact />}
        {category.advisory ? <AdvisoryNote reviewedAt={category.advisory.reviewed_at} compact /> : null}
      </span>
      <ArrowRight className="mt-1 hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
    </Link>
  );
}

export function RequiredDataList({ items, compact = false }: { items: CategoryCardModel["required_data"]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <span className={`block ${compact ? "mt-2 text-xs" : "mt-4 text-sm"} text-[#405369]`}>
      <span className="block font-semibold text-[#081a31]">Para completar la evaluación:</span>
      <span role="list" className="mt-1 block space-y-0.5">
        {items.map((item) => (
          <span role="listitem" key={item.variable} className="flex gap-1.5">
            <span aria-hidden="true">•</span>
            <span>{item.label}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

/** Marca de alerta técnica: el estado lo determina una validación vigente, no sólo el motor. */
export function AdvisoryNote({ reviewedAt, compact = false }: { reviewedAt?: string; compact?: boolean }) {
  return (
    <span className={`block ${compact ? "mt-2 text-xs" : "mt-3 text-sm"} text-[#526477]`}>
      <span className="block font-semibold text-[#081a31]">Validación técnica vigente</span>
      {reviewedAt ? <span className="block">Revisado el: {formatDate(reviewedAt.slice(0, 10), true)}</span> : null}
    </span>
  );
}
