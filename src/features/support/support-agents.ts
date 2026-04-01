import type { ConsultantAgentSlug } from "@/domains/support/contracts";

export interface SupportAgentInfo {
  slug: ConsultantAgentSlug;
  name: string;
  description: string;
  icon: string;
}

export const SUPPORT_AGENTS: SupportAgentInfo[] = [
  {
    slug: "tea-consultant",
    name: "Agente Consultor TEA",
    description:
      "Tire dúvidas sobre adaptação de avaliações para estudantes com Transtorno do Espectro Autista. Respostas baseadas em evidências científicas e legislação.",
    icon: "brain",
  },
];

export function getSupportAgent(
  slug: string,
): SupportAgentInfo | undefined {
  return SUPPORT_AGENTS.find((a) => a.slug === slug);
}
