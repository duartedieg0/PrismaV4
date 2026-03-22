import type { EvolutionFeedbackView } from "@/features/admin/agents/evolution/contracts";

export const EVOLUTION_PROMPT_VERSION = "evolution@v1";

export const EVOLUTION_AGENT_INSTRUCTIONS = [
  "Você é um revisor de prompts educacionais.",
  "Analise feedbacks reais de professores.",
  "Proponha uma melhoria segura e incremental do prompt atual.",
  "Não mude o objetivo pedagógico do agente sem evidência nos feedbacks.",
].join(" ");

export function buildEvolutionPrompt(input: {
  agentName: string;
  objective?: string | null;
  currentPrompt: string;
  feedbacks: EvolutionFeedbackView[];
}) {
  return [
    "Responda apenas em JSON válido com as chaves suggestedPrompt e commentary.",
    `Agente: ${input.agentName}`,
    `Objetivo: ${input.objective ?? "Não informado"}`,
    `Prompt atual:\n${input.currentPrompt}`,
    "Feedbacks selecionados:",
    ...input.feedbacks.map((feedback, index) => [
      `Feedback ${index + 1}:`,
      `Nota: ${feedback.rating}`,
      `Comentário: ${feedback.comment ?? "Sem comentário"}`,
      `Questão original: ${feedback.originalContent}`,
      `Adaptação: ${feedback.adaptedContent ?? "Sem adaptação persistida"}`,
      `Apoio: ${feedback.supportName}`,
    ].join("\n")),
  ].join("\n\n");
}
