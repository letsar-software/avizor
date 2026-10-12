import Link from "next/link";
import { Bug } from "lucide-react";
import type { ResultadoConsultaV2Publica } from "@/types";
import {
  categoryDefinitions,
  representativeRuleForDefinition,
  statusLabel,
} from "@/lib/results/presentation";
import {
  SEVERITY_TONES,
  categoryIcons,
  severityOf,
} from "@/components/results/shared";

export function CategoryNavigation({
  result,
  activeSlug,
  basePath,
}: {
  result: ResultadoConsultaV2Publica;
  activeSlug: string;
  basePath: string;
}) {
  return (
    <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {categoryDefinitions.map((item) => {
        const ItemIcon = categoryIcons[item.slug];
        const itemRule = representativeRuleForDefinition(result, item.risk);
        const itemTone = SEVERITY_TONES[severityOf(itemRule)];
        const active = item.slug === activeSlug;
        return (
          <Link
            key={item.slug}
            href={`${basePath}/${item.slug}`}
            className={`flex min-w-[96px] flex-col items-center gap-2 rounded-xl border p-2 text-center lg:min-w-0 lg:flex-row lg:p-3 lg:text-left ${active ? `border-current ${itemTone.chipBg} ${itemTone.text}` : "border-transparent bg-white"}`}
          >
            <ItemIcon className="h-5 w-5" />
            <span className="text-xs font-bold">
              {item.name}
              <span className="mt-1 block text-xs font-normal">
                {statusLabel(itemRule, item.name)}
              </span>
            </span>
          </Link>
        );
      })}
      <Link
        href={basePath + "/plagas"}
        className={`flex min-h-[76px] items-center gap-2 rounded-xl border p-3 text-left ${activeSlug === "plagas" ? "border-[#087b4b] bg-[#edf7f0] text-[#087b4b]" : "border-transparent bg-white"}`}
      >
        <Bug className="h-5 w-5" />
        <span className="text-xs font-bold">
          Plagas
          <span className="mt-1 block text-xs font-normal">
            Información para el monitoreo
          </span>
        </span>
      </Link>
    </nav>
  );
}
