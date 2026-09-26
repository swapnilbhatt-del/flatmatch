import type { Constraints } from "@/lib/types";
import { Icon, type IconName } from "./ui";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function Row({ icon, label, items, tone = "stone" }: { icon: IconName; label: string; items: string[]; tone?: "stone" | "rose" | "brand" | "amber" }) {
  const chip = {
    stone: "bg-stone-100 text-stone-700",
    rose: "bg-rose-50 text-rose-800",
    brand: "bg-brand-50 text-brand-800",
    amber: "bg-amber-50 text-amber-900",
  }[tone];
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-500">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {items.length ? (
            items.map((x) => (
              <span key={x} className={`rounded-full px-2.5 py-0.5 text-[13px] ${chip}`}>
                {x}
              </span>
            ))
          ) : (
            <span className="text-[13px] text-stone-400">None</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConstraintSummary({ c }: { c: Constraints }) {
  const hard = [
    c.lift_required && "Lift",
    c.parking_required && "Parking",
    c.pet_friendly_required && "Pet-friendly",
    c.min_bathrooms != null && `≥ ${c.min_bathrooms} bathrooms`,
    c.max_floor_without_lift != null && `Max floor ${c.max_floor_without_lift} without lift`,
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
    <div className="space-y-3.5">
      <Row icon="wallet" label="Max rent share" items={[`${inr(c.max_rent)} / month`]} tone="brand" />
      <Row icon="pin" label="Commutes (one way)" items={c.key_locations.map((l) => `${l.label} · ${l.place} · ≤ ${l.max_minutes} min`)} tone="brand" />
      <Row icon="shield" label="Dealbreakers" items={hard} tone="rose" />
      <Row icon="x" label="Won't consider" items={c.no_go_areas} tone="rose" />
      <Row icon="heart" label="Nice-to-haves" items={nice} tone="amber" />
    </div>
  );
}
