import type { QuestionAlternative } from "@/domains/exams/contracts";

export const ADAPTATION_PROMPT_VERSION = "adaptation@v2";

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
  "adaptedAlternatives": [
    {"originalLabel": "A", "text": "texto da alternativa a adaptada"},
    {"originalLabel": "B", "text": "texto da alternativa b adaptada"}
  ]
}

ATENÇÃO:
- Cada elemento de adaptedAlternatives deve conter "originalLabel" (a letra da alternativa original) e "text" (o texto adaptado)
- Cada "text" deve ser apenas o texto da alternativa, SEM os prefixos "a)", "b)", etc.
- Você PODE reduzir a quantidade de alternativas se isso for pedagogicamente adequado para o apoio ${supportName}
- Você NUNCA deve remover a alternativa correta (${correctAnswer ?? "Não informada"})
- Se reduzir, mantenha no mínimo 2 alternativas (incluindo a correta)
- Aplique o mesmo nível de adaptação tanto no enunciado quanto nas alternativas
- Use \\n para representar quebras de linha dentro das strings JSON (não use quebras de linha literais)`;
  }

  return `${baseContext}

Gere a versão adaptada desta questão para um aluno com ${supportName}, mantendo a mesma habilidade BNCC e o objetivo de aprendizagem. Retorne apenas o texto da questão adaptada.`;
}
