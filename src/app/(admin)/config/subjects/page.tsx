import { AdminShell } from "@/app-shell/admin/admin-shell";
import { EntityManager } from "@/features/admin/shared/entity-manager";

export default function AdminSubjectsPage() {
  return (
    <AdminShell
      title="Disciplinas"
      description="Gerencie o catálogo curricular disponível para os professores."
      activeNav="subjects"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Disciplinas", href: "/config/subjects" },
      ]}
    >
      <EntityManager
        apiPath="/api/admin/subjects"
        pluralLabel="Disciplinas"
        singularLabel="Disciplina"
      />
    </AdminShell>
  );
}
