import Link from "next/link";
import { facts } from "@/components/ListingCard";
import { ShortlistToggle, VerifyField } from "@/components/ListingActions";
import { ErrorPanel, Locked, Shell } from "@/components/Shell";
import { Tradeoffs } from "@/components/Tradeoffs";
import { loadState } from "@/lib/load";
import { checkListing, describeBreak, ordinal } from "@/lib/matching";
import { FIELD_KEYS, FIELD_LABELS, UNKNOWN, type ListingFields } from "@/lib/types";

function show(k: keyof ListingFields, v: ListingFields[keyof ListingFields]): string {
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  if (k === "rent" && typeof v === "number") return `₹${v.toLocaleString("en-IN")}`;
  if (k === "floor" && typeof v === "number") return ordinal(v);
  if (k === "furnished") return v === "full" ? "Fully" : v === "semi" ? "Semi" : "Unfurnished";
  return String(v);
}

export default async function Shortlist({ params }: PageProps<"/g/[token]/shortlist">) {
  const { token } = await params;
  const { state, error } = await loadState(token);
  if (!state) return <ErrorPanel message={error} />;
  if (!state.unlocked)
    return (
      <Shell token={token} state={state} active="shortlist">
        <Locked token={token} />
      </Shell>
    );

  const names = new Map(state.constraints.map((c) => [c.member_id, c.name]));
  const ids = new Set(state.shortlist.map((s) => s.listing_id));
  const items = state.listings
    .filter((l) => ids.has(l.id))
    .map((l) => checkListing(l, state.constraints, state.checks));
  const verifiedBy = (listingId: string, field: string) => {
    const c = state.checks.find((k) => k.kind === "field" && k.listing_id === listingId && k.key === field && k.confirmed);
    return c ? (names.get(c.member_id ?? "") ?? "someone") : null;
  };
  const cols = { gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(17rem, 1fr))` };

  return (
    <Shell token={token} state={state} active="shortlist">
      <main className="space-y-4">
        <h1 className="text-xl font-semibold">Shortlist</h1>
        <p className="text-sm text-stone-600">
          The flats you&apos;ve picked out for the group conversation, side by side. The app doesn&apos;t choose between
          them, and it doesn&apos;t weigh one person&apos;s needs against another&apos;s. That&apos;s for the three of you.
        </p>
        {items.length > 3 && (
          <p className="checkpoint">You have {items.length} on the shortlist. Aim for 2–3 to keep the conversation focused.</p>
        )}

        {items.length === 0 ? (
          <div className="card text-sm">
            Nothing shortlisted yet. On{" "}
            <Link href={`/g/${token}/results`} className="text-teal-700 underline">
              Results
            </Link>
            , tap &ldquo;Add to shortlist&rdquo; on any flat that qualifies.
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="grid snap-x gap-3" style={cols}>
              {items.map((r) => {
                const l = r.listing;
                const unknown = FIELD_KEYS.filter((k) => l.fields[k] === UNKNOWN);
                return (
                  <article key={l.id} className="card snap-start space-y-3">
                    <div>
                      <h2 className="font-semibold">{l.title}</h2>
                      <p className="text-sm text-stone-600">{facts(r)}</p>
                      {l.url && (
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 underline">
                          Original listing ↗
                        </a>
                      )}
                    </div>

                    {r.status !== "qualifies" && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                        <p className="font-semibold">This no longer qualifies.</p>
                        {r.breaks.map((b, i) => (
                          <p key={i}>✕ {describeBreak(b)}</p>
                        ))}
                        {r.toVerify.map((v, i) => (
                          <p key={`v${i}`}>❓ {v.name}: {v.text}</p>
                        ))}
                      </div>
                    )}

                    {r.tradeoffs && <Tradeoffs tradeoffs={r.tradeoffs} stacked />}

                    <div className="checkpoint">
                      <p className="mb-1 font-semibold">
                        {unknown.length ? `Verify before the final discussion (${unknown.length})` : "All fields known ✓"}
                      </p>
                      {unknown.map((k) => (
                        <VerifyField key={k} token={token} listingId={l.id} field={k} />
                      ))}
                    </div>

                    <details className="text-sm">
                      <summary className="cursor-pointer text-stone-600">All details</summary>
                      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                        {FIELD_KEYS.map((k) => {
                          const by = verifiedBy(l.id, k);
                          return (
                            <div key={k} className="contents">
                              <dt className="text-stone-500">{FIELD_LABELS[k]}</dt>
                              <dd>
                                {l.fields[k] === UNKNOWN ? "❓ Unknown" : show(k, l.fields[k])}
                                {by && <span className="hint block">✓ verified by {by}</span>}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </details>

                    <ShortlistToggle token={token} listingId={l.id} on />
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <p className="checkpoint">
          🗣️ <strong>Final decision:</strong> talk it through together. FlatMatch only shows the facts and each
          person&apos;s tradeoffs. Which flat to go for is up to the three of you.
        </p>
      </main>
    </Shell>
  );
}
