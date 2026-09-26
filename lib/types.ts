// Shared types. "unknown" is a first-class value: it is never treated as a pass.

export const UNKNOWN = "unknown" as const;
export type Unknown = typeof UNKNOWN;

export type Tri = "yes" | "no" | Unknown;
export type Num = number | Unknown;
export type Furnishing = "full" | "semi" | "none" | Unknown;

export interface ListingFields {
  area: string | Unknown;
  rent: Num; // total monthly rent for the flat, ₹
  bhk: Num;
  floor: Num; // 0 = ground
  lift: Tri;
  parking: Tri;
  bathrooms: Num;
  attached_bathrooms: Num; // bedrooms with an attached bathroom
  pet_friendly: Tri;
  furnished: Furnishing;
  balcony: Tri;
  gym: Tri; // gym in the building / society
  near_metro: Tri;
}

export const FIELD_LABELS: Record<keyof ListingFields, string> = {
  area: "Area",
  rent: "Rent",
  bhk: "BHK",
  floor: "Floor",
  lift: "Lift",
  parking: "Parking",
  bathrooms: "Bathrooms",
  attached_bathrooms: "Attached bathrooms",
  pet_friendly: "Pet-friendly",
  furnished: "Furnished",
  balcony: "Balcony",
  gym: "Gym in building",
  near_metro: "Near metro",
};

export const FIELD_KEYS = Object.keys(FIELD_LABELS) as (keyof ListingFields)[];

export interface KeyLocation {
  label: string; // "Office"
  place: string; // "Hinjewadi"
  max_minutes: number;
}

export interface NiceToHaves {
  furnished?: boolean;
  balcony?: boolean;
  gym?: boolean;
  near_metro?: boolean;
  attached_bathroom?: boolean;
}

export interface Constraints {
  member_id: string;
  name: string;
  max_rent: number;
  no_go_areas: string[];
  key_locations: KeyLocation[];
  lift_required: boolean;
  parking_required: boolean;
  pet_friendly_required: boolean;
  min_bathrooms: number | null;
  max_floor_without_lift: number | null;
  nice_to_haves: NiceToHaves;
  nice_to_have_other: string[];
}

export interface Listing {
  id: string;
  title: string;
  url: string | null;
  added_by: string | null;
  fields: ListingFields;
  created_at?: string;
}

export interface ListingCheck {
  listing_id: string;
  kind: "commute" | "field";
  member_id: string | null;
  key: string;
  minutes: number | null;
  confirmed: boolean;
}

export interface GroupState {
  me: { member_id: string; slot: number };
  group: { id: string; name: string };
  submitted_count: number;
  unlocked: boolean;
  my_constraints: Constraints | null;
  constraints: Constraints[];
  listings: Listing[];
  checks: ListingCheck[];
  shortlist: { listing_id: string; added_by: string | null }[];
}
