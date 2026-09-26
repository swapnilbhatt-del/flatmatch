import { notFound } from "next/navigation";
import { DbError, getState } from "./db";
import type { GroupState } from "./types";

export type Loaded = { state: GroupState; error?: undefined } | { state?: undefined; error: string };

/** Load a member's view for a page. Invalid tokens → 404; database problems → friendly message. */
export async function loadState(token: string): Promise<Loaded> {
  try {
    return { state: await getState(token) };
  } catch (e) {
    if (e instanceof DbError && e.code === "invalid_token") notFound();
    if (e instanceof DbError && e.code === "not_configured")
      return { error: "The database isn't set up yet. Add SUPABASE_URL and SUPABASE_ANON_KEY (see README)." };
    if (e instanceof DbError && e.code === "missing_schema")
      return {
        error:
          "The database is connected but its tables aren't set up yet. In Supabase → SQL Editor, run supabase/schema.sql, then supabase/seed.sql (see README), then reload.",
      };
    console.error(e);
    return {
      error:
        "Couldn't reach the database. If this runs on a free Supabase project it may have been paused for inactivity. Restore it from the Supabase dashboard (see README), then reload.",
    };
  }
}
