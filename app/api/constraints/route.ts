import { dbErrorResponse, rpc } from "@/lib/db";
import { bad, readJson, validToken } from "@/lib/http";
import { normalizeConstraints } from "@/lib/validate";

// Human checkpoint: a member submits her own private constraint form.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!validToken(body?.token)) return bad("Invalid link.");
  const parsed = normalizeConstraints(body?.data);
  if (!parsed.ok) return bad(parsed.error);
  try {
    await rpc("submit_constraints", { p_token: body.token, p_data: parsed.data });
    return Response.json({ ok: true });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
