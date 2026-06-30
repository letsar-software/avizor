const FEATURES = [
  {
    icon: "📊",
    bg: "bg-avizor-green",
    title: "Datos confiables",
    desc: "Tomamos datos de estaciones y servicios meteorológicos confiables.",
  },
  {
    icon: "🔍",
    bg: "bg-avizor-navy",
    title: "Análisis agronómico",
    desc: "Aplicamos reglas validadas por agrónomos y basadas en evidencia.",
  },
  {
    icon: "⚡",
    bg: "bg-avizor-green-mid",
    title: "Señales claras",
    desc: "Te decimos si las condiciones merecen atención y por qué.",
  },
  {
    icon: "🌿",
    bg: "bg-avizor-navy-dark",
    title: "Acción simple",
    desc: "Recomendaciones concretas para que sepas qué hacer.",
  },
];

export default function QueMuestraSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-avizor-navy-dark">
            ¿Qué te muestra Avizor?
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Datos climáticos → Condiciones ambientales → Recomendación simple
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center">
              <div
                className={`${f.bg} w-12 h-12 rounded-full flex items-center justify-center text-xl`}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mt-4 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
