// Deterministic dealbreaker + tradeoff logic. Pure functions, no I/O, no AI.
//
// Rules:
//   * Any hard constraint broken           → "ruled_out" (with whose dealbreaker and why)
//   * Else any hard constraint unknown or
//     any commute not yet confirmed        → "needs_verification" (exact things to confirm)
//   * Else                                 → "qualifies"
// Unknown is NEVER a pass. Nothing here ranks people or picks a winner.

import {
  UNKNOWN,
  type Constraints,
  type Listing,
  type ListingCheck,
  type ListingFields,
  type NiceToHaves,
} from "./types";

export type Status = "ruled_out" | "needs_verification" | "qualifies";

export interface Break {
  memberId: string;
  name: string;
  reason: string;
  /** what broke: a listing field, or "commute" */
  field: keyof ListingFields | "commute";
}

export interface VerifyItem {
  memberId: string;
  name: string;
  /** listing field to confirm with the broker, or "commute" for a commute check */
  field: keyof ListingFields | "commute";
  /** for commute items: the key-location label */
  locationKey?: string;
  text: string;
}

export interface PersonTradeoff {
  memberId: string;
  name: string;
  gets: string[];
  compromises: string[];
  unknowns: string[];
  checkYourself: string[];
  niceToHavesMet: number;
}

export interface ListingResult {
  listing: Listing;
  status: Status;
  breaks: Break[];
  toVerify: VerifyItem[];
  /** only for qualifying listings */
  tradeoffs: PersonTradeoff[] | null;
  /** total nice-to-haves met across everyone (for the plainly-labelled sort only) */
  niceToHavesMet: number;
}

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function ordinal(n: number): string {
  if (n === 0) return "Ground";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** True if the listing's area matches a no-go area (e.g. "Baner, Pune" matches "Baner"). */
export function areaMatches(listingArea: string, noGo: string): boolean {
  const a = norm(listingArea);
  const n = norm(noGo);
  if (!n) return false;
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`).test(a);
}

export function commuteFor(checks: ListingCheck[], listingId: string, memberId: string, key: string) {
  return checks.find(
    (c) => c.kind === "commute" && c.listing_id === listingId && c.member_id === memberId && c.key === key,
  );
}

function checkPerson(
  listing: Listing,
  p: Constraints,
  checks: ListingCheck[],
  groupSize: number,
): { breaks: Break[]; toVerify: VerifyItem[] } {
  const f = listing.fields;
  const breaks: Break[] = [];
  const toVerify: VerifyItem[] = [];
  const br = (field: Break["field"], reason: string) => breaks.push({ memberId: p.member_id, name: p.name, reason, field });
  const ver = (field: VerifyItem["field"], text: string, locationKey?: string) =>
    toVerify.push({ memberId: p.member_id, name: p.name, field, text, locationKey });

  // Budget: equal share of rent.
  if (f.rent === UNKNOWN) {
    ver("rent", "Rent");
  } else {
    const share = f.rent / groupSize;
    if (share > p.max_rent) {
      br("rent", `rent share ${inr(share)} is over her ${inr(p.max_rent)} max (+${inr(share - p.max_rent)})`);
    }
  }

  // No-go areas.
  if (p.no_go_areas.length > 0) {
    if (f.area === UNKNOWN) {
      ver("area", "Area / locality");
    } else {
      const hit = p.no_go_areas.find((n) => areaMatches(f.area as string, n));
      if (hit) br("area", `${hit} is an area she won't consider`);
    }
  }

  // Commutes (estimated by whoever added the listing; confirmed only by her).
  for (const loc of p.key_locations) {
    const c = commuteFor(checks, listing.id, p.member_id, loc.label);
    const where = `${loc.label} (${loc.place})`;
    if (!c || c.minutes == null) {
      ver("commute", `Commute to ${where}: no estimate yet`, loc.label);
    } else if (c.minutes > loc.max_minutes) {
      br(
        "commute",
        `${c.minutes} min to ${where}, her limit is ${loc.max_minutes} min (+${c.minutes - loc.max_minutes} min each way)` +
          (c.confirmed ? "" : " — estimate, unverified"),
      );
    } else if (!c.confirmed) {
      ver("commute", `Commute to ${where}: estimated ${c.minutes} min, ${p.name} to confirm`, loc.label);
    }
  }

  // Lift / floor.
  if (p.lift_required) {
    if (f.lift === "no") br("lift", "no lift, and she needs one");
    else if (f.lift === UNKNOWN) ver("lift", "Lift");
  }
  if (p.max_floor_without_lift != null && !(p.lift_required && f.lift === "no")) {
    const max = p.max_floor_without_lift;
    if (f.lift === "yes") {
      // fine
    } else if (f.floor === UNKNOWN) {
      // Only matters if there might be no lift.
      ver("floor", "Floor");
      if (f.lift === UNKNOWN && !p.lift_required) ver("lift", "Lift");
    } else if (f.floor > max) {
      if (f.lift === "no") br("floor", `${ordinal(f.floor)} floor, no lift`);
      else if (!p.lift_required) ver("lift", `Lift (it's on the ${ordinal(f.floor)} floor)`);
    }
  }

  if (p.parking_required) {
    if (f.parking === "no") br("parking", "no parking, and she needs it");
    else if (f.parking === UNKNOWN) ver("parking", "Parking");
  }
  if (p.pet_friendly_required) {
    if (f.pet_friendly === "no") br("pet_friendly", "not pet-friendly, and she needs it to be");
    else if (f.pet_friendly === UNKNOWN) ver("pet_friendly", "Pet-friendly");
  }
  if (p.min_bathrooms != null && p.min_bathrooms > 0) {
    if (f.bathrooms === UNKNOWN) ver("bathrooms", "Number of bathrooms");
    else if (f.bathrooms < p.min_bathrooms)
      br("bathrooms", `${f.bathrooms} bathroom${f.bathrooms === 1 ? "" : "s"}, she needs at least ${p.min_bathrooms}`);
  }

  return { breaks, toVerify };
}

type NiceKey = keyof NiceToHaves;
const NICE_LABELS: Record<NiceKey, string> = {
  furnished: "Furnished",
  balcony: "Balcony",
  gym: "Gym in building",
  near_metro: "Near metro",
  attached_bathroom: "Attached bathroom for her",
};

type NiceOutcome = { kind: "met" | "missed" | "unknown"; text: string };

function niceOutcome(key: NiceKey, f: ListingFields, groupSize: number): NiceOutcome {
  const label = NICE_LABELS[key];
  const tri = (v: string): NiceOutcome =>
    v === "yes"
      ? { kind: "met", text: label }
      : v === "no"
        ? { kind: "missed", text: `No ${label.toLowerCase()}` }
        : { kind: "unknown", text: label };
  switch (key) {
    case "furnished":
      if (f.furnished === "full") return { kind: "met", text: "Furnished" };
      if (f.furnished === "semi") return { kind: "missed", text: "Only semi-furnished" };
      if (f.furnished === "none") return { kind: "missed", text: "Unfurnished" };
      return { kind: "unknown", text: label };
    case "balcony":
      return tri(f.balcony);
    case "gym":
      return tri(f.gym);
    case "near_metro":
      return tri(f.near_metro);
    case "attached_bathroom":
      if (f.attached_bathrooms === UNKNOWN) return { kind: "unknown", text: label };
      if (f.attached_bathrooms >= groupSize) return { kind: "met", text: "Attached bathroom (every bedroom has one)" };
      if (f.attached_bathrooms === 0) return { kind: "missed", text: "No attached bathrooms" };
      return {
        kind: "missed",
        text: `Only ${f.attached_bathrooms} of ${groupSize} bedrooms have an attached bathroom (to decide together)`,
      };
  }
}

export function tradeoffFor(
  listing: Listing,
  p: Constraints,
  checks: ListingCheck[],
  groupSize: number,
): PersonTradeoff {
  const f = listing.fields;
  const gets: string[] = [];
  const compromises: string[] = [];
  const unknowns: string[] = [];

  if (f.rent !== UNKNOWN) {
    const share = f.rent / groupSize;
    const headroom = p.max_rent - share;
    gets.push(
      headroom > 0
        ? `Rent share ${inr(share)}, ${inr(headroom)} under her ${inr(p.max_rent)} max`
        : `Rent share ${inr(share)}, exactly her max`,
    );
  }
  for (const loc of p.key_locations) {
    const c = commuteFor(checks, listing.id, p.member_id, loc.label);
    if (c && c.minutes != null) {
      gets.push(
        `${c.minutes} min to ${loc.label} (${loc.place}), limit ${loc.max_minutes}` +
          (c.confirmed ? " · confirmed" : " · unverified"),
      );
    }
  }

  let met = 0;
  for (const key of Object.keys(NICE_LABELS) as NiceKey[]) {
    if (!p.nice_to_haves[key]) continue;
    const o = niceOutcome(key, f, groupSize);
    if (o.kind === "met") {
      met++;
      gets.push(o.text);
    } else if (o.kind === "missed") compromises.push(o.text);
    else unknowns.push(o.text);
  }

  return {
    memberId: p.member_id,
    name: p.name,
    gets,
    compromises,
    unknowns,
    checkYourself: p.nice_to_have_other.filter((s) => s.trim()),
    niceToHavesMet: met,
  };
}

export function checkListing(
  listing: Listing,
  people: Constraints[],
  checks: ListingCheck[],
  groupSize = people.length,
): ListingResult {
  const breaks: Break[] = [];
  const toVerify: VerifyItem[] = [];
  for (const p of people) {
    const r = checkPerson(listing, p, checks, groupSize);
    breaks.push(...r.breaks);
    toVerify.push(...r.toVerify);
  }
  const status: Status = breaks.length ? "ruled_out" : toVerify.length ? "needs_verification" : "qualifies";
  const tradeoffs = status === "qualifies" ? people.map((p) => tradeoffFor(listing, p, checks, groupSize)) : null;
  return {
    listing,
    status,
    breaks,
    toVerify,
    tradeoffs,
    niceToHavesMet: tradeoffs ? tradeoffs.reduce((s, t) => s + t.niceToHavesMet, 0) : 0,
  };
}

export function checkAll(listings: Listing[], people: Constraints[], checks: ListingCheck[]): ListingResult[] {
  return listings.map((l) => checkListing(l, people, checks));
}

/** Plain sort: total nice-to-haves met across all three. Not a "best" score. */
export function sortByNiceToHavesMet(results: ListingResult[]): ListingResult[] {
  return [...results].sort((a, b) => b.niceToHavesMet - a.niceToHavesMet);
}

/** "Breaks Meera's dealbreaker: 5th floor, no lift" */
export function describeBreak(b: Break): string {
  return `Breaks ${b.name}'s dealbreaker: ${b.reason}`;
}

/** Unique listing fields to ask the broker about (excludes personal commute checks). */
export function brokerQuestions(toVerify: VerifyItem[]): { field: keyof ListingFields; text: string; who: string[] }[] {
  const map = new Map<string, { field: keyof ListingFields; text: string; who: string[] }>();
  for (const v of toVerify) {
    if (v.field === "commute") continue;
    const e = map.get(v.field) ?? { field: v.field, text: v.text, who: [] };
    if (!e.who.includes(v.name)) e.who.push(v.name);
    map.set(v.field, e);
  }
  return [...map.values()];
}

/** Unique fields still "unknown" on a listing (used by the shortlist's Verified checkboxes). */
export function unknownFields(f: ListingFields): (keyof ListingFields)[] {
  return (Object.keys(f) as (keyof ListingFields)[]).filter((k) => f[k] === UNKNOWN);
}
