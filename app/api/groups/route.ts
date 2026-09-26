import { dbErrorResponse, rpc } from "@/lib/db";
import { readJson } from "@/lib/http";

// Create a group → 3 personal link tokens.
export async function POST(req: Request) {
  const body = await readJson(req);
  const name = typeof body?.name === "string" ? body.name.slice(0, 60) : "";
  try {
    const data = await rpc<{ group_id: string; tokens: string[] }>("create_group", { p_name: name });
    return Response.json({ tokens: data.tokens });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
