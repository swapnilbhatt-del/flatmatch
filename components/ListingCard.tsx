import { brokerQuestions, commuteFor, ordinal, type ListingResult } from "@/lib/matching";
import { mapsDirectionsUrl } from "@/lib/maps";
import { UNKNOWN, type Constraints, type ListingCheck } from "@/lib/types";
import { ConfirmCommute, ShortlistToggle, VerifyField } from "./ListingActions";
import { Tradeoffs } from "./Tradeoffs";
import { Avatar, Icon, Line, StatusBadge, statusBar, type IconName } from "./ui";

/** Short fact list for a listing. Unknowns are shown with a "?" so they're never mistaken for facts. */
export function factList(r: ListingResult): { icon: IconName; text: string; unknown?: boolean }[] {
  const f = r.listing.fields;
  return [
    { icon: "pin" as const, text: f.area !== UNKNOWN ? f.area : "Area ?", unknown: f.area === UNKNOWN },
    {
      icon: "wallet" as const,
      text: f.rent !== UNKNOWN ? `₹${f.rent.toLocaleString("en-IN")}/mo` : "Rent ?",
      unknown: f.rent === UNKNOWN,
    },
    ...(f.bhk !== UNKNOWN ? [{ icon: "home" as const, text: `${f.bhk} BHK` }] : []),
    {
      icon: "building" as const,
      text: f.floor !== UNKNOWN ? `${ordinal(f.floor)} floor` : "Floor ?",
      unknown: f.floor === UNKNOWN,
    },
    {
      icon: f.lift === "no" ? ("x" as const) : ("check" as const),
      text: f.lift === "yes" ? "Lift" : f.lift === "no" ? "No lift" : "Lift ?",
      unknown: f.lift === UNKNOWN,
    },
  ];
}

export function Facts({ r }: { r: ListingResult }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {factList(r).map((x) => (
        <span key={x.text} className={`pill ${x.unknown ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200" : ""}`}>
          <Icon name={x.unknown ? "help" : x.icon} className="h-3.5 w-3.5 opacity-70" />
          {x.text}
        </span>
      ))}
    </div>
  );
}

export function ListingCard({
  r,
  token,
  me,
  checks,
  shortlisted,
  indexOf,
}: {
  r: ListingResult;
  token: string;
  me: Constraints;
  checks: ListingCheck[];
  shortlisted: boolean;
  indexOf: Record<string, number>;
}) {
  const l = r.listing;
  const area = l.fields.area !== UNKNOWN ? l.fields.area : l.title;
  const myPending = me.key_locations
    .map((loc) => ({ loc, c: commuteFor(checks, l.id, me.member_id, loc.label) }))
    .filter(({ c }) => !c?.confirmed)
    // On a ruled-out flat, only ask her to confirm if one of the breaks is hers (her commute estimate).
    .filter(() => r.status !== "ruled_out" || r.breaks.some((x) => x.memberId === me.member_id && x.field === "commute"));
  const othersPending = r.toVerify.filter((v) => v.field === "commute" && v.memberId !== me.member_id);
  const questions = brokerQuestions(r.toVerify);

  return (
    <article id={`l-${l.id}`} className={`card relative scroll-mt-28 space-y-4 overflow-hidden pl-6 ${r.status === "ruled_out" ? "bg-white/70" : ""}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${statusBar(r.status)}`} aria-hidden />
      <div className="space-y-2.5">
        <StatusBadge status={r.status} />
        <h3 className="font-display text-xl font-semibold leading-snug text-stone-900">{l.title}</h3>
        <Facts r={r} />
      </div>

      {r.status === "ruled_out" && (
        <ul className="space-y-2">
          {r.breaks.map((x, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-2xl bg-rose-50/70 px-3 py-2.5 text-sm text-rose-950">
              <Avatar name={x.name} index={indexOf[x.memberId] ?? 0} size="sm" />
              <span>
                Breaks <strong className="font-semibold">{x.name}&apos;s</strong> dealbreaker: {x.reason}
              </span>
            </li>
          ))}
        </ul>
      )}

      {r.status === "needs_verification" && (
        <div className="space-y-3">
          {questions.length > 0 && (
            <div className="checkpoint">
              <p className="mb-2 flex items-center gap-2 font-semibold">
                <Icon name="chat" className="h-4 w-4 text-amber-700" /> Confirm with the broker before this can qualify
              </p>
              <div className="divide-y divide-amber-200/60">
                {questions.map((q) => (
                  <VerifyField key={q.field} token={token} listingId={l.id} field={q.field} who={q.who} />
                ))}
              </div>
            </div>
          )}
          {othersPending.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {othersPending.map((v, i) => (
                <Line key={i} kind="wait">{v.text}</Line>
              ))}
            </ul>
          )}
        </div>
      )}

      {myPending.map(({ loc, c }) => (
        <ConfirmCommute
          key={loc.label}
          token={token}
          listingId={l.id}
          locKey={loc.label}
          label={`${loc.label} (${loc.place})`}
          limit={loc.max_minutes}
          estimate={c?.minutes ?? null}
          mapsUrl={mapsDirectionsUrl(area, loc.place)}
        />
      ))}

      {r.status === "qualifies" && r.tradeoffs && (
        <>
          <Tradeoffs tradeoffs={r.tradeoffs} indexOf={indexOf} />
          <ShortlistToggle token={token} listingId={l.id} on={shortlisted} />
        </>
      )}

      {l.url && (
        <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn-ghost -ml-3 text-xs">
          Original listing <Icon name="external" className="h-3.5 w-3.5" />
        </a>
      )}
    </article>
  );
}
