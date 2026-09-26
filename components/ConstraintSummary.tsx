import type { Constraints } from "@/lib/types";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function ConstraintSummary({ c }: { c: Constraints }) {
  const hard = [
    c.lift_required && "Lift",
    c.parking_required && "Parking",
    c.pet_friendly_required && "Pet-friendly",
    c.min_bathrooms != null && `≥ ${c.min_bathrooms} bathrooms`,
    c.max_floor_without_lift != null && `Max floor ${c.max_floor_without_lift} without a lift`,
  ].filter(Boolean) as string[];
  const nice = [
    c.nice_to_haves.furnished && "Furnished",
    c.nice_to_haves.balcony && "Balcony",
    c.nice_to_haves.gym && "Gym",
    c.nice_to_haves.near_metro && "Near metro",
    c.nice_to_haves.attached_bathroom && "Attached bathroom",
    ...c.nice_to_have_other,
  ].filter(Boolean) as string[];
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 text-sm">
      <dt className="text-stone-500">Max rent share</dt>
      <dd>{inr(c.max_rent)}/month</dd>
      <dt className="text-stone-500">Won&apos;t consider</dt>
      <dd>{c.no_go_areas.length ? c.no_go_areas.join(", ") : "None"}</dd>
      <dt className="text-stone-500">Commutes</dt>
      <dd>
        {c.key_locations.length
          ? c.key_locations.map((l) => `${l.label} (${l.place}) ≤ ${l.max_minutes} min`).join(" · ")
          : "None"}
      </dd>
      <dt className="text-stone-500">Dealbreakers</dt>
      <dd>{hard.length ? hard.join(" · ") : "None"}</dd>
      <dt className="text-stone-500">Nice-to-haves</dt>
      <dd>{nice.length ? nice.join(" · ") : "None"}</dd>
    </dl>
  );
}
