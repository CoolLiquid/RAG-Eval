import { apiClient } from '@/api/client';
import type {
  Evaluation,
  EvaluationCreatePayload,
  EvaluationListFilters,
  EvaluationListResponse,
  EvaluationReport,
  EvaluationResultsResponse,
} from '@/types/evaluation';

export async function fetchEvaluationList(
  filters?: EvaluationListFilters,
): Promise<EvaluationListResponse> {
  const { data } = await apiClient.get<EvaluationListResponse>('/evaluations', {
    params: filters,
  });
  return data;
}

export async function fetchEvaluationById(id: string): Promise<Evaluation> {
  const { data } = await apiClient.get<Evaluation>(`/evaluations/${id}`);
  return data;
}

export async function createEvaluation(payload: EvaluationCreatePayload): Promise<Evaluation> {
  const { data } = await apiClient.post<Evaluation>('/evaluations', payload);
  return data;
}

export async function cancelEvaluation(id: string): Promise<Evaluation> {
  const { data } = await apiClient.post<Evaluation>(`/evaluations/${id}/cancel`);
  return data;
}

export async function fetchEvaluationResults(
  id: string,
  page = 1,
  pageSize = 20,
): Promise<EvaluationResultsResponse> {
  const { data } = await apiClient.get<EvaluationResultsResponse>(`/evaluations/${id}/results`, {
    params: { page, page_size: pageSize },
  });
  return data;
}

export async function fetchEvaluationReport(id: string): Promise<EvaluationReport> {
  const { data } = await apiClient.get<EvaluationReport>(`/evaluations/${id}/report`);
  return data;
}
