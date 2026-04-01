import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-default bg-white/90 px-4 py-3 backdrop-blur-md">
        <Link
          href={`/support/${agentSlug}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-muted"
          aria-label="Voltar para conversas"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-text-primary">
            {agent.name}
          </h1>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1">
        <ChatInterface threadId={threadId} agentSlug={agentSlug} />
      </main>
    </div>
  );
}
