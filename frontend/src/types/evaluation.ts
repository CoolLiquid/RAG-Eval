export type EvaluationMode = 'retrieval_only' | 'rag_full';
export type EvaluationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ScoringMethod = 'semantic_similarity' | 'llm_judge';
export type FailureType =
  | 'mcp_error'
  | 'no_recall'
  | 'wrong_answer'
  | 'hallucination'
  | 'incomplete'
  | 'mapping_error';

export interface EvaluationConfig {
  top_k: number;
  pass_threshold: number;
  scoring_method: ScoringMethod;
  mcp_timeout_ms: number;
}

export interface Evaluation {
  id: string;
  name: string;
  kb_id: string;
  kb_name: string;
  question_bank_id: string;
  question_bank_name: string;
  mode: EvaluationMode;
  config: EvaluationConfig;
  status: EvaluationStatus;
  progress: number;
  completed_questions: number;
  total_questions: number;
  overall_score: number | null;
  pass_rate: number | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface EvaluationListResponse {
  items: Evaluation[];
  total: number;
}

export interface EvaluationListFilters {
  status?: EvaluationStatus;
  search?: string;
}

export interface EvaluationCreatePayload {
  name: string;
  kb_id: string;
  question_bank_id: string;
  mode?: EvaluationMode;
  config?: Partial<EvaluationConfig>;
}

export interface ChunkResult {
  content: string;
  source: string;
  title?: string | null;
  score?: number | null;
}

export interface EvaluationResult {
  id: string;
  question_id: string;
  question: string;
  expected_answer: string;
  category?: string | null;
  difficulty?: string | null;
  mcp_tool: string;
  mcp_request: Record<string, unknown>;
  mcp_response_raw?: Record<string, unknown> | null;
  chunks: ChunkResult[];
  generated_answer?: string | null;
  score: number;
  passed: boolean;
  failure_type?: FailureType | null;
  failure_reason?: string | null;
  latency_ms: number;
  created_at: string;
}

export interface EvaluationResultsResponse {
  items: EvaluationResult[];
  total: number;
  page: number;
  page_size: number;
}

export interface CategoryScore {
  category: string;
  score: number;
  pass_rate: number;
  total: number;
}

export interface ReportSummary {
  overall_score: number;
  pass_rate: number;
  recall_rate: number;
  mcp_success_rate: number;
  avg_mcp_latency_ms: number;
  total_questions: number;
  passed: number;
  failed: number;
}

export interface EvaluationReport {
  task_id: string;
  task_name: string;
  kb_name: string;
  question_bank_name: string;
  mode: EvaluationMode;
  status: EvaluationStatus;
  completed_at: string | null;
  summary: ReportSummary;
  failure_distribution: Record<string, number>;
  category_scores: CategoryScore[];
}

export const FAILURE_TYPE_LABELS: Record<FailureType, string> = {
  mcp_error: 'MCP 错误',
  no_recall: '未召回',
  wrong_answer: '答案错误',
  hallucination: '幻觉',
  incomplete: '不完整',
  mapping_error: '映射错误',
};

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  pending: '等待中',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
};
