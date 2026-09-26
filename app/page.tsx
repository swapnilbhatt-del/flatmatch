import Link from "next/link";
import { CreateGroup } from "@/components/CreateGroup";

export default function Home() {
  return (
    <main className="space-y-6 pt-8">
      <header>
        <h1 className="text-3xl font-bold text-teal-800">FlatMatch</h1>
        <p className="mt-2 text-stone-700">
          One form, three people fill it in separately. Paste the listings you find, and see which flats survive
          <em> everyone&apos;s</em> dealbreakers, plus what each of you gets and gives up.
        </p>
      </header>

      <ol className="card list-decimal space-y-1 pl-8 text-sm text-stone-700">
        <li>Create a group and send each friend her own private link.</li>
        <li>Each person fills in her constraints alone. Nobody sees anyone else&apos;s until all three are in.</li>
        <li>Paste listings you find. Dealbreakers are checked automatically. Anything unknown is flagged, never assumed.</li>
        <li>Compare tradeoffs, shortlist 2–3 flats, and decide together. The app never picks for you.</li>
      </ol>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Start a new group</h2>
        <CreateGroup />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Try the demo</h2>
        <p className="mt-1 text-sm text-stone-600">
          Riya, Meera and Kavita have already filled in their forms and added 6 listings. Open it as any of them:
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["riya", "meera", "kavita"].map((n) => (
            <Link key={n} href={`/g/demo-${n}/results`} className="btn capitalize">
              {n}
            </Link>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-stone-500">
        No listing search, no rankings, no booking. You find the flats, and the three of you decide.
      </p>
    </main>
  );
}
