import Link from "next/link";
import { Facts } from "@/components/ListingCard";
import { ShortlistToggle, VerifyField } from "@/components/ListingActions";
import { ErrorPanel, Locked, Shell } from "@/components/Shell";
import { Tradeoffs } from "@/components/Tradeoffs";
import { Avatar, Icon, Line, PageTitle, StatusBadge } from "@/components/ui";
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
  const indexOf = Object.fromEntries(state.constraints.map((c, i) => [c.member_id, i]));
  const ids = new Set(state.shortlist.map((s) => s.listing_id));
  const items = state.listings.filter((l) => ids.has(l.id)).map((l) => checkListing(l, state.constraints, state.checks));
  const verifiedBy = (listingId: string, field: string) => {
    const c = state.checks.find((k) => k.kind === "field" && k.listing_id === listingId && k.key === field && k.confirmed);
    return c ? (names.get(c.member_id ?? "") ?? "someone") : null;
  };
  const cols = { gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(18rem, 1fr))` };

  return (
    <Shell token={token} state={state} active="shortlist">
      <main className="space-y-5">
        <PageTitle eyebrow="For the group conversation" title="Shortlist">
          Your picks side by side. The app doesn&apos;t choose between them or weigh one person&apos;s needs against another&apos;s.
        </PageTitle>

        {items.length > 3 && (
          <div className="checkpoint flex gap-2">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            You have {items.length} on the shortlist. Aim for 2–3 to keep the conversation focused.
          </div>
        )}

        {items.length === 0 ? (
          <div className="card flex flex-col items-center py-10 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon name="star" className="h-7 w-7" />
            </span>
            <p className="font-semibold">Nothing shortlisted yet</p>
            <p className="mt-1 max-w-xs text-sm text-stone-600">On Results, tap &ldquo;Add to shortlist&rdquo; on any flat that qualifies for all three of you.</p>
            <Link href={`/g/${token}/results`} className="btn-primary mt-4">
              Go to results <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {items.length > 1 && <p className="hint -mt-2 sm:hidden">Swipe sideways to compare →</p>}
            <div className="-mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]">
              <div className="grid snap-x snap-mandatory gap-3" style={cols}>
                {items.map((r) => {
                  const l = r.listing;
                  const unknown = FIELD_KEYS.filter((k) => l.fields[k] === UNKNOWN);
                  return (
                    <article key={l.id} className="card snap-start space-y-4">
                      <div className="space-y-2.5">
                        <StatusBadge status={r.status} />
                        <h2 className="font-display text-xl font-semibold leading-snug">{l.title}</h2>
                        <Facts r={r} />
                      </div>

                      {r.status !== "qualifies" && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                          <p className="mb-1 font-semibold">This no longer qualifies</p>
                          <ul className="space-y-1">
                            {r.breaks.map((b, i) => (
                              <Line key={i} kind="broke">{describeBreak(b)}</Line>
                            ))}
                            {r.toVerify.map((v, i) => (
                              <Line key={`v${i}`} kind="unknown">{v.name}: {v.text}</Line>
                            ))}
                          </ul>
                        </div>
                      )}

                      {r.tradeoffs && <Tradeoffs tradeoffs={r.tradeoffs} indexOf={indexOf} stacked />}

                      <div className="checkpoint">
                        <p className="mb-2 flex items-center gap-2 font-semibold">
                          <Icon name={unknown.length ? "chat" : "check"} className="h-4 w-4 text-amber-700" />
                          {unknown.length ? `Verify before you decide (${unknown.length})` : "Every field is known"}
                        </p>
                        {unknown.length > 0 && (
                          <div className="divide-y divide-amber-200/60">
                            {unknown.map((k) => (
                              <VerifyField key={k} token={token} listingId={l.id} field={k} />
                            ))}
                          </div>
                        )}
                      </div>

                      <details className="group rounded-2xl bg-stone-50/80 p-3 text-sm">
                        <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-stone-700">
                          All details
                          <Icon name="arrow" className="h-4 w-4 rotate-90 transition group-open:-rotate-90" />
                        </summary>
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                          {FIELD_KEYS.map((k) => {
                            const by = verifiedBy(l.id, k);
                            const isUnknown = l.fields[k] === UNKNOWN;
                            return (
                              <div key={k} className="contents">
                                <dt className="text-stone-500">{FIELD_LABELS[k]}</dt>
                                <dd className={isUnknown ? "text-amber-800" : "text-stone-900"}>
                                  {isUnknown ? "Unknown" : show(k, l.fields[k])}
                                  {by && (
                                    <span className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700">
                                      <Icon name="check" className="h-3 w-3" strokeWidth={3} /> verified by {by}
                                    </span>
                                  )}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      </details>

                      {l.url && (
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn-ghost -ml-3 text-xs">
                          Original listing <Icon name="external" className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <ShortlistToggle token={token} listingId={l.id} on />
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <section className="card bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-start gap-3">
            <div className="flex -space-x-2">
              {state.constraints.map((c, i) => (
                <Avatar key={c.member_id} name={c.name} index={i} />
              ))}
            </div>
            <div>
              <p className="font-display text-lg font-semibold">The final decision is yours</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                Talk it through together. FlatMatch only shows the facts and each person&apos;s tradeoffs. Which flat to go
                for is up to the three of you.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
