import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { ErrorPanel, Locked, Shell } from "@/components/Shell";
import { loadState } from "@/lib/load";
import { checkAll, sortByNiceToHavesMet } from "@/lib/matching";

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
  const card = (r: (typeof results)[number]) => (
    <ListingCard key={r.listing.id} r={r} token={token} me={state.my_constraints!} checks={state.checks} shortlisted={shortlisted.has(r.listing.id)} />
  );

  return (
    <Shell token={token} state={state} active="results">
      <main className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Results</h1>
          <Link href={`/g/${token}/listings/new`} className="btn">
            + Add listing
          </Link>
        </div>
        <p className="text-sm text-stone-600">
          {results.length} listing{results.length === 1 ? "" : "s"} checked against all three of you:{" "}
          <strong>{qualifies.length}</strong> qualify, <strong>{verify.length}</strong> need verification,{" "}
          <strong>{ruledOut.length}</strong> ruled out. These are rule checks, not recommendations. The decision is yours.
        </p>

        {results.length === 0 && (
          <div className="card text-sm">
            No listings yet. Find one on any site, then{" "}
            <Link className="text-teal-700 underline" href={`/g/${token}/listings/new`}>
              paste it in
            </Link>
            .
          </div>
        )}

        {qualifies.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-teal-900">✅ Qualifies ({qualifies.length})</h2>
            <p className="hint">Sorted by: total nice-to-haves met across all three. This is a count, not a &ldquo;best flat&rdquo; score.</p>
            {qualifies.map(card)}
          </section>
        )}

        {verify.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-amber-900">❓ Needs verification ({verify.length})</h2>
            <p className="hint">Something a dealbreaker depends on is unknown or unconfirmed. These are not passing yet.</p>
            {verify.map(card)}
          </section>
        )}

        {ruledOut.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold text-red-900">✕ Ruled out ({ruledOut.length})</h2>
            {ruledOut.map(card)}
          </section>
        )}
      </main>
    </Shell>
  );
}
