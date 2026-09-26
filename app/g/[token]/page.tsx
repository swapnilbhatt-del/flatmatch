import Link from "next/link";
import { ConstraintForm } from "@/components/ConstraintForm";
import { ConstraintSummary } from "@/components/ConstraintSummary";
import { ErrorPanel, Shell, SubmittedStatus } from "@/components/Shell";
import { loadState } from "@/lib/load";

export default async function MemberHome({ params }: PageProps<"/g/[token]">) {
  const { token } = await params;
  const { state, error } = await loadState(token);
  if (!state) return <ErrorPanel message={error} />;
  const mine = state.my_constraints;

  return (
    <Shell token={token} state={state} active="home">
      <main className="space-y-4">
        <div className="card space-y-2">
          <SubmittedStatus count={state.submitted_count} />
          {!state.unlocked && (
            <p className="text-sm text-stone-600">
              Everyone&apos;s answers, the listings and the results unlock when all three of you have submitted.
            </p>
          )}
        </div>

        {!mine ? (
          <>
            <h1 className="text-xl font-semibold">Your private constraint form</h1>
            <ConstraintForm token={token} initial={null} />
          </>
        ) : (
          <>
            <section className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Your answers ✓</h2>
                <Link href={`/g/${token}/form`} className="text-sm text-teal-700 underline">
                  Edit
                </Link>
              </div>
              <ConstraintSummary c={mine} />
            </section>

            {state.unlocked ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/g/${token}/results`} className="btn-primary">
                    See results
                  </Link>
                  <Link href={`/g/${token}/listings/new`} className="btn">
                    + Add a listing
                  </Link>
                </div>
                <h2 className="pt-2 font-semibold">Everyone&apos;s answers</h2>
                {state.constraints
                  .filter((c) => c.member_id !== state.me.member_id)
                  .map((c) => (
                    <section key={c.member_id} className="card">
                      <h3 className="mb-3 font-semibold">{c.name}</h3>
                      <ConstraintSummary c={c} />
                    </section>
                  ))}
              </>
            ) : (
              <p className="text-center text-sm text-stone-500">
                Waiting for the others. Nudge them on WhatsApp, and come back to this same link later.
              </p>
            )}
          </>
        )}
      </main>
    </Shell>
  );
}
