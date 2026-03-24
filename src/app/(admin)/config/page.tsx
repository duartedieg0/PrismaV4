import Link from "next/link";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { Cpu, Bot, HeartHandshake, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Modelos",
    description: "Gerencie providers, segredos, defaults e papéis operacionais.",
    href: "/config/models",
    icon: Cpu,
  },
  {
    title: "Agentes",
    description: "Controle prompts, objetivos, versões e evolução assistida.",
    href: "/config/agents",
    icon: Bot,
  },
  {
    title: "Apoios",
    description: "Vincule apoios a agentes e modelos válidos do runtime.",
    href: "/config/supports",
    icon: HeartHandshake,
  },
  {
    title: "Disciplinas",
    description: "Administre o catálogo curricular usado no fluxo do professor.",
    href: "/config/subjects",
    icon: BookOpen,
  },
  {
    title: "Anos/Séries",
    description: "Administre os níveis que aparecem na criação de provas.",
    href: "/config/grade-levels",
    icon: GraduationCap,
  },
] as const;

export default function AdminConfigPage() {
  return (
    <AdminShell
      title="Configurações"
      description="Gerencie o runtime de IA, o catálogo pedagógico e as entidades que sustentam toda a operação."
      activeNav="home"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                "group flex flex-col gap-3 rounded-2xl border border-border-default bg-white p-5",
                "transition-all duration-200 hover:border-brand-300 hover:shadow-elevated",
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-text-secondary transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <strong className="text-base font-semibold text-text-primary">{section.title}</strong>
                <span className="text-sm text-text-secondary">{section.description}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}
