"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PUNE_AREAS } from "@/lib/pune-areas";
import type { Constraints, KeyLocation, NiceToHaves } from "@/lib/types";

const NICE: { key: keyof NiceToHaves; label: string }[] = [
  { key: "furnished", label: "Furnished" },
  { key: "balcony", label: "Balcony" },
  { key: "gym", label: "Gym in building" },
  { key: "near_metro", label: "Near metro" },
  { key: "attached_bathroom", label: "Attached bathroom for me" },
];

const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 border-b border-stone-100 py-1 last:border-0">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-2 text-xs text-stone-500">
        {checked ? "Yes" : "No"}
        <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="relative h-7 w-12 rounded-full bg-stone-300 transition peer-checked:bg-teal-600 peer-focus-visible:ring-2 peer-focus-visible:ring-teal-600/40 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
      </span>
    </label>
  );
}

export function ConstraintForm({ token, initial }: { token: string; initial: Constraints | null }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [maxRent, setMaxRent] = useState(initial?.max_rent ? String(initial.max_rent) : "");
  const known = new Set(PUNE_AREAS);
  const [noGo, setNoGo] = useState<string[]>(initial?.no_go_areas.filter((a) => known.has(a)) ?? []);
  const [noGoOther, setNoGoOther] = useState(initial?.no_go_areas.filter((a) => !known.has(a)).join(", ") ?? "");
  const [locs, setLocs] = useState<{ label: string; place: string; max_minutes: string }[]>(
    initial?.key_locations.length
      ? initial.key_locations.map((l) => ({ ...l, max_minutes: String(l.max_minutes) }))
      : [{ label: "Office", place: "", max_minutes: "30" }],
  );
  const [lift, setLift] = useState(initial?.lift_required ?? false);
  const [parking, setParking] = useState(initial?.parking_required ?? false);
  const [pets, setPets] = useState(initial?.pet_friendly_required ?? false);
  const [minBath, setMinBath] = useState(initial?.min_bathrooms != null ? String(initial.min_bathrooms) : "");
  const [maxFloor, setMaxFloor] = useState(initial?.max_floor_without_lift != null ? String(initial.max_floor_without_lift) : "");
  const [nice, setNice] = useState<NiceToHaves>(initial?.nice_to_haves ?? {});
  const [niceOther, setNiceOther] = useState(initial?.nice_to_have_other.join(", ") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleArea = (a: string) => setNoGo((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));
  const setLoc = (i: number, patch: Partial<(typeof locs)[number]>) =>
    setLocs((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const key_locations: KeyLocation[] = locs
      .filter((l) => l.label.trim() || l.place.trim())
      .map((l) => ({ label: l.label.trim(), place: l.place.trim(), max_minutes: Number(l.max_minutes) }));
    if (key_locations.some((l) => !l.label || !l.place || !(l.max_minutes > 0))) {
      setError("Each key location needs a label, a place and a max commute in minutes.");
      setBusy(false);
      return;
    }
    const data = {
      name,
      max_rent: Number(maxRent.replace(/[,\s₹]/g, "")),
      no_go_areas: [...noGo, ...splitList(noGoOther)],
      key_locations,
      lift_required: lift,
      parking_required: parking,
      pet_friendly_required: pets,
      min_bathrooms: minBath === "" ? null : Number(minBath),
      max_floor_without_lift: maxFloor === "" ? null : Number(maxFloor),
      nice_to_haves: nice,
      nice_to_have_other: splitList(niceOther),
    };
    try {
      const res = await fetch("/api/constraints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, data }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error ?? "Couldn't save.");
      router.push(`/g/${token}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="checkpoint">
        🔒 <strong>Private.</strong> The others can&apos;t see your answers until all three of you have submitted, so
        nobody anchors on anyone else. Answer for yourself.
      </p>

      <section className="card space-y-3">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />
        </div>
        <div>
          <label className="label" htmlFor="rent">Max rent contribution per month (₹)</label>
          <input id="rent" className="input" inputMode="numeric" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} placeholder="16000" required />
          <p className="hint mt-1">Your share. Listings are checked as total rent ÷ 3.</p>
        </div>
      </section>

      <section className="card">
        <h2 className="label">Areas I won&apos;t consider</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {PUNE_AREAS.map((a) => {
            const on = noGo.includes(a);
            return (
              <button
                type="button"
                key={a}
                onClick={() => toggleArea(a)}
                aria-pressed={on}
                className={`chip ${on ? "border-red-300 bg-red-50 text-red-800" : "border-stone-200 bg-white text-stone-700"}`}
              >
                {on ? "✕ " : ""}
                {a}
              </button>
            );
          })}
        </div>
        <label className="label mt-3" htmlFor="nogo-other">Other areas (comma-separated)</label>
        <input id="nogo-other" className="input" value={noGoOther} onChange={(e) => setNoGoOther(e.target.value)} placeholder="e.g. Lohegaon, Moshi" />
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="label">Key locations & max commute (one way)</h2>
          <p className="hint">e.g. Office · Hinjewadi · 30 min, or Gym · Viman Nagar · 20 min</p>
        </div>
        {locs.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.4fr_5rem_auto] items-end gap-2">
            <div>
              <label className="hint" htmlFor={`ll${i}`}>What</label>
              <input id={`ll${i}`} className="input" value={l.label} onChange={(e) => setLoc(i, { label: e.target.value })} placeholder="Office" />
            </div>
            <div>
              <label className="hint" htmlFor={`lp${i}`}>Where</label>
              <input id={`lp${i}`} className="input" value={l.place} onChange={(e) => setLoc(i, { place: e.target.value })} placeholder="Hinjewadi Phase 1" />
            </div>
            <div>
              <label className="hint" htmlFor={`lm${i}`}>Max min</label>
              <input id={`lm${i}`} className="input" inputMode="numeric" value={l.max_minutes} onChange={(e) => setLoc(i, { max_minutes: e.target.value })} />
            </div>
            <button type="button" className="btn px-3" aria-label="Remove location" onClick={() => setLocs((xs) => xs.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        {locs.length < 5 && (
          <button type="button" className="btn w-full" onClick={() => setLocs((xs) => [...xs, { label: "", place: "", max_minutes: "20" }])}>
            + Add a location
          </button>
        )}
      </section>

      <section className="card">
        <h2 className="label">Hard requirements (dealbreakers)</h2>
        <p className="hint mb-2">A flat that breaks any of these is ruled out, with your name on the reason.</p>
        <Toggle label="Lift required" checked={lift} onChange={setLift} />
        <Toggle label="Parking required" checked={parking} onChange={setParking} />
        <Toggle label="Pet-friendly required" checked={pets} onChange={setPets} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="minbath">Min bathrooms</label>
            <input id="minbath" className="input" inputMode="numeric" value={minBath} onChange={(e) => setMinBath(e.target.value)} placeholder="No minimum" />
          </div>
          <div>
            <label className="label" htmlFor="maxfloor">Max floor without lift</label>
            <input id="maxfloor" className="input" inputMode="numeric" value={maxFloor} onChange={(e) => setMaxFloor(e.target.value)} placeholder="No limit" />
            <p className="hint mt-1">0 = ground floor only</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="label">Nice-to-haves (I&apos;d prefer, but could live without)</h2>
        {NICE.map((n) => (
          <Toggle key={n.key} label={n.label} checked={!!nice[n.key]} onChange={(v) => setNice((x) => ({ ...x, [n.key]: v }))} />
        ))}
        <label className="label mt-3" htmlFor="nice-other">Anything else? (comma-separated)</label>
        <input id="nice-other" className="input" value={niceOther} onChange={(e) => setNiceOther(e.target.value)} placeholder="e.g. quiet street, good natural light" />
        <p className="hint mt-1">These can&apos;t be checked automatically, so they&apos;ll show as &ldquo;check yourself&rdquo;.</p>
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : initial ? "Save changes" : "Submit my form"}
      </button>
    </form>
  );
}
