import type { QuestionAlternative } from "@/domains/exams/contracts";

export const ADAPTATION_PROMPT_VERSION = "adaptation@v1";

type AdaptationPromptInput = {
  agentPrompt: string;
  subjectName: string;
  gradeLevelName: string;
  topicName: string;
  correctAnswer: string | null;
  questionContent: string;
  alternatives: QuestionAlternative[] | null;
  supportName: string;
};

export function buildAdaptationPrompt({
  agentPrompt,
  subjectName,
  gradeLevelName,
  topicName,
  correctAnswer,
  questionContent,
  alternatives,
  supportName,
}: AdaptationPromptInput): string {
  const baseContext = `${agentPrompt}

Contexto:
- Disciplina: ${subjectName}
- Ano/Série: ${gradeLevelName}
- Tema: ${topicName}
- Resposta correta: ${correctAnswer ?? "Não informada"}

Questão original:
${questionContent}`;

  if (alternatives && alternatives.length > 0) {
    const alternativesText = alternatives
      .map((alternative) => `${alternative.label}) ${alternative.text}`)
      .join("\n");

    return `${baseContext}

Alternativas originais:
${alternativesText}

IMPORTANTE: Esta é uma questão de múltipla escolha. Você deve adaptar TANTO o enunciado QUANTO todas as alternativas aplicando o mesmo apoio pedagógico.

Gere a versão adaptada desta questão para um aluno com ${supportName}, mantendo a mesma habilidade BNCC e o objetivo de aprendizagem.

Retorne sua resposta no seguinte formato JSON (IMPORTANTE: use \\n para quebras de linha dentro das strings):
{
  "adaptedStatement": "texto do enunciado adaptado",
  "adaptedAlternatives": ["texto da alternativa a adaptada", "texto da alternativa b adaptada", ...]
}

ATENÇÃO:
- O array adaptedAlternatives deve conter exatamente ${alternatives.length} elementos
- Cada elemento deve ser apenas o texto da alternativa, SEM os prefixos "a)", "b)", etc.
- Mantenha a ordem das alternativas
- Aplique o mesmo nível de adaptação tanto no enunciado quanto nas alternativas
- Use \\n para representar quebras de linha dentro das strings JSON (não use quebras de linha literais)`;
  }

  return `${baseContext}

Gere a versão adaptada desta questão para um aluno com ${supportName}, mantendo a mesma habilidade BNCC e o objetivo de aprendizagem. Retorne apenas o texto da questão adaptada.`;
}
