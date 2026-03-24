export const ADAPTATION_STATUSES = [
  "pending",
  "processing",
  "completed",
  "error",
] as const;

export type AdaptationStatus = (typeof ADAPTATION_STATUSES)[number];

export const DEFAULT_ADAPTATION_STATUS: AdaptationStatus =
  ADAPTATION_STATUSES[0];

export function getDefaultAdaptationStatus(): AdaptationStatus {
  return DEFAULT_ADAPTATION_STATUS;
}

export interface Adaptation {
  id: string;
  question_id: string;
  support_id: string;
  adapted_content: string | null;
  bncc_skills: string[] | null;
  bloom_level: string | null;
  bncc_analysis: string | null;
  bloom_analysis: string | null;
  status: AdaptationStatus;
  created_at: string;
}

export interface AdaptationWithSupport extends Adaptation {
  supports: { name: string } | null;
}

export interface AdaptedAlternative {
  id: string;
  label?: string;
  originalText: string;
  adaptedText: string;
  isCorrect: boolean;
  position: number;
}

export interface CopyableBlock {
  text: string;
  type: "objective" | "essay";
}
