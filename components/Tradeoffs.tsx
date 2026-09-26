import type { PersonTradeoff } from "@/lib/matching";

/** One column per person. Factual lists only: no scores, no winner. */
export function Tradeoffs({ tradeoffs, stacked = false }: { tradeoffs: PersonTradeoff[]; stacked?: boolean }) {
  return (
    <div className={`grid gap-3 ${stacked ? "" : "sm:grid-cols-3"}`}>
      {tradeoffs.map((t) => (
        <div key={t.memberId} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm">
          <h4 className="mb-2 font-semibold">{t.name}</h4>
          <ul className="space-y-1">
            {t.gets.map((g) => (
              <li key={g}>✅ {g}</li>
            ))}
            {t.compromises.map((c) => (
              <li key={c} className="text-amber-900">⚠️ {c}</li>
            ))}
            {t.unknowns.map((u) => (
              <li key={u} className="text-stone-500">❓ {u}: unknown</li>
            ))}
            {t.checkYourself.map((c) => (
              <li key={c} className="text-stone-500">👀 Check yourself: {c}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
