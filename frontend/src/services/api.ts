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

export async function runExperiment(
  id: string,
  input: string
): Promise<{ response: string; variant: ExperimentVariant; latency: number; tokens: number }> {
  return request(`/experiments/${id}/run`, {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
}

export async function getUsage(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/otari/usage${query}`);
}
