import { dbErrorResponse, getState, rpc } from "@/lib/db";
import { bad, readJson, validToken } from "@/lib/http";
import { checkListing } from "@/lib/matching";

// Any member can shortlist a listing, but only if it currently qualifies for all three.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!validToken(body?.token)) return bad("Invalid link.");
  const listingId = String(body?.listingId ?? "");
  const on = body?.on === true;
  try {
    if (on) {
      const s = await getState(body.token);
      const listing = s.listings.find((l) => l.id === listingId);
      if (!listing) return bad("Listing not found.", 404);
      if (checkListing(listing, s.constraints, s.checks).status !== "qualifies")
        return bad("Only listings that qualify for all three can be shortlisted.");
    }
    await rpc("set_shortlist", { p_token: body.token, p_listing: listingId, p_on: on });
    return Response.json({ ok: true });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
