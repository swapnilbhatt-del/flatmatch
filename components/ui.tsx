// Small shared UI kit: icons, logo, person avatars, status badges.
import type { Status } from "@/lib/matching";

const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  plus: "M12 5v14M5 12h14",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  check: "m5 12.5 4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  alert: "M12 9v4m0 4h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  lock: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z",
  pin: "M12 21s-7-6.1-7-12a7 7 0 0 1 14 0c0 5.9-7 12-7 12Zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  share: "M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  sparkles: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M19 12H5m6 6-6-6 6-6",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  clock: "M12 7v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Zm13 6h.01",
  heart: "M12 20s-7.5-4.6-9.2-9.1C1.6 7.6 4 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.2 0 5.6 3.1 4.4 6.4C19.5 15.4 12 20 12 20Z",
  shield: "M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z",
  building: "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="10" className="fill-brand-700" />
      <path d="M8 15.5 16 9l8 6.5V23a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12.5" cy="19.5" r="1.6" fill="#c4b5fd" />
      <circle cx="16" cy="19.5" r="1.6" fill="#7dd3fc" />
      <circle cx="19.5" cy="19.5" r="1.6" fill="#f9a8d4" />
    </svg>
  );
}

/** One fixed colour per person, by slot/order. Never used to rank anyone. */
export const PERSON_STYLES = [
  { dot: "bg-violet-500", soft: "bg-violet-50", ring: "ring-violet-200", text: "text-violet-900", border: "border-violet-200", avatar: "bg-violet-100 text-violet-800" },
  { dot: "bg-sky-500", soft: "bg-sky-50", ring: "ring-sky-200", text: "text-sky-900", border: "border-sky-200", avatar: "bg-sky-100 text-sky-800" },
  { dot: "bg-pink-500", soft: "bg-pink-50", ring: "ring-pink-200", text: "text-pink-900", border: "border-pink-200", avatar: "bg-pink-100 text-pink-800" },
] as const;

export const personStyle = (i: number) => PERSON_STYLES[((i % 3) + 3) % 3];

export function Avatar({ name, index, size = "md" }: { name?: string | null; index: number; size?: "sm" | "md" | "lg" }) {
  const s = personStyle(index);
  const dim = size === "sm" ? "h-6 w-6 text-[11px]" : size === "lg" ? "h-12 w-12 text-lg" : "h-9 w-9 text-sm";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white ${dim} ${name ? s.avatar : "bg-stone-100 text-stone-400"}`}>
      {name ? name.trim().charAt(0).toUpperCase() : "?"}
    </span>
  );
}

const STATUS = {
  qualifies: { text: "Qualifies", icon: "check", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200", bar: "bg-emerald-500" },
  needs_verification: { text: "Needs verification", icon: "help", cls: "bg-amber-50 text-amber-900 ring-amber-200", bar: "bg-amber-400" },
  ruled_out: { text: "Ruled out", icon: "x", cls: "bg-rose-50 text-rose-800 ring-rose-200", bar: "bg-rose-400" },
} as const;

export const statusBar = (s: Status) => STATUS[s].bar;

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.cls}`}>
      <Icon name={s.icon} className="h-3.5 w-3.5" strokeWidth={2.4} />
      {s.text}
    </span>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 rise">
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-semibold text-stone-900">{title}</h1>
      {children && <div className="mt-2 text-[15px] leading-relaxed text-stone-600">{children}</div>}
    </div>
  );
}

const LINE = {
  get: { icon: "check", cls: "text-stone-800", iconCls: "bg-emerald-100 text-emerald-700" },
  give: { icon: "alert", cls: "text-amber-950", iconCls: "bg-amber-100 text-amber-700" },
  unknown: { icon: "help", cls: "text-stone-500", iconCls: "bg-stone-100 text-stone-500" },
  look: { icon: "eye", cls: "text-stone-500", iconCls: "bg-stone-100 text-stone-500" },
  broke: { icon: "x", cls: "text-rose-900", iconCls: "bg-rose-100 text-rose-700" },
  wait: { icon: "clock", cls: "text-amber-950", iconCls: "bg-amber-100 text-amber-700" },
} as const;

/** A single factual line with a small coloured icon: what she gets / gives up / unknown / check yourself. */
export function Line({ kind, children }: { kind: keyof typeof LINE; children: React.ReactNode }) {
  const l = LINE[kind];
  return (
    <li className={`flex items-start gap-2 ${l.cls}`}>
      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${l.iconCls}`}>
        <Icon name={l.icon} className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
