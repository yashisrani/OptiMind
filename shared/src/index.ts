// Shared types for AgentForge

export interface ExperimentVariant {
  id: string;
  name: string;
  prompt: string;
  model: string;
  temperature?: number;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: ExperimentVariant[];
  budget: number;
  spent: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  results: ExperimentResult[];
}

export interface ExperimentResult {
  variantId: string;
  requests: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  successRate: number;
  lastUpdated: string;
}
