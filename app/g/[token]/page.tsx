import Link from "next/link";
import { ConstraintForm } from "@/components/ConstraintForm";
import { ConstraintSummary } from "@/components/ConstraintSummary";
import { ErrorPanel, Shell, SubmittedStatus } from "@/components/Shell";
import { Avatar, Icon, PageTitle, personStyle } from "@/components/ui";
import { loadState } from "@/lib/load";
import { checkAll } from "@/lib/matching";

export default async function MemberHome({ params }: PageProps<"/g/[token]">) {
  const { token } = await params;
  const { state, error } = await loadState(token);
  if (!state) return <ErrorPanel message={error} />;
  const mine = state.my_constraints;
  const myIndex = state.me.slot - 1;
  const results = state.unlocked ? checkAll(state.listings, state.constraints, state.checks) : [];
  const count = (s: string) => results.filter((r) => r.status === s).length;

  return (
    <Shell token={token} state={state} active="home">
      <main className="space-y-5">
        <PageTitle eyebrow={state.group.name} title={mine ? `Hi ${mine.name}` : "Your private form"}>
          {mine
            ? state.unlocked
              ? "Everyone's in. Here's where things stand."
              : "Your answers are saved. Waiting for the others."
            : "Answer for yourself. The others won't see anything until all three of you have submitted."}
        </PageTitle>

        <div className="card rise">
          <SubmittedStatus count={state.submitted_count} />
        </div>

        {!mine ? (
          <ConstraintForm token={token} initial={null} />
        ) : (
          <>
            {state.unlocked && (
              <Link href={`/g/${token}/results`} className="card group block bg-gradient-to-br from-brand-700 to-brand-900 text-white rise">
                <p className="eyebrow text-brand-100/80">Results</p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  {results.length} listing{results.length === 1 ? "" : "s"} checked
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { n: count("qualifies"), l: "qualify" },
                    { n: count("needs_verification"), l: "to verify" },
                    { n: count("ruled_out"), l: "ruled out" },
                  ].map((x) => (
                    <div key={x.l} className="rounded-2xl bg-white/10 px-2 py-3">
                      <p className="text-2xl font-semibold">{x.n}</p>
                      <p className="text-xs text-brand-100/80">{x.l}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                  See results <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            )}

            <section className="card rise">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={mine.name} index={myIndex} />
                  <div>
                    <h2 className="font-semibold">Your answers</h2>
                    <p className="text-xs text-stone-500">{state.unlocked ? "Visible to all three now" : "Only you can see these"}</p>
                  </div>
                </div>
                <Link href={`/g/${token}/form`} className="btn-ghost">
                  Edit
                </Link>
              </div>
              <ConstraintSummary c={mine} />
            </section>

            {state.unlocked ? (
              <>
                <p className="eyebrow pt-2">Everyone else</p>
                {state.constraints.map((c, i) =>
                  c.member_id === state.me.member_id ? null : (
                    <section key={c.member_id} className={`card border-l-4 ${personStyle(i).border}`}>
                      <div className="mb-4 flex items-center gap-3">
                        <Avatar name={c.name} index={i} />
                        <h3 className="font-semibold">{c.name}</h3>
                      </div>
                      <ConstraintSummary c={c} />
                    </section>
                  ),
                )}
              </>
            ) : (
              <div className="card-flat flex items-start gap-3 text-sm text-stone-600">
                <Icon name="chat" className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" />
                <p>Nudge the others on WhatsApp, then come back to this same link. Everything unlocks the moment the third form is in.</p>
              </div>
            )}
          </>
        )}
      </main>
    </Shell>
  );
}
