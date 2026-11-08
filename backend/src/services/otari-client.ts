import type { ChatCompletionRequest, ChatCompletionResponse, UsageResponse, UsageDataPoint } from '../types/otari';

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

export async function getUsageSeries(bucket: 'hour' | 'day' = 'day', startDate?: string, endDate?: string): Promise<UsageDataPoint[]> {
  const params = new URLSearchParams({ bucket });
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  return request<UsageDataPoint[]>(`/usage/series?${params.toString()}`);
}

export async function getBudgets(): Promise<Array<{ id: string; name: string; limit: number; spent: number; period: string }>> {
  return request('/budgets');
}

export async function executeCode(code: string, container?: string): Promise<{ output: string; exit_code: number }> {
  return request('/code/execute', {
    method: 'POST',
    body: JSON.stringify({ code, container }),
  });
}

export async function webSearch(query: string): Promise<{ results: Array<{ title: string; url: string; snippet: string }> }> {
  return request('/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function getAgentTelemetry(startDate?: string, endDate?: string): Promise<{
  outcomes: {
    commits: number;
    pull_requests: number;
    lines_of_code: number;
    active_time: number;
  };
  behavior: {
    tool_calls: number;
    tool_accepts: number;
    tool_rejects: number;
    turns: number;
    api_errors: number;
  };
  measures: {
    cost_per_commit: number | null;
    cost_per_pull_request: number | null;
    cost_per_line: number | null;
    spend_per_active_hour: number | null;
    tool_acceptance_rate: number | null;
    error_rate: number | null;
    turns_per_session: number | null;
  };
  usage: {
    cost: number;
    requests: number;
  };
}> {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);

  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/agent-telemetry/summary${query}`);
}

export async function getTraces(limit: number = 50): Promise<Array<{
  id: string;
  session_id: string;
  model: string;
  duration_ms: number;
  cost: number;
  tokens: number;
  status: string;
  created_at: string;
  turns: number;
  tool_calls: number;
}>> {
  return request(`/traces?limit=${limit}`);
}

export async function getTraceById(traceId: string): Promise<{
  id: string;
  session_id: string;
  model: string;
  duration_ms: number;
  cost: number;
  tokens: number;
  status: string;
  created_at: string;
  turns: Array<{
    id: string;
    model: string;
    duration_ms: number;
    cost: number;
    tokens: number;
    tool_calls: Array<{
      name: string;
      duration_ms: number;
      status: string;
    }>;
  }>;
}> {
  return request(`/traces/${traceId}`);
}
