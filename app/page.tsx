import Link from "next/link";
import { CreateGroup } from "@/components/CreateGroup";
import { Avatar, Icon, Line, Logo, type IconName } from "@/components/ui";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "share", title: "Send three private links", text: "No sign-up. Each link is one person's key." },
  { icon: "lock", title: "Everyone answers alone", text: "Nobody sees anyone's answers until all three are in." },
  { icon: "building", title: "Paste the flats you find", text: "AI reads the listing. You check it. Unknowns stay unknown." },
  { icon: "chat", title: "Compare, then decide together", text: "See what each of you gets and gives up. The app never picks." },
];

const DEMO = [
  { slug: "riya", name: "Riya", line: "Gym & family in Aundh, ≤ 20 min" },
  { slug: "meera", name: "Meera", line: "Above 1st floor needs a lift" },
  { slug: "kavita", name: "Kavita", line: "Hinjewadi office, ≤ 30 min" },
];

export default function Home() {
  return (
    <main className="pt-6">
      <nav className="mb-10 flex items-center gap-2">
        <Logo className="h-9 w-9" />
        <span className="font-display text-xl font-semibold text-brand-800">FlatMatch</span>
      </nav>

      {/* Hero */}
      <section className="rise">
        <p className="eyebrow mb-3 text-brand-700">For flat hunts with friends</p>
        <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] text-stone-900 sm:text-6xl">
          Find a flat all three of you can <em className="text-brand-700">actually</em> live with.
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-stone-600">
          Stop losing flats one WhatsApp objection at a time. Each of you fills in one private form, and every listing
          gets checked against <strong className="font-semibold text-stone-800">everyone&apos;s</strong> dealbreakers at once.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#start" className="btn-primary">
            Start a group <Icon name="arrow" className="h-4 w-4" />
          </a>
          <Link href="/g/demo-riya/results" className="btn">
            <Icon name="eye" className="h-4 w-4" /> See the demo
          </Link>
        </div>
      </section>

      {/* Product preview */}
      <section aria-label="Example results" className="relative mt-10 rise" style={{ animationDelay: "80ms" }}>
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
            <span className="text-sm font-semibold">Aundh 3BHK, 5th floor walk-up</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
              <Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.4} /> Ruled out
            </span>
          </div>
          <p className="flex items-center gap-2 px-5 py-3 text-sm text-rose-900">
            <Avatar name="Meera" index={1} size="sm" />
            <span>
              Breaks <strong className="font-semibold">Meera&apos;s</strong> dealbreaker: 5th floor, no lift
            </span>
          </p>
          <div className="flex items-center justify-between border-y border-stone-100 bg-stone-50/60 px-5 py-3">
            <span className="text-sm font-semibold">Aundh 3BHK, ITI Road</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} /> Qualifies
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-stone-100 text-xs">
            {[
              { n: "Riya", g: ["5 min to gym", "Balcony"], m: ["No metro"] },
              { n: "Meera", g: ["Lift", "Attached bath"], m: [] },
              { n: "Kavita", g: ["30 min to office"], m: ["No gym"] },
            ].map((p, i) => (
              <div key={p.n} className="p-3">
                <div className="mb-2 flex items-center gap-1.5 font-semibold">
                  <Avatar name={p.n} index={i} size="sm" /> {p.n}
                </div>
                <ul className="space-y-1.5">
                  {p.g.map((x) => (
                    <Line key={x} kind="get">{x}</Line>
                  ))}
                  {p.m.map((x) => (
                    <Line key={x} kind="give">{x}</Line>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-14">
        <p className="eyebrow mb-4">How it works</p>
        <ol className="grid gap-3 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card flex gap-4 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Icon name={s.icon} />
              </span>
              <div>
                <p className="font-semibold text-stone-900">
                  <span className="mr-1.5 text-stone-400">{i + 1}.</span>
                  {s.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Create */}
      <section id="start" className="mt-14 scroll-mt-6">
        <div className="card relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-100/60 blur-2xl" />
          <h2 className="font-display text-2xl font-semibold">Start a new group</h2>
          <p className="mb-4 mt-1 text-sm text-stone-600">Takes ten seconds. You&apos;ll get three personal links to share.</p>
          <CreateGroup />
        </div>
      </section>

      {/* Demo */}
      <section className="mt-14">
        <p className="eyebrow mb-1">Try the demo</p>
        <p className="mb-4 text-sm text-stone-600">
          Riya, Meera and Kavita have filled in their forms and added six real-looking Pune listings. Open it as any of them:
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {DEMO.map((d, i) => (
            <Link key={d.slug} href={`/g/demo-${d.slug}/results`} className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
              <Avatar name={d.name} index={i} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{d.name}</p>
                <p className="truncate text-xs text-stone-500">{d.line}</p>
              </div>
              <Icon name="arrow" className="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
            </Link>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="mt-14 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[
          { icon: "shield" as const, t: "Never picks for you" },
          { icon: "help" as const, t: "Unknown ≠ pass" },
          { icon: "lock" as const, t: "Private until 3/3" },
          { icon: "heart" as const, t: "100% free to run" },
        ].map((p) => (
          <div key={p.t} className="flex items-center gap-2 rounded-2xl bg-white/60 px-3 py-3 text-stone-700">
            <Icon name={p.icon} className="h-4 w-4 text-brand-700" /> {p.t}
          </div>
        ))}
      </section>

      <p className="mt-10 text-center text-xs text-stone-400">
        No listing search, no rankings, no booking. You find the flats, and the three of you decide.
      </p>
    </main>
  );
}
