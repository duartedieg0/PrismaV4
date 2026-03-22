import { AdminShell } from "@/app-shell/admin/admin-shell";
import { CatalogPage } from "@/features/admin/shared/catalog-page";
import { UsersTable } from "@/features/admin/users/components/users-table";
import { toAdminUserListItem } from "@/features/admin/users/service";
import { createClient } from "@/gateways/supabase/server";

async function loadUsers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, blocked, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map(toAdminUserListItem);
}

export default async function AdminUsersPage() {
  const users = await loadUsers();

  return (
    <AdminShell
      title="Usuários"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Usuários", href: "/users" },
      ]}
    >
      <CatalogPage
        description="Gerencie acesso, papel e bloqueios com confirmação explícita e auditoria persistida."
        title="Governança de usuários"
      >
        <UsersTable initialUsers={users} />
      </CatalogPage>
    </AdminShell>
  );
}
