import { notFound } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { getSupportAgent } from "@/features/support/support-agents";
import { ThreadList } from "@/features/support/components/thread-list";

type Props = {
  params: Promise<{ agentSlug: string }>;
};

export default async function AgentThreadsPage({ params }: Props) {
  const { agentSlug } = await params;
  const agent = getSupportAgent(agentSlug);

  if (!agent) {
    notFound();
  }

  return (
    <TeacherShell
      title={agent.name}
      description={agent.description}
      breadcrumbs={[
        { label: "Início", href: "/dashboard" },
        { label: "Agentes IA de Suporte", href: "/support" },
        { label: agent.name, href: `/support/${agentSlug}` },
      ]}
      activeNav="support"
    >
      <ThreadList agentSlug={agentSlug} />
    </TeacherShell>
  );
}
