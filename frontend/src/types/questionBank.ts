export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionBankType = 'builtin' | 'custom';

export interface Question {
  id: string;
  question: string;
  expected_answer: string;
  category?: string | null;
  difficulty?: QuestionDifficulty | null;
  source_ref?: string | null;
}

export interface QuestionBank {
  id: string;
  name: string;
  type: QuestionBankType;
  question_count: number;
  categories: string[];
  created_at: string;
}

export interface QuestionBankDetail extends QuestionBank {
  questions: Question[];
}

export interface QuestionBankListResponse {
  items: QuestionBank[];
  total: number;
}

export interface SkippedRow {
  row: number;
  reason: string;
}

export interface ImportQuestionBankResponse {
  bank: QuestionBank;
  imported_count: number;
  skipped_rows: SkippedRow[];
}

export interface QuestionBankListFilters {
  type?: QuestionBankType;
  search?: string;
}
