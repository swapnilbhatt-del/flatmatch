// Server-only Supabase access. Env vars have no NEXT_PUBLIC_ prefix, so they never reach the browser.
// Every call goes through a token-checked Postgres function (see supabase/schema.sql).

import { createClient } from "@supabase/supabase-js";
import type { GroupState } from "./types";

export type DbErrorCode = "not_configured" | "missing_schema" | "invalid_token" | "locked" | "not_found" | "unreachable" | "failed";

export class DbError extends Error {
  constructor(public code: DbErrorCode, message?: string) {
    super(message ?? code);
  }
}

function client() {
  // Strip whitespace that can sneak in when pasting values into the Vercel dashboard.
  const url = process.env.SUPABASE_URL?.replace(/\s+/g, "");
  const key = process.env.SUPABASE_ANON_KEY?.replace(/\s+/g, "");
  if (!url || !key) throw new DbError("not_configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  let res;
  try {
    res = await client().rpc(fn, args);
  } catch (e) {
    if (e instanceof DbError) throw e;
    // Only keep the error name: network errors can echo request headers (which carry the key).
    throw new DbError("unreachable", e instanceof Error ? e.name : "network error");
  }
  const { data, error } = res;
  if (error) {
    const m = error.message ?? "";
    for (const code of ["invalid_token", "locked", "not_found"] as const) {
      if (m.includes(code)) throw new DbError(code);
    }
    // Connected, but schema.sql hasn't been run (PostgREST can't find the functions).
    if (error.code === "PGRST202" || /could not find the function/i.test(m)) throw new DbError("missing_schema", m);
    // A paused free-tier project usually surfaces as a network/fetch failure.
    if (/fetch failed|ENOTFOUND|ECONNREFUSED|timeout/i.test(m)) throw new DbError("unreachable", m);
    throw new DbError("failed", m);
  }
  return data as T;
}

export const getState = (token: string) => rpc<GroupState>("get_state", { p_token: token });

export function dbErrorResponse(e: unknown) {
  const code: DbErrorCode = e instanceof DbError ? e.code : "failed";
  const status = code === "invalid_token" ? 404 : code === "locked" ? 403 : code === "not_found" ? 404 : 500;
  const message = {
    not_configured: "The database isn't configured yet (SUPABASE_URL / SUPABASE_ANON_KEY).",
    missing_schema: "The database is connected but not set up. Run supabase/schema.sql, then seed.sql, in the Supabase SQL Editor.",
    invalid_token: "This personal link isn't valid.",
    locked: "This unlocks once all three of you have submitted your forms.",
    not_found: "That listing wasn't found in your group.",
    unreachable: "Couldn't reach the database. If this is a free Supabase project it may be paused. See the README.",
    failed: "Something went wrong saving that. Please try again.",
  }[code];
  if (code === "failed" || code === "unreachable" || code === "missing_schema") console.error(e);
  return Response.json({ error: message, code }, { status });
}
