export const BNCC_PROMPT_VERSION = "bncc@v1";

type BnccPromptInput = {
  subject: string;
  gradeLevel: string;
  topic: string;
  questionContent: string;
  alternativesText: string;
};

export const BNCC_AGENT_INSTRUCTIONS = `Você é um especialista em currículo educacional brasileiro (BNCC).`;

export function buildBnccPrompt({
  subject,
  gradeLevel,
  topic,
  questionContent,
  alternativesText,
}: BnccPromptInput): string {
  return `${BNCC_AGENT_INSTRUCTIONS}

Analise a questão escolar abaixo e identifique:
1. A(s) habilidade(s) BNCC relacionada(s) (códigos como EF06MA01)
2. Uma breve análise explicando por que estas habilidades se aplicam

Contexto:
- Disciplina: ${subject}
- Ano/Série: ${gradeLevel}
- Tema: ${topic}

Questão:
${questionContent}

${alternativesText}`.trim();
}
