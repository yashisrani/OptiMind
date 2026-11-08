import type { Experiment } from '../../shared/src';

interface OptimizationEvent {
  timestamp: string;
  type: 'model_switch' | 'budget_alert' | 'efficiency_gain' | 'experiment_created';
  description: string;
  metadata: {
    from?: string;
    to?: string;
    savings?: number;
    efficiency?: number;
  };
}

const optimizationHistory = new Map<string, OptimizationEvent[]>();

export function logOptimizationEvent(experimentId: string, event: OptimizationEvent): void {
  const history = optimizationHistory.get(experimentId) || [];
  history.push(event);
  optimizationHistory.set(experimentId, history);
}

export function getOptimizationHistory(experimentId: string): OptimizationEvent[] {
  return optimizationHistory.get(experimentId) || [];
}

export function logExperimentCreated(experimentId: string, experiment: Experiment): void {
  logOptimizationEvent(experimentId, {
    timestamp: experiment.createdAt,
    type: 'experiment_created',
    description: `Experiment "${experiment.name}" created with ${experiment.variants.length} variants`,
    metadata: {},
  });
}

export function logModelSwitch(experimentId: string, from: string, to: string, savings: number): void {
  logOptimizationEvent(experimentId, {
    timestamp: new Date().toISOString(),
    type: 'model_switch',
    description: `Switched from ${from} to ${to}`,
    metadata: { from, to, savings },
  });
}

export function logBudgetAlert(experimentId: string, spent: number, budget: number): void {
  logOptimizationEvent(experimentId, {
    timestamp: new Date().toISOString(),
    type: 'budget_alert',
    description: `Budget alert: $${spent.toFixed(4)} of $${budget} spent`,
    metadata: { savings: spent },
  });
}

export function logEfficiencyGain(experimentId: string, efficiency: number): void {
  logOptimizationEvent(experimentId, {
    timestamp: new Date().toISOString(),
    type: 'efficiency_gain',
    description: `Efficiency improved to ${efficiency.toFixed(2)}`,
    metadata: { efficiency },
  });
}
