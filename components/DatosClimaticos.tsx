const DATOS = [
  { label: "Humedad relativa",            valor: "82%"    },
  { label: "Lluvias últimos 5 días",      valor: "42 mm"  },
  { label: "Temperatura media",           valor: "22 °C"  },
  { label: "Días consecutivos c/lluvia",  valor: "3 días" },
];

export default function DatosClimaticos() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-avizor-navy mb-4">
        ¿Qué está viendo Avizor?
      </h3>
      <div>
        {DATOS.map((d, i) => (
          <div
            key={d.label}
            className={`flex justify-between items-center py-2 ${
              i < DATOS.length - 1 ? "border-b border-gray-50" : ""
            }`}
          >
            <span className="text-sm text-gray-600">{d.label}</span>
            <span className="font-mono font-semibold text-avizor-navy-dark tabular-nums text-sm">
              {d.valor}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
