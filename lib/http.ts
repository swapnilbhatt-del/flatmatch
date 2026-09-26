// Small helpers for the API route handlers.

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function validToken(t: unknown): t is string {
  return typeof t === "string" && /^[a-z0-9-]{8,64}$/.test(t);
}

export const bad = (error: string, status = 400) => Response.json({ error }, { status });
