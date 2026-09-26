"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FIELD_LABELS, type ListingFields } from "@/lib/types";

async function post(url: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.error ?? "Couldn't save. Please try again.";
  } catch {
    return "Couldn't save. Check your connection and try again.";
  }
}

/** Human checkpoint: "I confirmed my commute" for the current member only. */
export function ConfirmCommute({
  token,
  listingId,
  locKey,
  label,
  estimate,
  mapsUrl,
}: {
  token: string;
  listingId: string;
  locKey: string;
  label: string;
  estimate: number | null;
  mapsUrl: string;
}) {
  const router = useRouter();
  const [minutes, setMinutes] = useState(estimate != null ? String(estimate) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    const err = await post("/api/commute/confirm", { token, listingId, key: locKey, minutes: Number(minutes) });
    setError(err);
    setBusy(false);
    if (!err) router.refresh();
  }

  return (
    <div className="checkpoint space-y-2">
      <p>
        <strong>Your commute:</strong> {label}
        {estimate != null ? `, estimated ${estimate} min (unverified)` : ", no estimate yet"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn">
          Check on Google Maps ↗
        </a>
        <input
          aria-label="Minutes"
          className="input w-20"
          inputMode="numeric"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
          placeholder="min"
        />
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="h-5 w-5 accent-amber-600" checked={false} disabled={busy || !minutes} onChange={confirm} />
          I confirmed my commute
        </label>
      </div>
      {error && <p className="text-red-700">{error}</p>}
    </div>
  );
}

const TRI = ["lift", "parking", "pet_friendly", "balcony", "gym", "near_metro"];

/** Human checkpoint: tick "Verified" on an unknown field once someone has confirmed the real value. */
export function VerifyField({
  token,
  listingId,
  field,
  who,
}: {
  token: string;
  listingId: string;
  field: keyof ListingFields;
  who?: string[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    setBusy(true);
    const v = TRI.includes(field) || field === "furnished" || field === "area" ? value : Number(value);
    const err = await post("/api/verify", { token, listingId, field, value: v });
    setError(err);
    setBusy(false);
    if (!err) router.refresh();
  }

  const input = TRI.includes(field) ? (
    <select className="input w-28" value={value} onChange={(e) => setValue(e.target.value)} aria-label={FIELD_LABELS[field]}>
      <option value="">?</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  ) : field === "furnished" ? (
    <select className="input w-36" value={value} onChange={(e) => setValue(e.target.value)} aria-label={FIELD_LABELS[field]}>
      <option value="">?</option>
      <option value="full">Fully</option>
      <option value="semi">Semi</option>
      <option value="none">Unfurnished</option>
    </select>
  ) : (
    <input
      className="input w-28"
      inputMode={field === "area" ? "text" : "numeric"}
      value={value}
      onChange={(e) => setValue(field === "area" ? e.target.value : e.target.value.replace(/\D/g, ""))}
      placeholder="?"
      aria-label={FIELD_LABELS[field]}
    />
  );

  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <span className="min-w-28 text-sm font-medium">
        ❓ {FIELD_LABELS[field]}
        {who?.length ? <span className="hint block font-normal">matters to {who.join(", ")}</span> : null}
      </span>
      {input}
      <label className="flex min-h-11 items-center gap-2 text-sm text-amber-900">
        <input type="checkbox" className="h-5 w-5 accent-amber-600" checked={false} disabled={busy || !value} onChange={verify} />
        Verified
      </label>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function ShortlistToggle({ token, listingId, on }: { token: string; listingId: string; on: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle() {
    setBusy(true);
    const err = await post("/api/shortlist", { token, listingId, on: !on });
    setError(err);
    setBusy(false);
    if (!err) router.refresh();
  }
  return (
    <div>
      <button type="button" onClick={toggle} disabled={busy} className={on ? "btn w-full border-teal-600 text-teal-800" : "btn-primary w-full"}>
        {on ? "★ Shortlisted (tap to remove)" : "☆ Add to shortlist"}
      </button>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
