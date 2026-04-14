import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { SUPPORT_AGENTS } from "@/features/support/support-agents";
import { AgentCard } from "@/features/support/components/agent-card";

export default function SupportPage() {
  return (
    <TeacherShell
      title="Agentes IA de Suporte"
      description="Converse com agentes especializados para tirar dúvidas sobre adaptação de avaliações."
      breadcrumbs={[
        { label: "Início", href: "/dashboard" },
        { label: "Agentes IA de Suporte", href: "/support" },
      ]}
      activeNav="support"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPORT_AGENTS.map((agent) => (
          <AgentCard key={agent.slug} agent={agent} />
        ))}
      </div>
    </TeacherShell>
  );
}
