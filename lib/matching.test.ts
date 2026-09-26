import { describe, expect, it } from "vitest";
import {
  brokerQuestions,
  checkAll,
  checkListing,
  describeBreak,
  sortByNiceToHavesMet,
} from "./matching";
import {
  AUNDH_ITI,
  BALEWADI,
  BANER,
  KAVITA,
  KOTHRUD,
  MEERA,
  PASHAN,
  RIYA,
  WALKUP,
  demoChecks,
  demoListings,
  demoPeople,
} from "./demo-data";
import type { Listing, ListingCheck } from "./types";

const listing = (id: string) => demoListings.find((l) => l.id === id)!;
const run = (id: string, checks: ListingCheck[] = demoChecks) => checkListing(listing(id), demoPeople, checks);
const withFields = (id: string, fields: Partial<Listing["fields"]>): Listing => ({
  ...listing(id),
  fields: { ...listing(id).fields, ...fields },
});

describe("the three real cases", () => {
  it("Baner 3BHK: ruled out by Kavita's Hinjewadi commute (+45 min each way)", () => {
    const r = run(BANER);
    expect(r.status).toBe("ruled_out");
    expect(r.breaks).toHaveLength(1);
    expect(r.breaks[0].memberId).toBe(KAVITA);
    expect(describeBreak(r.breaks[0])).toBe(
      "Breaks Kavita's dealbreaker: 75 min to Office (Hinjewadi), her limit is 30 min (+45 min each way)",
    );
  });

  it("Kothrud flat: ruled out, more than 20 min from Riya's gym and family", () => {
    const r = run(KOTHRUD);
    expect(r.status).toBe("ruled_out");
    expect(r.breaks.map((b) => b.memberId)).toEqual([RIYA, RIYA]);
    expect(r.breaks.map((b) => b.reason)).toEqual([
      "35 min to Gym (Aundh), her limit is 20 min (+15 min each way)",
      "40 min to Family (Aundh), her limit is 20 min (+20 min each way)",
    ]);
  });

  it("5th floor, no lift: ruled out by Meera's dealbreaker", () => {
    const r = run(WALKUP);
    expect(r.status).toBe("ruled_out");
    expect(r.breaks).toHaveLength(1);
    expect(describeBreak(r.breaks[0])).toBe("Breaks Meera's dealbreaker: 5th floor, no lift");
  });
});

describe("unknown is never a pass", () => {
  it("unknown lift on the 4th floor → needs verification, naming Meera and the field", () => {
    const r = run(PASHAN);
    expect(r.status).toBe("needs_verification");
    const q = brokerQuestions(r.toVerify);
    expect(q).toEqual([{ field: "lift", text: "Lift (it's on the 4th floor)", who: ["Meera"] }]);
  });

  it("unconfirmed commute estimate within the limit → needs verification", () => {
    const r = run(PASHAN);
    expect(r.toVerify.some((v) => v.field === "commute" && v.memberId === MEERA)).toBe(true);
  });

  it("confirming lift + commute moves Pashan to qualifies", () => {
    const checks = demoChecks.map((c) =>
      c.listing_id === PASHAN && c.member_id === MEERA ? { ...c, confirmed: true } : c,
    );
    const r = checkListing(withFields(PASHAN, { lift: "yes" }), demoPeople, checks);
    expect(r.status).toBe("qualifies");
  });

  it("unknown rent → needs verification, not qualifies", () => {
    const r = checkListing(withFields(AUNDH_ITI, { rent: "unknown" }), demoPeople, demoChecks);
    expect(r.status).toBe("needs_verification");
    expect(brokerQuestions(r.toVerify).map((q) => q.field)).toEqual(["rent"]);
  });

  it("missing commute estimate → needs verification", () => {
    const checks = demoChecks.filter((c) => !(c.listing_id === AUNDH_ITI && c.member_id === KAVITA));
    const r = run(AUNDH_ITI, checks);
    expect(r.status).toBe("needs_verification");
    expect(r.toVerify[0].text).toBe("Commute to Office (Hinjewadi): no estimate yet");
  });

  it("unknown floor with no lift is flagged for someone with a floor limit", () => {
    const r = checkListing(withFields(AUNDH_ITI, { lift: "no", floor: "unknown" }), demoPeople, demoChecks);
    expect(r.status).toBe("needs_verification");
    expect(brokerQuestions(r.toVerify).map((q) => q.field)).toEqual(["floor"]);
  });

  it("unknown parking breaks nothing but needs verification for Kavita", () => {
    const r = checkListing(withFields(AUNDH_ITI, { parking: "unknown" }), demoPeople, demoChecks);
    expect(r.status).toBe("needs_verification");
    expect(brokerQuestions(r.toVerify)).toEqual([{ field: "parking", text: "Parking", who: ["Kavita"] }]);
  });
});

describe("other hard constraints", () => {
  it("budget: rent ÷ 3 over someone's max rules it out", () => {
    const r = checkListing(withFields(AUNDH_ITI, { rent: 51000 }), demoPeople, demoChecks);
    expect(r.status).toBe("ruled_out");
    expect(describeBreak(r.breaks[0])).toBe("Breaks Meera's dealbreaker: rent share ₹17,000 is over her ₹16,000 max (+₹1,000)");
  });

  it("no-go area", () => {
    const r = checkListing(withFields(AUNDH_ITI, { area: "Hadapsar, Pune" }), demoPeople, demoChecks);
    expect(r.breaks.map(describeBreak)).toEqual(["Breaks Kavita's dealbreaker: Hadapsar is an area she won't consider"]);
  });

  it("an over-limit estimate is ruled out even before confirmation, and says it's unverified", () => {
    const checks = demoChecks.map((c) =>
      c.listing_id === AUNDH_ITI && c.member_id === KAVITA ? { ...c, minutes: 50, confirmed: false } : c,
    );
    const r = run(AUNDH_ITI, checks);
    expect(r.status).toBe("ruled_out");
    expect(r.breaks[0].reason).toContain("estimate, unverified");
  });

  it("too few bathrooms, no parking", () => {
    const r = checkListing(withFields(AUNDH_ITI, { bathrooms: 1, parking: "no" }), demoPeople, demoChecks);
    expect(r.breaks.map(describeBreak)).toEqual([
      "Breaks Riya's dealbreaker: 1 bathroom, she needs at least 2",
      "Breaks Kavita's dealbreaker: no parking, and she needs it",
    ]);
  });
});

describe("tradeoffs", () => {
  it("qualifying listings get one factual column per person, no combined score", () => {
    const r = run(AUNDH_ITI);
    expect(r.status).toBe("qualifies");
    expect(r.tradeoffs!.map((t) => t.name)).toEqual(["Riya", "Meera", "Kavita"]);
    const [riya, meera, kavita] = r.tradeoffs!;
    expect(riya.gets).toContain("Rent share ₹15,000, ₹3,000 under her ₹18,000 max");
    expect(riya.gets).toContain("Balcony");
    expect(riya.compromises).toEqual(["No near metro"]);
    expect(riya.checkYourself).toEqual(["Quiet street"]);
    expect(meera.gets).toContain("Attached bathroom (every bedroom has one)");
    expect(meera.compromises).toEqual([]);
    expect(kavita.compromises).toEqual(["No gym in building", "No near metro"]);
    expect(kavita.gets).toContain("30 min to Office (Hinjewadi), limit 30 · confirmed");
  });

  it("partial attached bathrooms are shown as a shared decision, not assigned to anyone", () => {
    const meera = run(BALEWADI).tradeoffs!.find((t) => t.memberId === MEERA)!;
    expect(meera.compromises).toContain("Only 2 of 3 bedrooms have an attached bathroom (to decide together)");
    expect(meera.compromises).toContain("Only semi-furnished");
  });

  it("unknown nice-to-haves are listed as unknown, never as met", () => {
    const r = checkListing(withFields(AUNDH_ITI, { balcony: "unknown" }), demoPeople, demoChecks);
    const riya = r.tradeoffs!.find((t) => t.memberId === RIYA)!;
    expect(riya.unknowns).toEqual(["Balcony"]);
    expect(riya.gets).not.toContain("Balcony");
  });

  it("demo set: 3 ruled out, 1 needs verification, 2 qualify; sort is by nice-to-haves met", () => {
    const results = checkAll(demoListings, demoPeople, demoChecks);
    const by = (s: string) => results.filter((r) => r.status === s).map((r) => r.listing.id);
    expect(by("ruled_out")).toEqual([BANER, KOTHRUD, WALKUP]);
    expect(by("needs_verification")).toEqual([PASHAN]);
    expect(by("qualifies")).toEqual([AUNDH_ITI, BALEWADI]);
    const sorted = sortByNiceToHavesMet(results.filter((r) => r.status === "qualifies"));
    expect(sorted.map((r) => r.niceToHavesMet)).toEqual([...sorted.map((r) => r.niceToHavesMet)].sort((a, b) => b - a));
  });
});
