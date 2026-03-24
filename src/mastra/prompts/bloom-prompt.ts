export const BLOOM_PROMPT_VERSION = "bloom@v1";

type BloomPromptInput = {
  questionContent: string;
  alternativesText: string;
};

export const BLOOM_AGENT_INSTRUCTIONS = `Você é um especialista em Taxonomia de Bloom aplicada à educação.`;

export function buildBloomPrompt({
  questionContent,
  alternativesText,
}: BloomPromptInput): string {
  return `${BLOOM_AGENT_INSTRUCTIONS}

Analise a questão escolar abaixo e identifique:
1. O nível cognitivo da Taxonomia de Bloom (Lembrar, Entender, Aplicar, Analisar, Avaliar ou Criar)
2. Uma breve análise explicando por que este nível se aplica

Questão:
${questionContent}

${alternativesText}`.trim();
}
