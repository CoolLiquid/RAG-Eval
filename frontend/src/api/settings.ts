import { apiClient } from '@/api/client';
import type {
  SettingsUpdatePayload,
  SystemSettings,
  TestLlmPayload,
  TestLlmResponse,
} from '@/types/settings';

export async function fetchSettings(): Promise<SystemSettings> {
  const { data } = await apiClient.get<SystemSettings>('/settings');
  return data;
}

export async function updateSettings(payload: SettingsUpdatePayload): Promise<SystemSettings> {
  const { data } = await apiClient.put<SystemSettings>('/settings', payload);
  return data;
}

export async function testLlmConnection(payload?: TestLlmPayload): Promise<TestLlmResponse> {
  const { data } = await apiClient.post<TestLlmResponse>('/settings/test-llm', payload ?? {});
  return data;
}
