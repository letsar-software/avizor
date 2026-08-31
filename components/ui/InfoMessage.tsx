import type { LucideIcon } from "lucide-react";
import { Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "info" | "warning" | "error";

const VARIANTS: Record<Variant, { border: string; bg: string; text: string; icon: string; Icon: LucideIcon }> = {
  info: { border: "border-[#9b7848]", bg: "bg-[#f3ece3]", text: "text-[#405369]", icon: "text-[#9b7848]", Icon: Info },
  warning: { border: "border-amber-300", bg: "bg-amber-50", text: "text-[#6b5524]", icon: "text-amber-700", Icon: TriangleAlert },
  error: { border: "border-red-300", bg: "bg-red-50", text: "text-red-800", icon: "text-red-600", Icon: TriangleAlert },
};

export function InfoMessage({ variant = "info", icon, children, className = "" }: { variant?: Variant; icon?: LucideIcon; children: ReactNode; className?: string }) {
  const tone = VARIANTS[variant];
  const Icon = icon ?? tone.Icon;
  return (
    <div role={variant === "error" ? "alert" : undefined} className={`flex gap-3 rounded-xl border ${tone.border} ${tone.bg} p-4 sm:p-5 ${className}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`} aria-hidden="true" />
      <p className={`text-base leading-6 ${tone.text}`}>{children}</p>
    </div>
  );
}
