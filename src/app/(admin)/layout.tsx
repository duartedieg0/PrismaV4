import { redirect } from "next/navigation";
import { requireAdminPageAccess } from "@/features/admin/shared/admin-guard";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const access = await requireAdminPageAccess();

  if (access.kind === "redirect") {
    redirect(access.redirectTo);
  }

  return children;
}
