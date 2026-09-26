"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PUNE_AREAS } from "@/lib/pune-areas";
import type { Constraints, KeyLocation, NiceToHaves } from "@/lib/types";
import { Icon, type IconName } from "./ui";

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

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 border-b border-stone-100 py-2 last:border-0">
      <span>
        <span className="block text-[15px] text-stone-800">{label}</span>
        {hint && <span className="hint block">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-8 w-14 shrink-0 rounded-full bg-stone-200 transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20 after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6" />
    </label>
  );
}

function Section({ n, icon, title, hint, children }: { n: number; icon: IconName; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card rise">
      <div className="mb-4 flex items-start gap-3">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon name={icon} />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand-700 ring-1 ring-brand-200">
            {n}
          </span>
        </span>
        <div>
          <h2 className="font-semibold text-stone-900">{title}</h2>
          {hint && <p className="hint mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
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
      <div className="checkpoint flex gap-3">
        <Icon name="lock" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <p>
          <strong>Private.</strong> The others can&apos;t see your answers until all three of you have submitted, so nobody
          anchors on anyone else. Answer for yourself.
        </p>
      </div>

      <Section n={1} icon="user" title="About you">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} autoComplete="given-name" />
          </div>
          <div>
            <label className="label" htmlFor="rent">Max rent you&apos;ll pay per month</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">₹</span>
              <input id="rent" className="input pl-8" inputMode="numeric" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} placeholder="16,000" required />
            </div>
            <p className="hint mt-1.5">Your share only. Each listing is checked as total rent ÷ 3.</p>
          </div>
        </div>
      </Section>

      <Section n={2} icon="pin" title="Where you need to get to" hint="One way, at the time you'd usually travel.">
        <div className="space-y-3">
          {locs.map((l, i) => (
            <div key={i} className="card-flat space-y-2 p-3">
              <div className="grid grid-cols-[1fr_1.5fr] gap-2">
                <input aria-label="What" className="input" value={l.label} onChange={(e) => setLoc(i, { label: e.target.value })} placeholder="Office" />
                <input aria-label="Where" className="input" value={l.place} onChange={(e) => setLoc(i, { place: e.target.value })} placeholder="Hinjewadi Phase 1" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-500">Max</span>
                <input aria-label="Max minutes" className="input w-20 text-center" inputMode="numeric" value={l.max_minutes} onChange={(e) => setLoc(i, { max_minutes: e.target.value })} />
                <span className="flex-1 text-sm text-stone-500">minutes</span>
                <button type="button" className="btn-ghost text-stone-500" aria-label="Remove location" onClick={() => setLocs((xs) => xs.filter((_, j) => j !== i))}>
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {locs.length < 5 && (
            <button type="button" className="btn w-full border-dashed" onClick={() => setLocs((xs) => [...xs, { label: "", place: "", max_minutes: "20" }])}>
              <Icon name="plus" className="h-4 w-4" /> Add a place (gym, family, college…)
            </button>
          )}
        </div>
      </Section>

      <Section n={3} icon="shield" title="Dealbreakers" hint="A flat that breaks any of these is ruled out, and the reason shows your name.">
        <Toggle label="Lift required" checked={lift} onChange={setLift} />
        <Toggle label="Parking required" checked={parking} onChange={setParking} />
        <Toggle label="Pet-friendly required" checked={pets} onChange={setPets} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="minbath">Min bathrooms</label>
            <input id="minbath" className="input" inputMode="numeric" value={minBath} onChange={(e) => setMinBath(e.target.value)} placeholder="Any" />
          </div>
          <div>
            <label className="label" htmlFor="maxfloor">Max floor without lift</label>
            <input id="maxfloor" className="input" inputMode="numeric" value={maxFloor} onChange={(e) => setMaxFloor(e.target.value)} placeholder="Any" />
            <p className="hint mt-1">0 = ground floor only</p>
          </div>
        </div>
      </Section>

      <Section n={4} icon="x" title="Areas you won't consider" hint="Tap to rule an area out.">
        <div className="flex flex-wrap gap-2">
          {PUNE_AREAS.map((a) => {
            const on = noGo.includes(a);
            return (
              <button
                type="button"
                key={a}
                onClick={() => toggleArea(a)}
                aria-pressed={on}
                className={`chip ${on ? "border-rose-300 bg-rose-50 font-medium text-rose-800" : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"}`}
              >
                {on && <Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.6} />}
                {a}
              </button>
            );
          })}
        </div>
        <label className="label mt-4" htmlFor="nogo-other">Somewhere else?</label>
        <input id="nogo-other" className="input" value={noGoOther} onChange={(e) => setNoGoOther(e.target.value)} placeholder="Lohegaon, Moshi (comma-separated)" />
      </Section>

      <Section n={5} icon="heart" title="Nice-to-haves" hint="Things you'd prefer but could live without. These never rule a flat out.">
        {NICE.map((n) => (
          <Toggle key={n.key} label={n.label} checked={!!nice[n.key]} onChange={(v) => setNice((x) => ({ ...x, [n.key]: v }))} />
        ))}
        <label className="label mt-4" htmlFor="nice-other">Anything else?</label>
        <input id="nice-other" className="input" value={niceOther} onChange={(e) => setNiceOther(e.target.value)} placeholder="Quiet street, good light (comma-separated)" />
        <p className="hint mt-1.5">Free-text wishes can&apos;t be checked automatically. They show up as &ldquo;check yourself&rdquo;.</p>
      </Section>

      {error && (
        <p className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-800">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </p>
      )}
      <div className="sticky bottom-20 z-10 sm:bottom-4">
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : "Submit my form"}
          {!busy && <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />}
        </button>
      </div>
    </form>
  );
}
