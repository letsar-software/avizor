import { BarChart2, Leaf, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BULLETS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: BarChart2,     title: "Datos confiables",       desc: "Clima histórico y en tiempo real" },
  { Icon: Leaf,          title: "Reglas agronómicas",      desc: "Validadas por expertos"           },
  { Icon: MessageSquare, title: "Recomendaciones claras",  desc: "Para que decidas mejor"           },
];

export default function BulletFeatures() {
  return (
    <div className="mt-8 space-y-4">
      {BULLETS.map((b) => (
        <div key={b.title} className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-avizor-green-light flex items-center justify-center text-avizor-green flex-shrink-0">
            <b.Icon size={16} />
          </div>
          <div>
            <p className="font-semibold text-avizor-navy text-sm">{b.title}</p>
            <p className="text-xs text-gray-500">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
