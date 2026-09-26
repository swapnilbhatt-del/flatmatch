import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { ErrorPanel, Locked, Shell } from "@/components/Shell";
import { Icon, PageTitle, type IconName } from "@/components/ui";
import { loadState } from "@/lib/load";
import { checkAll, sortByNiceToHavesMet, type ListingResult } from "@/lib/matching";

function SectionHead({ icon, tone, title, count, hint }: { icon: IconName; tone: string; title: string; count: number; hint?: string }) {
  return (
    <div className="pt-2">
      <h2 className="flex items-center gap-2 font-semibold text-stone-900">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${tone}`}>
          <Icon name={icon} className="h-4 w-4" strokeWidth={2.4} />
        </span>
        {title}
        <span className="text-stone-400">{count}</span>
      </h2>
      {hint && <p className="hint ml-9 mt-0.5">{hint}</p>}
    </div>
  );
}

export default async function Results({ params }: PageProps<"/g/[token]/results">) {
  const { token } = await params;
  const { state, error } = await loadState(token);
  if (!state) return <ErrorPanel message={error} />;
  if (!state.unlocked || !state.my_constraints)
    return (
      <Shell token={token} state={state} active="results">
        <Locked token={token} />
      </Shell>
    );

  const results = checkAll(state.listings, state.constraints, state.checks);
  const qualifies = sortByNiceToHavesMet(results.filter((r) => r.status === "qualifies"));
  const verify = results.filter((r) => r.status === "needs_verification");
  const ruledOut = results.filter((r) => r.status === "ruled_out");
  const shortlisted = new Set(state.shortlist.map((s) => s.listing_id));
  const indexOf = Object.fromEntries(state.constraints.map((c, i) => [c.member_id, i]));
  const card = (r: ListingResult) => (
    <ListingCard
      key={r.listing.id}
      r={r}
      token={token}
      me={state.my_constraints!}
      checks={state.checks}
      shortlisted={shortlisted.has(r.listing.id)}
      indexOf={indexOf}
    />
  );

  return (
    <Shell token={token} state={state} active="results">
      <main className="space-y-4">
        <PageTitle eyebrow="Checked against all three of you" title="Results">
          Rule checks, not recommendations. The decision is yours.
        </PageTitle>

        <div className="grid grid-cols-3 gap-2 rise">
          {[
            { n: qualifies.length, l: "Qualify", cls: "bg-emerald-50 text-emerald-900 ring-emerald-200" },
            { n: verify.length, l: "To verify", cls: "bg-amber-50 text-amber-900 ring-amber-200" },
            { n: ruledOut.length, l: "Ruled out", cls: "bg-rose-50 text-rose-900 ring-rose-200" },
          ].map((x) => (
            <div key={x.l} className={`rounded-2xl px-3 py-3 text-center ring-1 ${x.cls}`}>
              <p className="font-display text-3xl font-semibold">{x.n}</p>
              <p className="text-xs font-medium">{x.l}</p>
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="card flex flex-col items-center py-10 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon name="building" className="h-7 w-7" />
            </span>
            <p className="font-semibold">No listings yet</p>
            <p className="mt-1 max-w-xs text-sm text-stone-600">Found a flat on NoBroker, MagicBricks or WhatsApp? Paste it in and it&apos;s checked instantly.</p>
            <Link className="btn-primary mt-4" href={`/g/${token}/listings/new`}>
              <Icon name="plus" className="h-4 w-4" /> Add a listing
            </Link>
          </div>
        )}

        {qualifies.length > 0 && (
          <section className="space-y-3">
            <SectionHead
              icon="check"
              tone="bg-emerald-100 text-emerald-700"
              title="Qualifies"
              count={qualifies.length}
              hint="Sorted by: total nice-to-haves met across all three. A count, not a “best flat” score."
            />
            {qualifies.map(card)}
          </section>
        )}

        {verify.length > 0 && (
          <section className="space-y-3">
            <SectionHead
              icon="help"
              tone="bg-amber-100 text-amber-700"
              title="Needs verification"
              count={verify.length}
              hint="A dealbreaker depends on something unknown or unconfirmed. Not passing yet."
            />
            {verify.map(card)}
          </section>
        )}

        {ruledOut.length > 0 && (
          <section className="space-y-3">
            <SectionHead icon="x" tone="bg-rose-100 text-rose-700" title="Ruled out" count={ruledOut.length} />
            {ruledOut.map(card)}
          </section>
        )}

        {results.length > 0 && (
          <Link href={`/g/${token}/listings/new`} className="btn w-full border-dashed">
            <Icon name="plus" className="h-4 w-4" /> Add another listing
          </Link>
        )}
      </main>
    </Shell>
  );
}
