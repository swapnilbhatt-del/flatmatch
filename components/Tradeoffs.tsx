import type { PersonTradeoff } from "@/lib/matching";
import { Avatar, Line, personStyle } from "./ui";

/** One column per person. Factual lists only: no scores, no winner. */
export function Tradeoffs({
  tradeoffs,
  indexOf,
  stacked = false,
}: {
  tradeoffs: PersonTradeoff[];
  indexOf: Record<string, number>;
  stacked?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${stacked ? "" : "sm:grid-cols-3"}`}>
      {tradeoffs.map((t) => {
        const i = indexOf[t.memberId] ?? 0;
        const s = personStyle(i);
        return (
          <div key={t.memberId} className={`overflow-hidden rounded-2xl border ${s.border} bg-white`}>
            <div className={`flex items-center gap-2 px-3 py-2 ${s.soft}`}>
              <Avatar name={t.name} index={i} size="sm" />
              <h4 className={`text-sm font-semibold ${s.text}`}>{t.name}</h4>
              {t.compromises.length > 0 && (
                <span className="ml-auto text-[11px] font-medium text-amber-800">
                  {t.compromises.length} to give up
                </span>
              )}
            </div>
            <ul className="space-y-1.5 p-3 text-[13px] leading-snug">
              {t.gets.map((g) => (
                <Line key={g} kind="get">{g}</Line>
              ))}
              {t.compromises.map((c) => (
                <Line key={c} kind="give">{c}</Line>
              ))}
              {t.unknowns.map((u) => (
                <Line key={u} kind="unknown">{u}: unknown</Line>
              ))}
              {t.checkYourself.map((c) => (
                <Line key={c} kind="look">Check yourself: {c}</Line>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
