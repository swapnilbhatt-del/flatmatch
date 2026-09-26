import { dbErrorResponse, rpc } from "@/lib/db";
import { bad, readJson, validToken } from "@/lib/http";

// Human checkpoint: a member confirms (or corrects) HER OWN commute estimate.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!validToken(body?.token)) return bad("Invalid link.");
  const listingId = String(body?.listingId ?? "");
  const key = String(body?.key ?? "").slice(0, 30);
  const minutes = Number(body?.minutes);
  if (!listingId || !key || !Number.isInteger(minutes) || minutes < 0 || minutes >= 1000)
    return bad("Enter your commute in whole minutes.");
  try {
    await rpc("confirm_commute", { p_token: body.token, p_listing: listingId, p_key: key, p_minutes: minutes });
    return Response.json({ ok: true });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
