import { DbError, dbErrorResponse, getState } from "@/lib/db";
import { parseListing } from "@/lib/gemini";
import { bad, readJson, validToken } from "@/lib/http";

const MESSAGES = {
  not_configured: "AI auto-fill isn't set up here, so please fill in the details below by hand.",
  rate_limited: "The free AI quota is used up for now. No problem: fill in the details below by hand, or try again in a minute.",
  unavailable: "AI auto-fill didn't work this time. Please fill in the details below by hand.",
  no_text: "We don't open listing links. Paste the listing text to auto-fill, or fill in the details by hand.",
};

// Gemini step: pasted listing text → structured fields. Never throws to the client; always allows manual entry.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!validToken(body?.token)) return bad("Invalid link.");
  try {
    await getState(body.token); // token must belong to a group (protects the free quota)
  } catch (e) {
    if (e instanceof DbError && e.code === "invalid_token") return dbErrorResponse(e);
  }
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (text.length < 15) return Response.json({ ok: false, message: MESSAGES.no_text });
  const r = await parseListing(text);
  if (!r.ok) return Response.json({ ok: false, message: MESSAGES[r.reason] });
  return Response.json({ ok: true, fields: r.fields, title: r.title });
}
