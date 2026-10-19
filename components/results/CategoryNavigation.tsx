import Link from "next/link";
import { Bug, Leaf } from "lucide-react";
import type { ResultadoConsultaV2Publica } from "@/types";
import { categoriesForResult } from "@/lib/results/category-presentation";
import { SEVERITY_TONES } from "@/components/results/shared";
import { CATEGORY_ICONS } from "@/components/results/CategoryRiskCard";

/** Navegación con los mismos estados de producto que las tarjetas, para cualquier cultivo. */
export function CategoryNavigation({
  result,
  activeSlug,
  basePath,
}: {
  result: ResultadoConsultaV2Publica;
  activeSlug: string;
  basePath: string;
}) {
  const categories = categoriesForResult(result);
  const active = activeSlug.replaceAll("-", "_");
  return (
    <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((item) => {
        const ItemIcon = CATEGORY_ICONS[item.key] ?? Leaf;
        const itemTone = SEVERITY_TONES[item.tone];
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={`${basePath}/${item.slug}`}
            className={`flex min-w-[96px] flex-col items-center gap-2 rounded-xl border p-2 text-center lg:min-w-0 lg:flex-row lg:p-3 lg:text-left ${isActive ? `border-current ${itemTone.chipBg} ${itemTone.text}` : "border-transparent bg-white"}`}
          >
            <ItemIcon className="h-5 w-5" />
            <span className="text-xs font-bold">
              {item.title}
              <span className="mt-1 block text-xs font-normal">
                {item.display_status}
              </span>
            </span>
          </Link>
        );
      })}
      {categories.some((item) => item.key === "plagas") ? null : (
        <Link
          href={basePath + "/plagas"}
          className={`flex min-h-[76px] items-center gap-2 rounded-xl border p-3 text-left ${active === "plagas" ? "border-[#087b4b] bg-[#edf7f0] text-[#087b4b]" : "border-transparent bg-white"}`}
        >
          <Bug className="h-5 w-5" />
          <span className="text-xs font-bold">
            Plagas
            <span className="mt-1 block text-xs font-normal">
              Información para el monitoreo
            </span>
          </span>
        </Link>
      )}
    </nav>
  );
}
