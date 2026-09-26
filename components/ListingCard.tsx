import { brokerQuestions, commuteFor, describeBreak, ordinal, type ListingResult } from "@/lib/matching";
import { mapsDirectionsUrl } from "@/lib/maps";
import { UNKNOWN, type Constraints, type ListingCheck } from "@/lib/types";
import { ConfirmCommute, ShortlistToggle, VerifyField } from "./ListingActions";
import { Tradeoffs } from "./Tradeoffs";

const BADGE = {
  qualifies: { text: "Qualifies", cls: "bg-teal-100 text-teal-900" },
  needs_verification: { text: "Needs verification", cls: "bg-amber-100 text-amber-900" },
  ruled_out: { text: "Ruled out", cls: "bg-red-100 text-red-900" },
};

export function facts(r: ListingResult): string {
  const f = r.listing.fields;
  const u = (v: unknown, s: string) => (v === UNKNOWN ? `${s} ?` : null);
  return [
    f.area !== UNKNOWN ? f.area : "Area ?",
    f.rent !== UNKNOWN ? `₹${f.rent.toLocaleString("en-IN")}/mo` : "Rent ?",
    f.bhk !== UNKNOWN ? `${f.bhk}BHK` : null,
    f.floor !== UNKNOWN ? `${ordinal(f.floor)} floor` : u(f.floor, "Floor"),
    f.lift === "yes" ? "lift" : f.lift === "no" ? "no lift" : "lift ?",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ListingCard({
  r,
  token,
  me,
  checks,
  shortlisted,
}: {
  r: ListingResult;
  token: string;
  me: Constraints;
  checks: ListingCheck[];
  shortlisted: boolean;
}) {
  const l = r.listing;
  const b = BADGE[r.status];
  const area = l.fields.area !== UNKNOWN ? l.fields.area : l.title;
  const myPending = me.key_locations
    .map((loc) => ({ loc, c: commuteFor(checks, l.id, me.member_id, loc.label) }))
    .filter(({ c }) => !c?.confirmed)
    // On a ruled-out flat, only ask her to confirm if one of the breaks is hers (her commute estimate).
    .filter(() => r.status !== "ruled_out" || r.breaks.some((x) => x.memberId === me.member_id && x.field === "commute"));
  const othersPending = r.toVerify.filter((v) => v.field === "commute" && v.memberId !== me.member_id);

  return (
    <article id={`l-${l.id}`} className="card scroll-mt-28 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{l.title}</h3>
          <p className="text-sm text-stone-600">{facts(r)}</p>
          {l.url && (
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 underline">
              Original listing ↗
            </a>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${b.cls}`}>{b.text}</span>
      </div>

      {r.status === "ruled_out" && (
        <ul className="space-y-1 text-sm text-red-900">
          {r.breaks.map((x, i) => (
            <li key={i}>✕ {describeBreak(x)}</li>
          ))}
        </ul>
      )}

      {r.status === "needs_verification" && (
        <div className="space-y-2">
          {brokerQuestions(r.toVerify).length > 0 && (
            <div className="checkpoint">
              <p className="mb-1 font-semibold">Confirm with the broker before this can qualify:</p>
              {brokerQuestions(r.toVerify).map((q) => (
                <VerifyField key={q.field} token={token} listingId={l.id} field={q.field} who={q.who} />
              ))}
            </div>
          )}
          {othersPending.length > 0 && (
            <ul className="text-sm text-amber-900">
              {othersPending.map((v, i) => (
                <li key={i}>⏳ {v.text}</li>
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
          label={`${loc.label} (${loc.place}), limit ${loc.max_minutes} min`}
          estimate={c?.minutes ?? null}
          mapsUrl={mapsDirectionsUrl(area, loc.place)}
        />
      ))}

      {r.status === "qualifies" && r.tradeoffs && (
        <>
          <Tradeoffs tradeoffs={r.tradeoffs} />
          <ShortlistToggle token={token} listingId={l.id} on={shortlisted} />
        </>
      )}
    </article>
  );
}
