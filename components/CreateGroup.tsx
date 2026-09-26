"use client";

import { useState } from "react";
import { CopyShare } from "./CopyShare";

export function CreateGroup() {
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
      <div className="space-y-3">
        <p className="text-sm text-stone-700">
          Here are 3 personal links, <strong>one per person</strong>. Keep yours and send one each to the other two.
          The link <em>is</em> the login, so don&apos;t post them in the group chat. Send each one privately.
          <strong> Save these now:</strong> they won&apos;t be shown again.
        </p>
        {tokens.map((t, i) => {
          const url = `${origin}/g/${t}`;
          return (
            <div key={t} className="card space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Person {i + 1}{i === 0 ? " (you)" : ""}</span>
                <a className="text-sm text-teal-700 underline" href={url}>
                  Open
                </a>
              </div>
              <p className="break-all font-mono text-xs text-stone-500">{url}</p>
              <CopyShare url={url} shareText="Here's your private link for our flat hunt. Fill in your form on your own:" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <form onSubmit={create} className="space-y-3">
      <div>
        <label className="label" htmlFor="gname">
          Group name (optional)
        </label>
        <input id="gname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pune flat hunt" maxLength={60} />
      </div>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Creating…" : "Create group & get 3 links"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
