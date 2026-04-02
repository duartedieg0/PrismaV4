import { notFound } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { getSupportAgent } from "@/features/support/support-agents";
import { ChatInterface } from "@/features/support/components/chat-interface";

type Props = {
  params: Promise<{ agentSlug: string; threadId: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { agentSlug, threadId } = await params;
  const agent = getSupportAgent(agentSlug);

  if (!agent) {
    notFound();
  }

  return (
    <TeacherShell
      title={agent.name}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Agentes IA de Suporte", href: "/support" },
        { label: agent.name, href: `/support/${agentSlug}` },
      ]}
      activeNav="support"
    >
      <ChatInterface threadId={threadId} agentSlug={agentSlug} />
    </TeacherShell>
  );
}
