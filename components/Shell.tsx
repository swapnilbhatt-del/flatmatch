import Link from "next/link";
import type { GroupState } from "@/lib/types";

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
  const tabs: { key: Tab; href: string; label: string; needsUnlock: boolean }[] = [
    { key: "home", href: `/g/${token}`, label: "Me", needsUnlock: false },
    { key: "results", href: `/g/${token}/results`, label: "Results", needsUnlock: true },
    { key: "add", href: `/g/${token}/listings/new`, label: "+ Listing", needsUnlock: true },
    { key: "shortlist", href: `/g/${token}/shortlist`, label: "Shortlist", needsUnlock: true },
  ];
  return (
    <>
      <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-stone-200 bg-[#f6f5f2]/95 px-4 pt-3 backdrop-blur">
        <div className="flex items-baseline justify-between gap-2">
          <Link href={`/g/${token}`} className="text-lg font-bold text-teal-800">
            FlatMatch
          </Link>
          <span className="truncate text-sm text-stone-600">
            {state?.group.name}
            {me ? ` · you're ${me}` : ""}
          </span>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto pb-2 text-sm">
          {tabs.map((t) => {
            const disabled = t.needsUnlock && !state?.unlocked;
            const cls =
              "whitespace-nowrap rounded-full px-3 py-1.5 " +
              (t.key === active ? "bg-teal-700 text-white" : disabled ? "text-stone-400" : "text-stone-700 bg-white border border-stone-200");
            return disabled ? (
              <span key={t.key} className={cls} title="Unlocks when all three have submitted">
                {t.label} 🔒
              </span>
            ) : (
              <Link key={t.key} href={t.href} className={cls}>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="card mt-6 border-red-200 bg-red-50 text-red-900">
      <p className="font-semibold">Something&apos;s not available right now</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

export function SubmittedStatus({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-2.5 w-8 rounded-full ${i < count ? "bg-teal-600" : "bg-stone-200"}`} />
        ))}
      </div>
      <span className="text-sm font-medium">{count} of 3 submitted</span>
    </div>
  );
}

export function Locked({ token }: { token: string }) {
  return (
    <div className="card space-y-2 text-sm">
      <p>🔒 This unlocks when all three of you have submitted your forms.</p>
      <Link href={`/g/${token}`} className="text-teal-700 underline">
        Back to my form
      </Link>
    </div>
  );
}
