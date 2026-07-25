import Link from "next/link";
import { Mail, MapPin, MessageCircle, Sprout } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const navigation = [["Inicio", "/"], ["Metodología", "/metodologia"], ["Sobre Avizor", "/sobre-avizor"], ["Contacto", "/contacto"]];
const information = [["Bibliografía", "/bibliografia"], ["Privacidad", "/privacidad"], ["Alcance y limitaciones", "/alcance-limitaciones"], ["Estado del sistema", "/estado-sistema"]];

export default function Footer() {
  return <footer className="bg-[#064d35] text-white"><div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-14"><div className="grid gap-8 md:grid-cols-[1.1fr_.7fr_.8fr_1fr]"><div className="self-start"><BrandLogo inverse compact/></div><FooterLinks title="Navegación" links={navigation}/><FooterLinks title="Información" links={information}/><div><h2 className="text-xs font-bold text-[#8bd4a8]">Contacto</h2><div className="mt-4 space-y-3 text-xs text-white/80"><p className="flex gap-2"><Mail className="h-4 w-4"/>hola@avizor.com.ar</p><p className="flex gap-2"><MapPin className="h-4 w-4"/>Tandil, Buenos Aires</p><p className="flex gap-2"><MessageCircle className="h-4 w-4"/>Respondemos en 24 a 48 horas hábiles</p></div></div></div><div className="mt-7 flex flex-col gap-3 border-t border-white/15 pt-5 text-[11px] text-white/65 sm:flex-row sm:justify-between"><p>© 2026 Avizor. Todos los derechos reservados.</p><p className="flex gap-2"><Sprout className="h-4 w-4"/>Avizor no diagnostica ni reemplaza el asesoramiento profesional.</p></div></div></footer>;
}
function FooterLinks({title,links}:{title:string;links:string[][]}){return <nav><h2 className="text-xs font-bold text-[#8bd4a8]">{title}</h2><div className="mt-4 space-y-2">{links.map(([label,href])=><Link key={href} href={href} className="block text-xs text-white/80 hover:text-white">{label}</Link>)}</div></nav>}
