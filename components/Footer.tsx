import Link from "next/link";
import { Mail, MapPin, MessageCircle, Sprout } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const navigation = [["Inicio", "/"], ["Metodología", "/metodologia"], ["Sobre Avizor", "/sobre-avizor"], ["Contacto", "/contacto"]];
const resources = [["Bibliografía", "/bibliografia"], ["Privacidad", "/privacidad"], ["Alcance y limitaciones", "/alcance-limitaciones"], ["Estado del sistema", "/estado-sistema"]];

export default function Footer() {
  return <footer>
    <div className="bg-[#064d35] text-white">
      <div className="mx-auto hidden max-w-[1440px] px-8 py-9 md:grid md:grid-cols-[1.1fr_.7fr_.8fr_1fr] md:gap-8 lg:px-14">
        <div className="self-start pr-8"><Link href="/" aria-label="Avizor, inicio" className="inline-flex"><BrandLogo inverse compact /></Link><p className="mt-4 max-w-[220px] border-l border-[#79bd94]/60 pl-3 text-[11px] leading-5 text-white/65">Información agrícola clara para decidir dónde poner la atención.</p></div>
        <DesktopLinks title="Navegación" links={navigation} /><DesktopLinks title="Recursos" links={resources} /><Contact />
      </div>
      <div className="px-7 py-7 md:hidden">
        <Contact />
        <a href="https://www.linkedin.com/company/avizor-agtech" target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-3 text-sm font-semibold text-[#80d6a1]"><span className="flex h-6 w-6 items-center justify-center rounded-sm bg-white text-xs font-bold text-[#087b4b]">in</span>Seguinos en LinkedIn</a>
        <p className="mt-8 flex gap-3 text-xs leading-5 text-white/75"><Sprout className="h-5 w-5 shrink-0 text-[#7fd3a0]" />Avizor identifica condiciones ambientales que pueden favorecer determinados riesgos agrícolas. No diagnostica ni reemplaza el asesoramiento profesional.</p>
        <p className="mt-6 border-t border-white/15 pt-5 text-center text-[10px] text-white/65">© 2026 Avizor. Todos los derechos reservados.</p>
      </div>
    </div>
    <div className="hidden border-t border-white/15 bg-[#064d35] px-8 py-5 text-[11px] text-white/65 md:block"><div className="mx-auto flex max-w-[1340px] justify-between"><p>© 2026 Avizor. Todos los derechos reservados.</p><p className="flex gap-2"><Sprout className="h-4 w-4" />Avizor no diagnostica ni reemplaza el asesoramiento profesional.</p></div></div>
  </footer>;
}

function Contact() { return <div><h2 className="text-sm font-bold text-white md:text-xs md:text-[#8bd4a8]">Contacto</h2><div className="mt-4 space-y-3 text-sm text-white/90 md:text-xs md:text-white/80"><p className="flex gap-3"><Mail className="h-4 w-4 shrink-0" />hola@avizor.com.ar</p><p className="flex gap-3"><MapPin className="h-4 w-4 shrink-0" />Tandil, Buenos Aires</p><p className="flex gap-3"><MessageCircle className="h-4 w-4 shrink-0" />Respondemos en 24 a 48 horas hábiles</p></div></div>; }
function DesktopLinks({ title, links }: { title: string; links: string[][] }) { return <nav><h2 className="text-xs font-bold text-[#8bd4a8]">{title}</h2><div className="mt-4 space-y-2">{links.map(([label, href]) => <Link key={href} href={href} className="block text-xs text-white/80 hover:text-white">{label}</Link>)}</div></nav>; }
