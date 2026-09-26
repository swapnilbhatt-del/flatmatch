import { dbErrorResponse, rpc } from "@/lib/db";
import { bad, readJson, validToken } from "@/lib/http";
import { normalizeFieldValue } from "@/lib/validate";

// Human checkpoint: someone confirmed an unknown field (e.g. with the broker) and records the real value.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!validToken(body?.token)) return bad("Invalid link.");
  const listingId = String(body?.listingId ?? "");
  const field = String(body?.field ?? "");
  const value = normalizeFieldValue(field, body?.value);
  if (!listingId || value === null) return bad("Pick the confirmed value first.");
  try {
    await rpc("verify_field", { p_token: body.token, p_listing: listingId, p_field: field, p_value: { v: value } });
    return Response.json({ ok: true });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
