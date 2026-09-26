import { ConstraintForm } from "@/components/ConstraintForm";
import { ErrorPanel, Shell } from "@/components/Shell";
import { loadState } from "@/lib/load";

export default async function EditForm({ params }: PageProps<"/g/[token]/form">) {
  const { token } = await params;
  const { state, error } = await loadState(token);
  if (!state) return <ErrorPanel message={error} />;
  return (
    <Shell token={token} state={state} active="home">
      <h1 className="mb-3 text-xl font-semibold">Edit your constraints</h1>
      <ConstraintForm token={token} initial={state.my_constraints} />
    </Shell>
  );
}
