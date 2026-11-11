import type { Experiment, ExperimentVariant } from '../../../shared/src';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export async function createExperiment(
  name: string,
  description: string,
  variants: Omit<ExperimentVariant, 'id'>[],
  budget: number
): Promise<Experiment> {
  return request<Experiment>('/experiments', {
    method: 'POST',
    body: JSON.stringify({ name, description, variants, budget }),
  });
}

export async function listExperiments(): Promise<Experiment[]> {
  return request<Experiment[]>('/experiments');
}

export async function getExperiment(id: string): Promise<Experiment> {
  return request<Experiment>(`/experiments/${id}`);
}

export async function getVariantComparison(id: string) {
  return request(`/experiments/${id}/comparison`);
}

export async function getOptimizationSuggestions(id: string) {
  return request(`/experiments/${id}/optimize`);
}

export async function getOptimizationHistory(id: string) {
  return request(`/experiments/${id}/history`);
}

export async function getGuardrailRules(id?: string) {
  const endpoint = id ? `/experiments/${id}/guardrails` : '/experiments/guardrails';
  return request(endpoint);
}

export async function updateGuardrailRules(id: string = '', rules: any[]) {
  const endpoint = id && id !== 'default' ? `/experiments/${id}/guardrails` : '/experiments/guardrails';
  return request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(rules),
  });
}

export async function analyzeExperiment(id: string) {
  return request(`/experiments/${id}/analyze`, {
    method: 'POST',
  });
}

export async function searchOptimizationTechniques(id: string) {
  return request(`/experiments/${id}/search/techniques`);
}

export async function searchPromptEngineeringTips(id: string) {
  return request(`/experiments/${id}/search/tips`);
}

export async function getUsage(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/otari/usage${query}`);
}

export async function runExperiment(
  id: string,
  input: string
): Promise<{ response: string; variant: ExperimentVariant; latency: number; tokens: number; cost: number; switched?: boolean }> {
  return request(`/experiments/${id}/run`, {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export async function getOtariBudgets() {
  return request('/experiments/otari/budgets');
}

export async function autoOptimizeExperiment(id: string) {
  return request(`/experiments/${id}/auto-optimize`, {
    method: 'POST',
  });
}

export async function compressPrompt(prompt: string, model: string) {
  return request('/experiments/compress', {
    method: 'POST',
    body: JSON.stringify({ prompt, model }),
  });
}

export async function runModelBattle(systemPrompt: string, userInput: string, models?: string[]) {
  return request('/experiments/battle', {
    method: 'POST',
    body: JSON.stringify({ systemPrompt, userInput, models }),
  });
}
