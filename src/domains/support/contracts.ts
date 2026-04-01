export const CONSULTANT_AGENT_SLUGS = ["tea-consultant"] as const;

export type ConsultantAgentSlug = (typeof CONSULTANT_AGENT_SLUGS)[number];

export function isValidAgentSlug(
  slug: string,
): slug is ConsultantAgentSlug {
  return (CONSULTANT_AGENT_SLUGS as readonly string[]).includes(slug);
}

export interface ConsultantThread {
  id: string;
  teacherId: string;
  agentSlug: ConsultantAgentSlug;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}
