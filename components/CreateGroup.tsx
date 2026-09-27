"use client";

import { useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { CopyShare } from "./CopyShare";
import { Avatar, Icon } from "./ui";

export function CreateGroup() {
  const hydrated = useHydrated();
  const [name, setName] = useState("");
  const [tokens, setTokens] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the group.");
      setTokens(data.tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the group.");
    } finally {
      setBusy(false);
    }
  }

  if (tokens) {
    const origin = window.location.origin;
    return (
      <div className="space-y-3 rise">
        <div className="checkpoint flex gap-3">
          <Icon name="lock" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p>
            <strong>Each link is someone&apos;s key.</strong> Keep yours and send one to each friend <em>privately</em>,
            not in the group chat. <strong>Save them now:</strong> they won&apos;t be shown again.
          </p>
        </div>
        {tokens.map((t, i) => {
          const url = `${origin}/g/${t}`;
          return (
            <div key={t} className="card-flat space-y-3 bg-white">
              <div className="flex items-center gap-3">
                <Avatar name={String(i + 1)} index={i} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Person {i + 1}{i === 0 ? " · you" : ""}</p>
                  <p className="truncate font-mono text-xs text-stone-500">{url}</p>
                </div>
                <a className="btn-ghost" href={url}>
                  Open <Icon name="arrow" className="h-4 w-4" />
                </a>
              </div>
              <CopyShare url={url} shareText="Here's your private link for our flat hunt. Fill in your form on your own:" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <form onSubmit={create}>
      <fieldset disabled={!hydrated} className="relative space-y-3">
      <div>
        <label className="label" htmlFor="gname">
          Group name <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <input id="gname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pune flat hunt" maxLength={60} />
      </div>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Creating…" : "Create group & get 3 links"}
        {!busy && <Icon name="arrow" className="h-4 w-4" />}
      </button>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      </fieldset>
    </form>
  );
}
