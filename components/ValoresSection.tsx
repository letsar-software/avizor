const VALORES = [
  { icon: "🎯", title: "Claridad",     desc: "Información simple y accionable"              },
  { icon: "🛡️", title: "Confianza",   desc: "Datos confiables y metodología transparente"  },
  { icon: "🌾", title: "Cercanía",     desc: "Hecho para productores y asesores"            },
  { icon: "📡", title: "Anticipación", desc: "La señal antes del problema"                  },
];

export default function ValoresSection() {
  return (
    <section className="bg-avizor-navy-dark py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {VALORES.map((v) => (
            <div key={v.title} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-xl">
                {v.icon}
              </div>
              <h3 className="font-semibold text-white mt-4 text-sm">{v.title}</h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
