import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { EntityManager } from "@/features/admin/shared/entity-manager";

export default function AdminGradeLevelsPage() {
  return (
    <AdminShell
      title="Anos/Séries"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Anos/Séries", href: "/config/grade-levels" },
      ]}
    >
      <CatalogPage
        description="Gerencie os anos e séries expostos no fluxo do professor."
        title="Anos/Séries"
      >
        <EntityManager
          apiPath="/api/admin/grade-levels"
          pluralLabel="Anos/Séries"
          singularLabel="Ano/Série"
        />
      </CatalogPage>
    </AdminShell>
  );
}
