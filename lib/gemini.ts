// Server-only. Gemini is used for ONE thing: turning pasted listing text into structured JSON.
// Any failure (no key, rate limit, timeout, bad JSON) returns a reason; the UI falls back to manual entry.

import { ApiError, GoogleGenAI } from "@google/genai";
import { normalizeFields } from "./validate";
import type { ListingFields } from "./types";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

export type ParseResult =
  | { ok: true; fields: ListingFields; title: string }
  | { ok: false; reason: "not_configured" | "rate_limited" | "unavailable" };

const tri = { type: "string", enum: ["yes", "no", "unknown"] };
const num = { type: "string", description: 'digits only, or "unknown"' };

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "short title, e.g. 'Baner 3BHK, 3rd floor'" },
    area: { type: "string", description: 'Pune locality, or "unknown"' },
    rent: { ...num, description: 'total monthly rent in ₹ as digits (48k → 48000); not deposit; or "unknown"' },
    bhk: num,
    floor: { ...num, description: 'floor number, ground = 0, or "unknown"' },
    lift: tri,
    parking: tri,
    bathrooms: num,
    attached_bathrooms: { ...num, description: 'number of bedrooms with attached bathroom, or "unknown"' },
    pet_friendly: tri,
    furnished: { type: "string", enum: ["full", "semi", "none", "unknown"] },
    balcony: tri,
    gym: { ...tri, description: "gym in the building/society" },
    near_metro: tri,
  },
  required: [
    "title", "area", "rent", "bhk", "floor", "lift", "parking", "bathrooms", "attached_bathrooms",
    "pet_friendly", "furnished", "balcony", "gym", "near_metro",
  ],
};

const PROMPT =
  'Extract fields from this Pune rental listing. Use "unknown" for anything not clearly and explicitly stated. ' +
  "Never guess or infer (e.g. do not assume a lift or parking). Listing:\n\n";

export async function parseListing(text: string): Promise<ParseResult> {
  // Keys never contain whitespace; strip any that sneaked in when pasting (e.g. a line break).
  const apiKey = process.env.GEMINI_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) return { ok: false, reason: "not_configured" };
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model,
      contents: PROMPT + text.slice(0, 4000),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: SCHEMA,
        temperature: 0,
        maxOutputTokens: 1024,
        abortSignal: AbortSignal.timeout(15000),
      },
    });
    const raw = JSON.parse(res.text ?? "");
    const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim().slice(0, 80) : "";
    return { ok: true, fields: normalizeFields(raw), title };
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) return { ok: false, reason: "rate_limited" };
    // Never log the raw error message: SDK errors can echo request headers, including the API key.
    console.error("Gemini parse failed:", e instanceof ApiError ? `HTTP ${e.status}` : e instanceof Error ? e.name : "unknown error");
    return { ok: false, reason: "unavailable" };
  }
}
