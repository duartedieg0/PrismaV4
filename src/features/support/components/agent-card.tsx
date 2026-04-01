import Link from "next/link";
import { Bot } from "lucide-react";
import type { SupportAgentInfo } from "@/features/support/support-agents";

export function AgentCard({ agent }: { agent: SupportAgentInfo }) {
  return (
    <Link
      href={`/support/${agent.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border-default bg-white p-6 transition-all hover:border-brand-300 hover:shadow-soft"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
        <Bot className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-text-primary">
          {agent.name}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {agent.description}
        </p>
      </div>
    </Link>
  );
}
