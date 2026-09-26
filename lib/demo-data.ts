// The Riya / Meera / Kavita scenario. Used by the unit tests AND to generate supabase/seed.sql,
// so the demo on the live URL and the tests can never drift apart.

import type { Constraints, Listing, ListingCheck, ListingFields } from "./types";

export const DEMO_GROUP_ID = "00000000-0000-4000-8000-000000000001";
export const RIYA = "00000000-0000-4000-8000-0000000000a1";
export const MEERA = "00000000-0000-4000-8000-0000000000a2";
export const KAVITA = "00000000-0000-4000-8000-0000000000a3";

// Personal links for the demo: /g/demo-riya, /g/demo-meera, /g/demo-kavita
export const DEMO_TOKENS: Record<string, string> = {
  [RIYA]: "demo-riya",
  [MEERA]: "demo-meera",
  [KAVITA]: "demo-kavita",
};

const none = { nice_to_have_other: [] as string[] };

export const demoPeople: Constraints[] = [
  {
    member_id: RIYA,
    name: "Riya",
    max_rent: 18000,
    no_go_areas: ["Wagholi"],
    key_locations: [
      { label: "Gym", place: "Aundh", max_minutes: 20 },
      { label: "Family", place: "Aundh", max_minutes: 20 },
    ],
    lift_required: false,
    parking_required: false,
    pet_friendly_required: false,
    min_bathrooms: 2,
    max_floor_without_lift: null,
    nice_to_haves: { balcony: true, near_metro: true, furnished: true },
    nice_to_have_other: ["Quiet street"],
  },
  {
    member_id: MEERA,
    name: "Meera",
    max_rent: 16000,
    no_go_areas: [],
    key_locations: [{ label: "Office", place: "Shivajinagar", max_minutes: 35 }],
    lift_required: false,
    parking_required: false,
    pet_friendly_required: false,
    min_bathrooms: null,
    max_floor_without_lift: 1, // knee condition: above 1st floor needs a lift
    nice_to_haves: { attached_bathroom: true, furnished: true, balcony: true },
    ...none,
  },
  {
    member_id: KAVITA,
    name: "Kavita",
    max_rent: 17000,
    no_go_areas: ["Hadapsar"],
    key_locations: [{ label: "Office", place: "Hinjewadi", max_minutes: 30 }],
    lift_required: false,
    parking_required: true, // scooter
    pet_friendly_required: false,
    min_bathrooms: null,
    max_floor_without_lift: null,
    nice_to_haves: { gym: true, near_metro: true },
    ...none,
  },
];

const base: ListingFields = {
  area: "unknown",
  rent: "unknown",
  bhk: 3,
  floor: "unknown",
  lift: "unknown",
  parking: "unknown",
  bathrooms: "unknown",
  attached_bathrooms: "unknown",
  pet_friendly: "unknown",
  furnished: "unknown",
  balcony: "unknown",
  gym: "unknown",
  near_metro: "unknown",
};

export interface DemoListing extends Listing {
  raw_text: string;
}

const L = (n: number) => `00000000-0000-4000-8000-0000000001${String(n).padStart(2, "0")}`;
export const BANER = L(1);
export const KOTHRUD = L(2);
export const WALKUP = L(3);
export const PASHAN = L(4);
export const AUNDH_ITI = L(5);
export const BALEWADI = L(6);

export const demoListings: DemoListing[] = [
  {
    id: BANER,
    title: "Baner 3BHK near Balewadi High Street",
    url: null,
    added_by: RIYA,
    raw_text:
      "3 BHK in Baner, 3rd floor, lift and covered parking. 3 bathrooms (2 attached). Semi-furnished, balcony, society gym. Rent 48,000/month.",
    fields: {
      ...base, area: "Baner", rent: 48000, floor: 3, lift: "yes", parking: "yes", bathrooms: 3,
      attached_bathrooms: 2, furnished: "semi", balcony: "yes", gym: "yes", near_metro: "no",
    },
  },
  {
    id: KOTHRUD,
    title: "Kothrud 3BHK, Karve Road",
    url: null,
    added_by: MEERA,
    raw_text:
      "Spacious 3BHK Kothrud, Karve Road. 2nd floor with lift. Parking available. 3 baths, all attached. Fully furnished. Rent 42k.",
    fields: {
      ...base, area: "Kothrud", rent: 42000, floor: 2, lift: "yes", parking: "yes", bathrooms: 3,
      attached_bathrooms: 3, furnished: "full", balcony: "yes", near_metro: "yes",
    },
  },
  {
    id: WALKUP,
    title: "Aundh 3BHK, 5th floor walk-up",
    url: null,
    added_by: KAVITA,
    raw_text:
      "3BHK Aundh, 5th floor, no lift (old building). Bike + car parking. 2 bathrooms. Unfurnished. Big balcony. Rent 39,000.",
    fields: {
      ...base, area: "Aundh", rent: 39000, floor: 5, lift: "no", parking: "yes", bathrooms: 2,
      attached_bathrooms: 1, furnished: "none", balcony: "yes",
    },
  },
  {
    id: PASHAN,
    title: "Pashan 3BHK, Sus Road",
    url: null,
    added_by: RIYA,
    raw_text: "3BHK flat Pashan-Sus Road, 4th floor. Parking. 3 bathrooms. Semi furnished. Rent 45000.",
    fields: {
      ...base, area: "Pashan", rent: 45000, floor: 4, parking: "yes", bathrooms: 3, furnished: "semi",
    },
  },
  {
    id: AUNDH_ITI,
    title: "Aundh 3BHK, ITI Road",
    url: null,
    added_by: MEERA,
    raw_text:
      "Aundh ITI Road 3BHK, 2nd floor, lift, reserved parking. 3 bathrooms all attached, fully furnished, balcony. No gym. 15 min walk to metro? No. Rent 45,000.",
    fields: {
      ...base, area: "Aundh", rent: 45000, floor: 2, lift: "yes", parking: "yes", bathrooms: 3,
      attached_bathrooms: 3, furnished: "full", balcony: "yes", gym: "no", near_metro: "no",
    },
  },
  {
    id: BALEWADI,
    title: "Balewadi 3BHK, near Baner-Pashan Link Road",
    url: null,
    added_by: KAVITA,
    raw_text:
      "Balewadi 3BHK, 7th floor, 2 lifts, covered parking, 3 bathrooms (2 attached). Semi-furnished, balcony, clubhouse gym, 5 min to metro. Pets allowed. 48k/month.",
    fields: {
      ...base, area: "Balewadi", rent: 48000, floor: 7, lift: "yes", parking: "yes", bathrooms: 3,
      attached_bathrooms: 2, pet_friendly: "yes", furnished: "semi", balcony: "yes", gym: "yes", near_metro: "yes",
    },
  },
];

const cm = (listing_id: string, member_id: string, key: string, minutes: number, confirmed = true): ListingCheck => ({
  listing_id, kind: "commute", member_id, key, minutes, confirmed,
});

export const demoChecks: ListingCheck[] = [
  // Baner: Kavita's Hinjewadi commute is 75 min, 45 over her 30-min limit
  cm(BANER, RIYA, "Gym", 15), cm(BANER, RIYA, "Family", 15), cm(BANER, MEERA, "Office", 30), cm(BANER, KAVITA, "Office", 75),
  // Kothrud: more than 20 min from Riya's gym and family
  cm(KOTHRUD, RIYA, "Gym", 35), cm(KOTHRUD, RIYA, "Family", 40), cm(KOTHRUD, MEERA, "Office", 25), cm(KOTHRUD, KAVITA, "Office", 30),
  // 5th-floor walk-up: commutes are fine, the stairs are not
  cm(WALKUP, RIYA, "Gym", 10), cm(WALKUP, RIYA, "Family", 10), cm(WALKUP, MEERA, "Office", 25), cm(WALKUP, KAVITA, "Office", 30),
  // Pashan: lift unknown, and Meera hasn't confirmed her commute yet
  cm(PASHAN, RIYA, "Gym", 15), cm(PASHAN, RIYA, "Family", 15), cm(PASHAN, MEERA, "Office", 30, false), cm(PASHAN, KAVITA, "Office", 25),
  // Aundh ITI Road: qualifies
  cm(AUNDH_ITI, RIYA, "Gym", 5), cm(AUNDH_ITI, RIYA, "Family", 10), cm(AUNDH_ITI, MEERA, "Office", 20), cm(AUNDH_ITI, KAVITA, "Office", 30),
  // Balewadi: qualifies
  cm(BALEWADI, RIYA, "Gym", 20), cm(BALEWADI, RIYA, "Family", 18), cm(BALEWADI, MEERA, "Office", 35), cm(BALEWADI, KAVITA, "Office", 25),
];
