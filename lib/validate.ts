// Input normalisation shared by the API routes, the Gemini parser and the manual form.
// Anything missing or unclear becomes "unknown" — never a guessed value.

import {
  FIELD_KEYS,
  UNKNOWN,
  type Constraints,
  type Furnishing,
  type KeyLocation,
  type ListingFields,
  type Num,
  type Tri,
} from "./types";

const TRI_KEYS = ["lift", "parking", "pet_friendly", "balcony", "gym", "near_metro"] as const;
const NUM_KEYS = ["rent", "bhk", "floor", "bathrooms", "attached_bathrooms"] as const;

export function emptyFields(): ListingFields {
  return Object.fromEntries(FIELD_KEYS.map((k) => [k, UNKNOWN])) as unknown as ListingFields;
}

export function toTri(v: unknown): Tri {
  if (v === true || v === "yes") return "yes";
  if (v === false || v === "no") return "no";
  return UNKNOWN;
}

export function toNum(v: unknown): Num {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.round(v);
  if (typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v)) return Math.round(Number(v));
  return UNKNOWN;
}

export function toFurnishing(v: unknown): Furnishing {
  return v === "full" || v === "semi" || v === "none" ? v : UNKNOWN;
}

export function normalizeFields(input: unknown): ListingFields {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const f = emptyFields();
  const area = typeof o.area === "string" ? o.area.trim() : "";
  f.area = area && area.toLowerCase() !== UNKNOWN ? area.slice(0, 80) : UNKNOWN;
  for (const k of TRI_KEYS) f[k] = toTri(o[k]);
  for (const k of NUM_KEYS) f[k] = toNum(o[k]);
  f.furnished = toFurnishing(o.furnished);
  return f;
}

/** Normalise one field value for verify_field. Returns null if the value isn't valid for that field. */
export function normalizeFieldValue(field: string, value: unknown): ListingFields[keyof ListingFields] | null {
  if (!(FIELD_KEYS as string[]).includes(field)) return null;
  const f = normalizeFields({ [field]: value });
  const v = f[field as keyof ListingFields];
  return v === UNKNOWN ? null : v;
}

const str = (v: unknown, max = 80) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strList = (v: unknown) =>
  Array.isArray(v) ? [...new Set(v.map((x) => str(x)).filter(Boolean))].slice(0, 40) : [];
const optInt = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n < 1000 ? n : null;
};

export type ConstraintsInput = Omit<Constraints, "member_id">;

export function normalizeConstraints(input: unknown): { ok: true; data: ConstraintsInput } | { ok: false; error: string } {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const name = str(o.name, 40);
  if (!name) return { ok: false, error: "Please add your name." };
  const max_rent = Number(o.max_rent);
  if (!Number.isInteger(max_rent) || max_rent <= 0) return { ok: false, error: "Please add your max rent contribution." };

  const key_locations: KeyLocation[] = (Array.isArray(o.key_locations) ? o.key_locations : [])
    .map((l: Record<string, unknown>) => ({
      label: str(l?.label, 30),
      place: str(l?.place, 80),
      max_minutes: Number(l?.max_minutes),
    }))
    .filter((l) => l.label && l.place && Number.isInteger(l.max_minutes) && l.max_minutes > 0)
    .slice(0, 5);
  const labels = key_locations.map((l) => l.label.toLowerCase());
  if (new Set(labels).size !== labels.length) return { ok: false, error: "Give each key location a different label." };

  const n = (o.nice_to_haves ?? {}) as Record<string, unknown>;
  return {
    ok: true,
    data: {
      name,
      max_rent,
      no_go_areas: strList(o.no_go_areas),
      key_locations,
      lift_required: o.lift_required === true,
      parking_required: o.parking_required === true,
      pet_friendly_required: o.pet_friendly_required === true,
      min_bathrooms: optInt(o.min_bathrooms),
      max_floor_without_lift: optInt(o.max_floor_without_lift),
      nice_to_haves: {
        furnished: n.furnished === true,
        balcony: n.balcony === true,
        gym: n.gym === true,
        near_metro: n.near_metro === true,
        attached_bathroom: n.attached_bathroom === true,
      },
      nice_to_have_other: strList(o.nice_to_have_other).slice(0, 10),
    },
  };
}
