import type { ScoringMethod } from '@/types/evaluation';

export type LlmModelName =
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'deepseek-chat'
  | 'qwen-plus';

export interface LlmConfig {
  api_base_url: string;
  model_name: LlmModelName;
  api_key_configured: boolean;
  api_key_masked: string | null;
}

export interface EvaluationDefaults {
  top_k: number;
  pass_threshold: number;
  mcp_timeout_ms: number;
  scoring_method: ScoringMethod;
}

export interface SystemSettings {
  llm: LlmConfig;
  evaluation_defaults: EvaluationDefaults;
  updated_at: string | null;
}

export interface SettingsUpdatePayload {
  llm?: {
    api_base_url?: string;
    model_name?: LlmModelName;
    api_key?: string;
  };
  evaluation_defaults?: EvaluationDefaults;
}

export interface TestLlmPayload {
  api_base_url?: string;
  model_name?: LlmModelName;
  api_key?: string;
}

export interface TestLlmResponse {
  success: boolean;
  message: string;
  latency_ms: number | null;
}

export const LLM_MODEL_OPTIONS: { value: LlmModelName; label: string }[] = [
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
  { value: 'gpt-4o', label: 'gpt-4o' },
  { value: 'gpt-4-turbo', label: 'gpt-4-turbo' },
  { value: 'deepseek-chat', label: 'deepseek-chat' },
  { value: 'qwen-plus', label: 'qwen-plus' },
];

export const MCP_TIMEOUT_SECONDS = [15, 30, 45, 60, 90, 120] as const;
