export type EvolutionFeedbackView = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  originalContent: string;
  adaptedContent: string | null;
  supportName: string;
  dismissed: boolean;
  usedInEvolution: boolean;
};

export type EvolutionSuggestion = {
  evolutionId: string;
  originalPrompt: string;
  suggestedPrompt: string;
  commentary: string;
  currentVersion: number;
  suggestedVersion: number;
};
