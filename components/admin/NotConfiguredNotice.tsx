export default function NotConfiguredNotice({ titulo, motivo, requiere }: { titulo: string; motivo: string; requiere: string[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="mb-2 text-sm font-semibold text-amber-800">{titulo}</h2>
      <p className="mb-3 text-sm text-amber-700">{motivo}</p>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-600">Para construirlo hace falta definir:</p>
      <ul className="list-inside list-disc text-sm text-amber-700">
        {requiere.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
