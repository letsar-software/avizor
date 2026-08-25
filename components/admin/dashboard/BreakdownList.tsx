export default function BreakdownList({ title, items }: { title: string; items: { label: string; total: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.total));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-avizor-navy">{title}</p>
      {items.length === 0 && <p className="text-sm text-gray-400">Sin datos todavía.</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 text-gray-600">{item.label}</span>
            <div className="h-2 flex-1 rounded bg-gray-100">
              <div className="h-2 rounded bg-avizor-green" style={{ width: `${(item.total / max) * 100}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-gray-500">{item.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
