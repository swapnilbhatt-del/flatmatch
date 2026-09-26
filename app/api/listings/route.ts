import { dbErrorResponse, getState, rpc } from "@/lib/db";
import { bad, readJson, validToken } from "@/lib/http";
import { normalizeFields } from "@/lib/validate";

// Human checkpoint: the person adding the listing has reviewed/corrected the fields and entered commute estimates.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!validToken(body?.token)) return bad("Invalid link.");
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  if (!title) return bad("Give the listing a short title.");
  let url = typeof body?.url === "string" ? body.url.trim().slice(0, 500) : "";
  if (url && !/^https?:\/\//i.test(url)) url = "";
  const raw = typeof body?.raw_text === "string" ? body.raw_text.slice(0, 4000) : "";
  const fields = normalizeFields(body?.fields);

  const commutes = (Array.isArray(body?.commutes) ? body.commutes : [])
    .map((c: Record<string, unknown>) => ({
      member_id: String(c?.member_id ?? ""),
      key: String(c?.key ?? "").slice(0, 30),
      minutes: Number(c?.minutes),
    }))
    .filter((c) => c.member_id && c.key && Number.isInteger(c.minutes) && c.minutes >= 0 && c.minutes < 1000);
  const confirmOwn: string[] = Array.isArray(body?.confirm_own) ? body.confirm_own.map(String) : [];

  try {
    const id = await rpc<string>("add_listing", {
      p_token: body.token,
      p_title: title,
      p_url: url,
      p_raw: raw,
      p_fields: fields,
      p_commutes: commutes,
    });
    // She may tick "I confirmed my commute" for her own rows while adding.
    const me = confirmOwn.length ? (await getState(body.token)).me.member_id : null;
    for (const key of confirmOwn) {
      const own = commutes.find((c) => c.key === key && c.member_id === me);
      if (own) await rpc("confirm_commute", { p_token: body.token, p_listing: id, p_key: key, p_minutes: own.minutes });
    }
    return Response.json({ ok: true, id });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
