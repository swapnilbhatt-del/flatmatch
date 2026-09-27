"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FIELD_LABELS, type ListingFields } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { Icon } from "./ui";

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

/** A checkbox styled as a tappable pill. Ticking it submits the human confirmation. */
function ConfirmBox({ label, disabled: disabledProp, busy, onConfirm, full = false }: { label: string; disabled: boolean; busy: boolean; onConfirm: () => void; full?: boolean }) {
  const hydrated = useHydrated();
  const disabled = disabledProp || !hydrated;
  return (
    <label
      className={`${full ? "flex w-full" : "inline-flex"} min-h-12 cursor-pointer items-center gap-2 rounded-2xl border px-3.5 text-sm font-medium transition ${
        disabled ? "cursor-not-allowed border-amber-200 bg-white/50 text-amber-900/40" : "border-amber-300 bg-white text-amber-900 hover:bg-amber-100/50"
      }`}
    >
      <input type="checkbox" className="h-5 w-5 rounded accent-amber-600" checked={false} disabled={disabled || busy} onChange={onConfirm} />
      {busy ? "Saving…" : label}
    </label>
  );
}

/** Human checkpoint: "I confirmed my commute" for the current member only. */
export function ConfirmCommute({
  token,
  listingId,
  locKey,
  label,
  limit,
  estimate,
  mapsUrl,
}: {
  token: string;
  listingId: string;
  locKey: string;
  label: string;
  limit: number;
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

  const over = minutes !== "" && Number(minutes) > limit;

  return (
    <div className="checkpoint space-y-3">
      <div className="flex items-start gap-2">
        <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p>
          <strong>Your commute to {label}</strong>
          <span className="block text-amber-900/80">
            {estimate != null ? `Estimated ${estimate} min by whoever added it, not yet confirmed.` : "No estimate yet."} Your limit is{" "}
            {limit} min.
          </span>
        </p>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn min-w-0">
          <Icon name="pin" className="h-4 w-4 shrink-0" /> <span className="truncate">Google Maps</span>{" "}
          <Icon name="external" className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </a>
        <div className="relative">
          <input
            aria-label="Minutes"
            className={`input w-24 pr-11 text-center ${over ? "border-rose-300 text-rose-700" : ""}`}
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
            placeholder="?"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">min</span>
        </div>
        <div className="col-span-2">
          <ConfirmBox label="I confirmed my commute" disabled={!minutes} busy={busy} onConfirm={confirm} full />
        </div>
      </div>
      {error && <p className="text-rose-700">{error}</p>}
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

  const seg = (opts: { v: string; l: string }[]) => (
    <div className="inline-flex rounded-2xl border border-amber-200 bg-white p-1" role="radiogroup" aria-label={FIELD_LABELS[field]}>
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => setValue(o.v)}
          className={`min-h-10 rounded-xl px-3 text-sm font-medium transition ${value === o.v ? "bg-amber-600 text-white shadow-sm" : "text-amber-900 hover:bg-amber-50"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );

  const input = TRI.includes(field) ? (
    seg([
      { v: "yes", l: "Yes" },
      { v: "no", l: "No" },
    ])
  ) : field === "furnished" ? (
    seg([
      { v: "full", l: "Full" },
      { v: "semi", l: "Semi" },
      { v: "none", l: "None" },
    ])
  ) : (
    <input
      className="input w-28 border-amber-200"
      inputMode={field === "area" ? "text" : "numeric"}
      value={value}
      onChange={(e) => setValue(field === "area" ? e.target.value : e.target.value.replace(/\D/g, ""))}
      placeholder="?"
      aria-label={FIELD_LABELS[field]}
    />
  );

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-32 flex-1">
        <p className="font-medium">{FIELD_LABELS[field]}</p>
        {who?.length ? <p className="text-xs text-amber-900/70">Matters to {who.join(", ")}</p> : null}
      </div>
      {input}
      <ConfirmBox label="Verified" disabled={!value} busy={busy} onConfirm={verify} />
      {error && <p className="w-full text-sm text-rose-700">{error}</p>}
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
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={on}
        className={on ? "btn w-full border-brand-200 bg-brand-50 text-brand-800" : "btn-primary w-full"}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
        </svg>
        {busy ? "Saving…" : on ? "On the shortlist · tap to remove" : "Add to shortlist"}
      </button>
      {error && <p className="mt-1 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
