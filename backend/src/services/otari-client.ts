import type { ChatCompletionRequest, ChatCompletionResponse, UsageResponse } from '../types/otari';

const OTARI_BASE_URL = process.env.OTARI_BASE_URL || 'https://api.otari.ai/api/v1';
const OTARI_API_KEY = process.env.OTARI_API_KEY || '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${OTARI_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OTARI_API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Otari API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function chatCompletion(body: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  return request<ChatCompletionResponse>('/chat/completions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getUsage(startDate?: string, endDate?: string): Promise<UsageResponse> {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  const query = params.toString() ? `?${params.toString()}` : '';
  return request<UsageResponse>(`/usage${query}`);
}
