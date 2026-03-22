import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { EntityManager } from "@/features/admin/shared/entity-manager";

export default function AdminSubjectsPage() {
  return (
    <AdminShell
      title="Disciplinas"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Disciplinas", href: "/config/subjects" },
      ]}
    >
      <CatalogPage
        description="Gerencie o catálogo curricular disponível para os professores."
        title="Disciplinas"
      >
        <EntityManager
          apiPath="/api/admin/subjects"
          pluralLabel="Disciplinas"
          singularLabel="Disciplina"
        />
      </CatalogPage>
    </AdminShell>
  );
}
