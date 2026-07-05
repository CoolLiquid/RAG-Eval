import { apiClient } from '@/api/client';
import type {
  DiscoverToolsResponse,
  KbListFilters,
  KnowledgeBase,
  KnowledgeBaseCreatePayload,
  KnowledgeBaseListResponse,
  KnowledgeBaseUpdatePayload,
  ParseMcpConfigRequest,
  ParseMcpConfigResponse,
  TestConnectionResponse,
  TrialSearchResponse,
} from '@/types/kb';

export async function fetchKbList(filters?: KbListFilters): Promise<KnowledgeBaseListResponse> {
  const { data } = await apiClient.get<KnowledgeBaseListResponse>('/kb', { params: filters });
  return data;
}

export async function fetchKbById(id: string): Promise<KnowledgeBase> {
  const { data } = await apiClient.get<KnowledgeBase>(`/kb/${id}`);
  return data;
}

export async function createKb(payload: KnowledgeBaseCreatePayload): Promise<KnowledgeBase> {
  const { data } = await apiClient.post<KnowledgeBase>('/kb', payload);
  return data;
}

export async function updateKb(
  id: string,
  payload: KnowledgeBaseUpdatePayload,
): Promise<KnowledgeBase> {
  const { data } = await apiClient.put<KnowledgeBase>(`/kb/${id}`, payload);
  return data;
}

export async function deleteKb(id: string): Promise<void> {
  await apiClient.delete(`/kb/${id}`);
}

export async function testKbConnection(id: string): Promise<TestConnectionResponse> {
  const { data } = await apiClient.post<TestConnectionResponse>(`/kb/${id}/test-connection`);
  return data;
}

export async function discoverKbTools(id: string): Promise<DiscoverToolsResponse> {
  const { data } = await apiClient.post<DiscoverToolsResponse>(`/kb/${id}/discover-tools`);
  return data;
}

export async function trialKbSearch(
  id: string,
  query: string,
  topK = 5,
): Promise<TrialSearchResponse> {
  const { data } = await apiClient.post<TrialSearchResponse>(`/kb/${id}/trial-search`, {
    query,
    top_k: topK,
  });
  return data;
}

export async function parseMcpConfig(
  payload: ParseMcpConfigRequest,
): Promise<ParseMcpConfigResponse> {
  const { data } = await apiClient.post<ParseMcpConfigResponse>('/kb/parse-mcp-config', payload);
  return data;
}
