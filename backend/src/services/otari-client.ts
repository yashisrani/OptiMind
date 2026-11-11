import type { ChatCompletionRequest, ChatCompletionResponse, UsageResponse, UsageDataPoint } from '../types/otari';

function getConfig() {
  return {
    baseUrl: process.env.OTARI_BASE_URL || 'https://api.otari.ai/api/v1',
    apiKey: process.env.OTARI_API_KEY || '',
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { baseUrl, apiKey } = getConfig();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  console.log('Otari Request:', {
    url: `${baseUrl}${endpoint}`,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    headers: Object.keys(headers),
  });

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Otari API Error [${response.status}]:`, errorText);
    throw new Error(`Otari API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function chatCompletion(body: ChatCompletionRequest, fallbackModel?: string): Promise<ChatCompletionResponse> {
  try {
    return await request<ChatCompletionResponse>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    const msg = (error as Error).message || '';
    const isRecoverable = msg.includes('504') || msg.includes('502') || msg.includes('500') || msg.includes('424') || msg.includes('400');
    if (fallbackModel && isRecoverable) {
      console.log(`Primary model ${body.model} failed (${msg.substring(0, 40)}...), falling back to ${fallbackModel}`);
      return request<ChatCompletionResponse>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({ ...body, model: fallbackModel }),
      });
    }
    throw error;
  }
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
  const res = await request<any>('/code/execute', {
    method: 'POST',
    body: JSON.stringify({ code, container }),
  });
  return {
    output: res.stdout ?? res.output ?? '',
    exit_code: res.return_code ?? res.exit_code ?? 0,
  };
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
