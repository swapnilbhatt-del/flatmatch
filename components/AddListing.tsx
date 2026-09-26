"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mapsDirectionsUrl } from "@/lib/maps";
import { FIELD_LABELS, UNKNOWN, type ListingFields } from "@/lib/types";
import { emptyFields } from "@/lib/validate";

export interface PersonLocations {
  member_id: string;
  name: string;
  key_locations: { label: string; place: string; max_minutes: number }[];
}

type Stage = "paste" | "edit";

const TRI_FIELDS = ["lift", "parking", "pet_friendly", "balcony", "gym", "near_metro"] as const;
const NUM_FIELDS = ["rent", "bhk", "floor", "bathrooms", "attached_bathrooms"] as const;

export function AddListing({ token, meId, people }: { token: string; meId: string; people: PersonLocations[] }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<ListingFields>(emptyFields());
  const [aiFilled, setAiFilled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<Record<string, string>>({});
  const [confirmOwn, setConfirmOwn] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ListingFields>(k: K, v: ListingFields[K]) => setFields((f) => ({ ...f, [k]: v }));

  async function autofill() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/listings/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setFields(data.fields);
        setTitle(data.title || "");
        setAiFilled(true);
      } else {
        setFields(emptyFields());
        setAiFilled(false);
        setNotice(data.message ?? data.error ?? "AI auto-fill didn't work this time. Please fill in the details by hand.");
      }
    } catch {
      setNotice("AI auto-fill didn't work this time. Please fill in the details by hand.");
    } finally {
      setBusy(false);
      setStage("edit");
    }
  }

  function manual() {
    setFields(emptyFields());
    setAiFilled(false);
    setNotice(null);
    setStage("edit");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const commutes = people.flatMap((p) =>
      p.key_locations
        .map((l) => ({ member_id: p.member_id, key: l.label, minutes: minutes[`${p.member_id}:${l.label}`] }))
        .filter((c) => c.minutes !== undefined && c.minutes.trim() !== "")
        .map((c) => ({ ...c, minutes: Number(c.minutes) })),
    );
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title,
          url,
          raw_text: text,
          fields,
          commutes,
          confirm_own: Object.keys(confirmOwn).filter((k) => confirmOwn[k]),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the listing.");
      router.push(`/g/${token}/results#l-${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the listing.");
      setBusy(false);
    }
  }

  if (stage === "paste") {
    return (
      <div className="space-y-4">
        <section className="card space-y-3">
          <div>
            <label className="label" htmlFor="text">Paste the listing text</label>
            <textarea
              id="text"
              className="input min-h-40 py-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Copy the description from NoBroker / MagicBricks / WhatsApp and paste it here…"
            />
          </div>
          <div>
            <label className="label" htmlFor="url">Listing link (optional)</label>
            <input id="url" className="input" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            <p className="hint mt-1">Saved for reference only. We don&apos;t open or scrape links.</p>
          </div>
          <button type="button" className="btn-primary w-full" onClick={autofill} disabled={busy || text.trim().length < 15}>
            {busy ? "Reading the listing…" : "✨ Auto-fill from text"}
          </button>
          <button type="button" className="btn w-full" onClick={manual} disabled={busy}>
            Fill in by hand instead
          </button>
        </section>
      </div>
    );
  }

  const unk = (k: keyof ListingFields) => fields[k] === UNKNOWN;
  const fieldCls = (k: keyof ListingFields) => (unk(k) ? "border-amber-300 bg-amber-50" : "");
  const area = fields.area !== UNKNOWN ? fields.area : title;

  return (
    <form onSubmit={save} className="space-y-4">
      {notice && <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">{notice}</p>}
      <p className="checkpoint">
        👀 <strong>Check every field before saving.</strong>{" "}
        {aiFilled ? "These were filled in by AI from the text and may be wrong. " : ""}
        Leave anything the listing doesn&apos;t clearly say as <em>Unknown</em>. Unknown fields are highlighted, and
        they&apos;ll be flagged for verification, never treated as a pass.
      </p>

      <section className="card space-y-3">
        <div>
          <label className="label" htmlFor="title">Short title</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} placeholder="Baner 3BHK, 3rd floor" />
        </div>
        <div>
          <label className="label" htmlFor="area">{FIELD_LABELS.area}</label>
          <input
            id="area"
            className={`input ${fieldCls("area")}`}
            value={fields.area === UNKNOWN ? "" : fields.area}
            onChange={(e) => set("area", e.target.value.trim() ? e.target.value : UNKNOWN)}
            placeholder="Unknown"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {NUM_FIELDS.map((k) => (
            <div key={k}>
              <label className="label" htmlFor={k}>
                {FIELD_LABELS[k]}
                {k === "rent" ? " (₹/month, total)" : ""}
              </label>
              <input
                id={k}
                className={`input ${fieldCls(k)}`}
                inputMode="numeric"
                value={fields[k] === UNKNOWN ? "" : String(fields[k])}
                onChange={(e) => {
                  const v = e.target.value.replace(/[,\s₹]/g, "");
                  set(k, /^\d+$/.test(v) ? Number(v) : UNKNOWN);
                }}
                placeholder="Unknown"
              />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="furnished">{FIELD_LABELS.furnished}</label>
            <select
              id="furnished"
              className={`input ${fieldCls("furnished")}`}
              value={fields.furnished}
              onChange={(e) => set("furnished", e.target.value as ListingFields["furnished"])}
            >
              <option value="unknown">Unknown</option>
              <option value="full">Fully furnished</option>
              <option value="semi">Semi-furnished</option>
              <option value="none">Unfurnished</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TRI_FIELDS.map((k) => (
            <div key={k}>
              <label className="label" htmlFor={k}>{FIELD_LABELS[k]}</label>
              <select id={k} className={`input ${fieldCls(k)}`} value={fields[k]} onChange={(e) => set(k, e.target.value as "yes" | "no" | "unknown")}>
                <option value="unknown">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="font-semibold">Commute estimates</h2>
          <p className="hint">
            Tap &ldquo;Check on Google Maps&rdquo;, then type the minutes (one way, at the time she&apos;d travel). Each estimate stays{" "}
            <strong>unverified</strong> until that person confirms it herself.
          </p>
        </div>
        {people.map((p) =>
          p.key_locations.map((l) => {
            const k = `${p.member_id}:${l.label}`;
            const mine = p.member_id === meId;
            return (
              <div key={k} className="rounded-xl border border-stone-200 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {p.name}: {l.label} ({l.place})
                  </span>
                  <span className="hint whitespace-nowrap">limit {l.max_minutes} min</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    className="btn flex-1 text-teal-800"
                    href={mapsDirectionsUrl(area || "Pune", l.place)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Check on Google Maps ↗
                  </a>
                  <input
                    aria-label={`Minutes for ${p.name} to ${l.label}`}
                    className="input w-24"
                    inputMode="numeric"
                    placeholder="min"
                    value={minutes[k] ?? ""}
                    onChange={(e) => setMinutes((m) => ({ ...m, [k]: e.target.value.replace(/\D/g, "") }))}
                  />
                </div>
                {mine ? (
                  <label className="mt-2 flex items-center gap-2 text-sm text-amber-900">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-amber-600"
                      checked={!!confirmOwn[l.label]}
                      onChange={(e) => setConfirmOwn((c) => ({ ...c, [l.label]: e.target.checked }))}
                      disabled={!minutes[k]}
                    />
                    I confirmed my commute
                  </label>
                ) : (
                  <p className="hint mt-2">Unverified until {p.name} confirms it.</p>
                )}
              </div>
            );
          }),
        )}
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button type="button" className="btn" onClick={() => setStage("paste")} disabled={busy}>
          ← Back
        </button>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save listing & check dealbreakers"}
        </button>
      </div>
    </form>
  );
}
