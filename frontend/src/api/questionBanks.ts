import { apiClient } from '@/api/client';
import type {
  ImportQuestionBankResponse,
  QuestionBankDetail,
  QuestionBankListFilters,
  QuestionBankListResponse,
} from '@/types/questionBank';

export async function fetchQuestionBankList(
  filters?: QuestionBankListFilters,
): Promise<QuestionBankListResponse> {
  const { data } = await apiClient.get<QuestionBankListResponse>('/question-banks', {
    params: filters,
  });
  return data;
}

export async function fetchQuestionBankById(id: string): Promise<QuestionBankDetail> {
  const { data } = await apiClient.get<QuestionBankDetail>(`/question-banks/${id}`);
  return data;
}

export async function importQuestionBankCsv(
  file: File,
  name?: string,
): Promise<ImportQuestionBankResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (name?.trim()) {
    formData.append('name', name.trim());
  }
  const { data } = await apiClient.post<ImportQuestionBankResponse>(
    '/question-banks/import',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function deleteQuestionBank(id: string): Promise<void> {
  await apiClient.delete(`/question-banks/${id}`);
}

export async function downloadQuestionBankTemplate(): Promise<void> {
  const response = await apiClient.get('/question-banks/template', {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'question_bank_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
