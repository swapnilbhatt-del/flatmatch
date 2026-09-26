import { ConstraintForm } from "@/components/ConstraintForm";
import { ErrorPanel, Shell } from "@/components/Shell";
import { PageTitle } from "@/components/ui";
import { loadState } from "@/lib/load";

export default async function EditForm({ params }: PageProps<"/g/[token]/form">) {
  const { token } = await params;
  const { state, error } = await loadState(token);
  if (!state) return <ErrorPanel message={error} />;
  return (
    <Shell token={token} state={state} active="home">
      <PageTitle eyebrow="Your constraints" title="Edit your answers">
        Changes apply to every listing straight away.
      </PageTitle>
      <ConstraintForm token={token} initial={state.my_constraints} />
    </Shell>
  );
}
