import { AddListing } from "@/components/AddListing";
import { ErrorPanel, Locked, Shell } from "@/components/Shell";
import { loadState } from "@/lib/load";

export default async function NewListing({ params }: PageProps<"/g/[token]/listings/new">) {
  const { token } = await params;
  const { state, error } = await loadState(token);
  if (!state) return <ErrorPanel message={error} />;
  return (
    <Shell token={token} state={state} active="add">
      <h1 className="mb-3 text-xl font-semibold">Add a listing you found</h1>
      {state.unlocked ? (
        <AddListing
          token={token}
          meId={state.me.member_id}
          people={state.constraints.map((c) => ({ member_id: c.member_id, name: c.name, key_locations: c.key_locations }))}
        />
      ) : (
        <Locked token={token} />
      )}
    </Shell>
  );
}
