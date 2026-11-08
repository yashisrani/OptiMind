export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface UsageDataPoint {
  date: string;
  model: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

export interface UsageResponse {
  data: UsageDataPoint[];
  total: {
    requests: number;
    input_tokens: number;
    output_tokens: number;
    cost: number;
  };
}

export interface Budget {
  id: string;
  name: string;
  limit: number;
  spent: number;
  period: 'daily' | 'weekly' | 'monthly';
  status: 'green' | 'yellow' | 'red';
}
