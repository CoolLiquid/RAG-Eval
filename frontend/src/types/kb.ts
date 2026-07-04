export type KbStatus = 'connected' | 'failed' | 'pending' | 'disabled';
export type AuthType =
  | 'none'
  | 'api_key'
  | 'authorization_api_key'
  | 'bearer'
  | 'custom_header';

export interface KnowledgeBase {
  id: string;
  name: string;
  endpoint: string;
  auth_type: AuthType;
  auth_header_name: string | null;
  auth_secret_masked: string;
  auth_display: string;
  retrieval_tool: string | null;
  status: KbStatus;
  last_tested_at: string | null;
  created_at: string;
}

export interface KnowledgeBaseListResponse {
  items: KnowledgeBase[];
  total: number;
}

export interface KnowledgeBaseCreatePayload {
  name: string;
  endpoint: string;
  auth_type: AuthType;
  auth_header_name?: string | null;
  auth_secret?: string;
  retrieval_tool?: string;
}

export interface KnowledgeBaseUpdatePayload {
  name?: string;
  endpoint?: string;
  auth_type?: AuthType;
  auth_header_name?: string | null;
  auth_secret?: string;
  retrieval_tool?: string;
  status?: KbStatus;
}

export interface ToolInfo {
  name: string;
  description: string;
}

export interface DiscoverToolsResponse {
  tools: ToolInfo[];
}

export interface TestConnectionResponse {
  success: boolean;
  status: KbStatus;
  message: string;
  tools_count?: number;
}

export interface Chunk {
  content: string;
  source: string;
  title?: string | null;
  score?: number | null;
}

export interface TrialSearchResponse {
  chunks: Chunk[];
  count: number;
}

export interface KbListFilters {
  search?: string;
  status?: KbStatus;
}
