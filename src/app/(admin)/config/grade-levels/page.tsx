import { AdminShell } from "@/app-shell/admin/admin-shell";
import { EntityManager } from "@/features/admin/shared/entity-manager";

export default function AdminGradeLevelsPage() {
  return (
    <AdminShell
      title="Anos/Séries"
      description="Gerencie os anos e séries expostos no fluxo do professor."
      activeNav="grade-levels"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Anos/Series", href: "/config/grade-levels" },
      ]}
    >
      <EntityManager
        apiPath="/api/admin/grade-levels"
        pluralLabel="Anos/Séries"
        singularLabel="Ano/Série"
      />
    </AdminShell>
  );
}
