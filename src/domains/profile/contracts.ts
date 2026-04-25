export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type BrazilianState = (typeof BRAZILIAN_STATES)[number];

export interface FullProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  state: string | null;
  city: string | null;
  schools: string | null;
  years_experience: number | null;
  academic_background: string | null;
  profile_completed: boolean;
}

export interface ProfileFormData {
  full_name: string;
  phone: string;
  bio: string;
  state: string;
  city: string;
  schools: string;
  years_experience: number | null;
  academic_background: string;
  subject_ids: string[];
  grade_level_ids: string[];
}

export interface SelectOption {
  id: string;
  name: string;
}
