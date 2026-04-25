import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { Card } from "@/design-system/components/card";
import { Skeleton } from "@/design-system/components/skeleton";

export default function ProfileLoading() {
  return (
    <TeacherShell
      title="Meu Perfil"
      description="Atualize suas informacoes pessoais e profissionais."
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Meu Perfil", href: "/profile" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    </TeacherShell>
  );
}
