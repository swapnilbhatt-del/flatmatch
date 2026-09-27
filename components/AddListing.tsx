"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mapsDirectionsUrl } from "@/lib/maps";
import { FIELD_LABELS, UNKNOWN, type ListingFields } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { emptyFields } from "@/lib/validate";
import { Avatar, Icon } from "./ui";

export interface PersonLocations {
  member_id: string;
  name: string;
  key_locations: { label: string; place: string; max_minutes: number }[];
}

type Stage = "paste" | "edit";

const TRI_FIELDS = ["lift", "parking", "pet_friendly", "balcony", "gym", "near_metro"] as const;
const NUM_FIELDS = ["rent", "bhk", "floor", "bathrooms", "attached_bathrooms"] as const;

function Steps({ current }: { current: number }) {
  const steps = ["Paste", "Check", "Commutes"];
  return (
    <ol className="mb-5 flex items-center gap-2 text-xs font-medium" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              i < current ? "bg-brand-600 text-white" : i === current ? "bg-brand-700 text-white ring-4 ring-brand-100" : "bg-stone-200 text-stone-500"
            }`}
          >
            {i < current ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
          </span>
          <span className={i <= current ? "text-stone-800" : "text-stone-400"}>{s}</span>
          {i < steps.length - 1 && <span className={`h-px flex-1 ${i < current ? "bg-brand-300" : "bg-stone-200"}`} />}
        </li>
      ))}
    </ol>
  );
}

/** Yes / No / Unknown segmented control. Unknown is always an explicit choice, never a blank. */
function TriSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: "yes" | "no" | "unknown") => void }) {
  const opts = [
    { v: "yes", l: "Yes" },
    { v: "no", l: "No" },
    { v: "unknown", l: "?" },
  ] as const;
  return (
    <div id={id} role="radiogroup" className="grid grid-cols-3 rounded-2xl border border-stone-200 bg-white p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          aria-label={o.v === "unknown" ? "Unknown" : o.l}
          onClick={() => onChange(o.v)}
          className={`min-h-10 rounded-xl text-sm font-medium transition ${
            value === o.v
              ? o.v === "unknown"
                ? "bg-amber-100 text-amber-900"
                : "bg-brand-700 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function AddListing({ token, meId, people }: { token: string; meId: string; people: PersonLocations[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
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
      <div className="rise">
        <Steps current={0} />
        <fieldset disabled={!hydrated} className="card space-y-4">
          <div>
            <label className="label" htmlFor="text">Listing text</label>
            <textarea
              id="text"
              className="input min-h-44 resize-y py-3 leading-relaxed"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Copy the description from NoBroker, MagicBricks, 99acres or WhatsApp and paste it here…"
            />
          </div>
          <div>
            <label className="label" htmlFor="url">
              Link <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input id="url" className="input" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            <p className="hint mt-1.5">Saved for reference only. FlatMatch never opens or scrapes links.</p>
          </div>
          <button type="button" className="btn-primary w-full" onClick={autofill} disabled={busy || text.trim().length < 15}>
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Reading the listing…
              </>
            ) : (
              <>
                <Icon name="sparkles" className="h-4 w-4" /> Auto-fill from text
              </>
            )}
          </button>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span className="h-px flex-1 bg-stone-200" /> or <span className="h-px flex-1 bg-stone-200" />
          </div>
          <button type="button" className="btn w-full" onClick={manual} disabled={busy}>
            Fill in by hand
          </button>
        </fieldset>
      </div>
    );
  }

  const unk = (k: keyof ListingFields) => fields[k] === UNKNOWN;
  const fieldCls = (k: keyof ListingFields) => (unk(k) ? "border-amber-300 bg-amber-50/60" : "");
  const area = fields.area !== UNKNOWN ? fields.area : title;
  const unknownCount = (Object.keys(fields) as (keyof ListingFields)[]).filter(unk).length;

  return (
    <form onSubmit={save} className="rise">
      <fieldset disabled={!hydrated} className="space-y-4">
      <Steps current={1} />
      {notice && (
        <p className="flex gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <Icon name="help" className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
        </p>
      )}
      <div className="checkpoint flex gap-3">
        <Icon name="eye" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <p>
          <strong>Check every field before saving.</strong> {aiFilled ? "AI filled these in from the text and can be wrong. " : ""}
          Anything the listing doesn&apos;t clearly say stays <strong>unknown</strong> (highlighted). Unknowns get flagged
          for verification, never treated as a pass.
          {unknownCount > 0 && <span className="mt-1 block text-xs text-amber-800">{unknownCount} field{unknownCount === 1 ? "" : "s"} unknown right now.</span>}
        </p>
      </div>

      <section className="card space-y-4">
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
            <div key={k} className={k === "rent" ? "col-span-2" : ""}>
              <label className="label" htmlFor={k}>
                {FIELD_LABELS[k]}
                {k === "rent" && <span className="font-normal text-stone-400"> · total per month</span>}
              </label>
              <div className="relative">
                {k === "rent" && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">₹</span>}
                <input
                  id={k}
                  className={`input ${k === "rent" ? "pl-8" : ""} ${fieldCls(k)}`}
                  inputMode="numeric"
                  value={fields[k] === UNKNOWN ? "" : String(fields[k])}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[,\s₹]/g, "");
                    set(k, /^\d+$/.test(v) ? Number(v) : UNKNOWN);
                  }}
                  placeholder="Unknown"
                />
              </div>
            </div>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="furnished">{FIELD_LABELS.furnished}</label>
          <select
            id="furnished"
            className={`input appearance-none ${fieldCls("furnished")}`}
            value={fields.furnished}
            onChange={(e) => set("furnished", e.target.value as ListingFields["furnished"])}
          >
            <option value="unknown">Unknown</option>
            <option value="full">Fully furnished</option>
            <option value="semi">Semi-furnished</option>
            <option value="none">Unfurnished</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {TRI_FIELDS.map((k) => (
            <div key={k}>
              <label className="label" htmlFor={k}>{FIELD_LABELS[k]}</label>
              <TriSelect id={k} value={fields[k]} onChange={(v) => set(k, v)} />
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon name="clock" />
          </span>
          <div>
            <h2 className="font-semibold">Commute estimates</h2>
            <p className="hint mt-0.5">
              Open Google Maps for each one and type the minutes, one way at the time she&apos;d travel. Each estimate stays{" "}
              <strong>unverified</strong> until that person confirms it herself.
            </p>
          </div>
        </div>
        {people.map((p, pi) =>
          p.key_locations.map((l) => {
            const k = `${p.member_id}:${l.label}`;
            const mine = p.member_id === meId;
            const over = minutes[k] && Number(minutes[k]) > l.max_minutes;
            return (
              <div key={k} className="card-flat space-y-2.5 p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={p.name} index={pi} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {p.name} · {l.label} <span className="font-normal text-stone-500">({l.place})</span>
                  </span>
                  <span className="pill shrink-0">≤ {l.max_minutes} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <a className="btn min-w-0 flex-1" href={mapsDirectionsUrl(area || "Pune", l.place)} target="_blank" rel="noopener noreferrer">
                    <Icon name="pin" className="h-4 w-4 shrink-0" /> <span className="truncate">Google Maps</span>{" "}
                    <Icon name="external" className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </a>
                  <div className="relative shrink-0">
                    <input
                      aria-label={`Minutes for ${p.name} to ${l.label}`}
                      className={`input w-24 pr-11 text-center ${over ? "border-rose-300 text-rose-700" : ""}`}
                      inputMode="numeric"
                      placeholder="?"
                      value={minutes[k] ?? ""}
                      onChange={(e) => setMinutes((m) => ({ ...m, [k]: e.target.value.replace(/\D/g, "") }))}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">min</span>
                  </div>
                </div>
                {mine ? (
                  <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-amber-900">
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
                  <p className="hint flex items-center gap-1">
                    <Icon name="clock" className="h-3.5 w-3.5" /> Unverified until {p.name} confirms it
                  </p>
                )}
              </div>
            );
          }),
        )}
      </section>

      {error && (
        <p className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-800">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </p>
      )}
      <div className="sticky bottom-20 z-10 grid grid-cols-[auto_1fr] gap-2 sm:bottom-4">
        <button type="button" className="btn" onClick={() => setStage("paste")} disabled={busy} aria-label="Back">
          <Icon name="back" className="h-4 w-4" />
        </button>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save & check dealbreakers"}
          {!busy && <Icon name="arrow" className="h-4 w-4" />}
        </button>
      </div>
      </fieldset>
    </form>
  );
}
