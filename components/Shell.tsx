import Link from "next/link";
import type { GroupState } from "@/lib/types";
import { Avatar, Icon, Logo, type IconName } from "./ui";

type Tab = "home" | "results" | "add" | "shortlist";

export function Shell({
  token,
  state,
  active,
  children,
}: {
  token: string;
  state?: GroupState;
  active: Tab;
  children: React.ReactNode;
}) {
  const me = state?.my_constraints?.name;
  const unlocked = !!state?.unlocked;
  const shortCount = state?.shortlist.length ?? 0;
  const tabs: { key: Tab; href: string; label: string; icon: IconName; needsUnlock: boolean; badge?: number }[] = [
    { key: "home", href: `/g/${token}`, label: "Me", icon: "user", needsUnlock: false },
    { key: "results", href: `/g/${token}/results`, label: "Results", icon: "list", needsUnlock: true },
    { key: "add", href: `/g/${token}/listings/new`, label: "Add", icon: "plus", needsUnlock: true },
    { key: "shortlist", href: `/g/${token}/shortlist`, label: "Shortlist", icon: "star", needsUnlock: true, badge: shortCount },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 -mx-4 mb-5 border-b border-stone-200/70 bg-[#f7f4ee]/85 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/g/${token}`} className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-display text-xl font-semibold text-brand-800">FlatMatch</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden truncate text-sm text-stone-500 sm:inline">{state?.group.name}</span>
            {state && <Avatar name={me} index={state.me.slot - 1} size="md" />}
          </div>
        </div>
        {/* Top tabs on larger screens */}
        <nav className="mt-3 hidden gap-1 sm:flex" aria-label="Sections">
          {tabs.map((t) => (
            <TabLink key={t.key} t={t} active={t.key === active} disabled={t.needsUnlock && !unlocked} variant="top" />
          ))}
        </nav>
      </header>

      {children}

      {/* Bottom tab bar on phones: thumb-reachable */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {tabs.map((t) => (
            <TabLink key={t.key} t={t} active={t.key === active} disabled={t.needsUnlock && !unlocked} variant="bottom" />
          ))}
        </div>
      </nav>
    </>
  );
}

function TabLink({
  t,
  active,
  disabled,
  variant,
}: {
  t: { href: string; label: string; icon: IconName; badge?: number };
  active: boolean;
  disabled: boolean;
  variant: "top" | "bottom";
}) {
  const badge = t.badge ? (
    <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-brand-700 px-1 text-center text-[10px] font-bold leading-4 text-white">
      {t.badge}
    </span>
  ) : null;

  if (variant === "bottom") {
    const cls = `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
      active ? "text-brand-700" : disabled ? "text-stone-300" : "text-stone-500"
    }`;
    const inner = (
      <>
        <span className={`relative rounded-full px-4 py-1 transition ${active ? "bg-brand-100" : ""}`}>
          <Icon name={disabled ? "lock" : t.icon} className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
          {badge}
        </span>
        {t.label}
      </>
    );
    return disabled ? (
      <span className={cls} title="Unlocks when all three have submitted">{inner}</span>
    ) : (
      <Link href={t.href} className={cls} aria-current={active ? "page" : undefined}>{inner}</Link>
    );
  }

  const cls = `relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
    active ? "bg-brand-700 text-white shadow-sm" : disabled ? "text-stone-400" : "text-stone-600 hover:bg-white"
  }`;
  const inner = (
    <>
      <Icon name={disabled ? "lock" : t.icon} className="h-4 w-4" />
      {t.label}
      {t.badge ? <span className={`ml-0.5 rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-brand-100 text-brand-800"}`}>{t.badge}</span> : null}
    </>
  );
  return disabled ? (
    <span className={cls} title="Unlocks when all three have submitted">{inner}</span>
  ) : (
    <Link href={t.href} className={cls} aria-current={active ? "page" : undefined}>{inner}</Link>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md text-center rise">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <Icon name="alert" className="h-7 w-7" />
      </div>
      <h1 className="font-display text-2xl font-semibold">Something&apos;s not available right now</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{message}</p>
    </div>
  );
}

/** Three slots: filled count only. Never reveals who has or hasn't submitted. */
export function SubmittedStatus({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex -space-x-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white ${
              i < count ? "bg-brand-600 text-white" : "border-2 border-dashed border-stone-300 bg-white text-stone-300"
            }`}
          >
            {i < count ? <Icon name="check" className="h-5 w-5" strokeWidth={2.4} /> : <Icon name="user" className="h-4 w-4" />}
          </span>
        ))}
      </div>
      <div>
        <p className="font-semibold text-stone-900">{count} of 3 submitted</p>
        <p className="text-xs text-stone-500">{count === 3 ? "Everyone's in: results are unlocked" : "Results unlock at 3 of 3"}</p>
      </div>
    </div>
  );
}

export function Locked({ token }: { token: string }) {
  return (
    <div className="mx-auto mt-10 max-w-sm text-center rise">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
        <Icon name="lock" className="h-7 w-7" />
      </div>
      <h2 className="font-display text-2xl font-semibold">Not unlocked yet</h2>
      <p className="mt-2 text-sm text-stone-600">
        This opens when all three of you have submitted your forms, so nobody anchors on anyone else&apos;s answers.
      </p>
      <Link href={`/g/${token}`} className="btn-primary mt-5">
        Back to my form <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}
