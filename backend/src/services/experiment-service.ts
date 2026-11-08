import { chatCompletion, getUsage, getBudgets } from './otari-client';
import type { Experiment, ExperimentVariant, ExperimentResult } from '../../shared/src';
import type { Budget } from '../types/otari';
import { logExperimentCreated, logModelSwitch, logBudgetAlert } from './optimization-history';
import { checkBudgetGuardrail, checkModelGuardrail, checkPromptGuardrail } from './guardrails';
import { getDatabase } from './database';

export function createExperiment(
  name: string,
  description: string,
  variants: Omit<ExperimentVariant, 'id'>[],
  budget: number
): Experiment {
  const db = getDatabase();
  const id = `exp_${Date.now()}`;
  
  const insertExperiment = db.prepare(`
    INSERT INTO experiments (id, name, description, budget, status)
    VALUES (?, ?, ?, ?, 'active')
  `);
  
  const insertVariant = db.prepare(`
    INSERT INTO variants (id, experiment_id, name, prompt, model, temperature)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertResult = db.prepare(`
    INSERT INTO results (variant_id, requests, total_tokens, total_cost, avg_latency, success_rate)
    VALUES (?, 0, 0, 0, 0, 100)
  `);

  const transaction = db.transaction(() => {
    insertExperiment.run(id, name, description, budget);
    variants.forEach((v, i) => {
      const variantId = `${id}_v${i}`;
      insertVariant.run(variantId, id, v.name, v.prompt, v.model, v.temperature || 0.7);
      insertResult.run(variantId);
    });
  });

  transaction();

  const experiment: Experiment = {
    id,
    name,
    description,
    variants: variants.map((v, i) => ({ ...v, id: `${id}_v${i}` })),
    budget,
    spent: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    results: variants.map((_, i) => ({
      variantId: `${id}_v${i}`,
      requests: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      successRate: 100,
      lastUpdated: new Date().toISOString(),
    })),
  };

  logExperimentCreated(id, experiment);
  return experiment;
}

export function getExperiment(id: string): Experiment | undefined {
  const db = getDatabase();
  
  const experiment = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id) as any;
  if (!experiment) return undefined;

  const variants = db.prepare('SELECT * FROM variants WHERE experiment_id = ?').all(id) as any[];
  const results = db.prepare('SELECT * FROM results WHERE variant_id IN (SELECT id FROM variants WHERE experiment_id = ?)').all(id) as any[];

  return {
    id: experiment.id,
    name: experiment.name,
    description: experiment.description,
    budget: experiment.budget,
    spent: experiment.spent,
    status: experiment.status,
    createdAt: experiment.created_at,
    variants: variants.map(v => ({
      id: v.id,
      name: v.name,
      prompt: v.prompt,
      model: v.model,
      temperature: v.temperature,
    })),
    results: results.map(r => ({
      variantId: r.variant_id,
      requests: r.requests,
      totalTokens: r.total_tokens,
      totalCost: r.total_cost,
      avgLatency: r.avg_latency,
      successRate: r.success_rate,
      lastUpdated: r.last_updated,
    })),
  };
}

export function listExperiments(): Experiment[] {
  const db = getDatabase();
  const experiments = db.prepare('SELECT * FROM experiments ORDER BY created_at DESC').all() as any[];
  
  return experiments.map(exp => {
    const variants = db.prepare('SELECT * FROM variants WHERE experiment_id = ?').all(exp.id) as any[];
    const results = db.prepare('SELECT * FROM results WHERE variant_id IN (SELECT id FROM variants WHERE experiment_id = ?)').all(exp.id) as any[];
    
    return {
      id: exp.id,
      name: exp.name,
      description: exp.description,
      budget: exp.budget,
      spent: exp.spent,
      status: exp.status,
      createdAt: exp.created_at,
      variants: variants.map(v => ({
        id: v.id,
        name: v.name,
        prompt: v.prompt,
        model: v.model,
        temperature: v.temperature,
      })),
      results: results.map(r => ({
        variantId: r.variant_id,
        requests: r.requests,
        totalTokens: r.total_tokens,
        totalCost: r.total_cost,
        avgLatency: r.avg_latency,
        successRate: r.success_rate,
        lastUpdated: r.last_updated,
      })),
    };
  });
}

export async function runExperiment(
  experimentId: string,
  input: string
): Promise<{ response: string; variant: ExperimentVariant; latency: number; tokens: number; cost: number }> {
  const experiment = getExperiment(experimentId);
  if (!experiment) throw new Error('Experiment not found');
  if (experiment.status !== 'active') throw new Error('Experiment is not active');

  const budgetCheck = checkBudgetGuardrail(experiment);
  if (!budgetCheck.allowed) {
    logBudgetAlert(experimentId, experiment.spent, experiment.budget);
    throw new Error(budgetCheck.reason);
  }

  const variant = selectVariant(experiment);
  
  const modelCheck = checkModelGuardrail(variant.model);
  if (!modelCheck.allowed) {
    throw new Error(modelCheck.reason);
  }

  const promptCheck = checkPromptGuardrail(variant.prompt);
  if (!promptCheck.allowed) {
    throw new Error(promptCheck.reason);
  }

  const startTime = Date.now();

  const response = await chatCompletion({
    model: variant.model,
    messages: [
      { role: 'system', content: variant.prompt },
      { role: 'user', content: input },
    ],
    temperature: variant.temperature,
  });

  const latency = Date.now() - startTime;
  const tokens = response.usage.total_tokens;
  const cost = calculateCost(response.usage, variant.model);

  updateResult(experiment, variant.id, tokens, cost, latency);

  if (budgetCheck.reason) {
    logBudgetAlert(experimentId, experiment.spent, experiment.budget);
  }

  return {
    response: response.choices[0].message.content,
    variant,
    latency,
    tokens,
    cost,
  };
}

function selectVariant(experiment: Experiment): ExperimentVariant {
  const totalRequests = experiment.results.reduce((sum, r) => sum + r.requests, 0);
  
  if (totalRequests < experiment.variants.length * 10) {
    const leastTested = experiment.results
      .sort((a, b) => a.requests - b.requests)[0];
    return experiment.variants.find(v => v.id === leastTested.variantId)!;
  }

  const best = experiment.results
    .filter(r => r.successRate > 80)
    .sort((a, b) => {
      const aEfficiency = a.successRate / (a.totalCost || 1);
      const bEfficiency = b.successRate / (b.totalCost || 1);
      return bEfficiency - aEfficiency;
    })[0];

  if (!best) return experiment.variants[0];
  return experiment.variants.find(v => v.id === best.variantId)!;
}

function updateResult(
  experiment: Experiment,
  variantId: string,
  tokens: number,
  cost: number,
  latency: number
): void {
  const db = getDatabase();
  
  const result = experiment.results.find(r => r.variantId === variantId);
  if (!result) return;

  const newRequests = result.requests + 1;
  const newTotalTokens = result.totalTokens + tokens;
  const newTotalCost = result.totalCost + cost;
  const newAvgLatency = (result.avgLatency * result.requests + latency) / newRequests;

  const updateResult = db.prepare(`
    UPDATE results 
    SET requests = ?, total_tokens = ?, total_cost = ?, avg_latency = ?, last_updated = CURRENT_TIMESTAMP
    WHERE variant_id = ?
  `);
  
  const updateExperiment = db.prepare(`
    UPDATE experiments SET spent = spent + ? WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    updateResult.run(newRequests, newTotalTokens, newTotalCost, newAvgLatency, variantId);
    updateExperiment.run(cost, experiment.id);
  });

  transaction();

  const updatedExperiment = getExperiment(experiment.id);
  if (updatedExperiment && updatedExperiment.spent >= updatedExperiment.budget * 0.95) {
    db.prepare('UPDATE experiments SET status = ? WHERE id = ?').run('completed', experiment.id);
  }
}

function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }, model: string): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 30, output: 60 },
    'gpt-4o': { input: 5, output: 15 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
  };

  const modelPricing = pricing[model] || { input: 1, output: 2 };
  const inputCost = (usage.prompt_tokens / 1_000_000) * modelPricing.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * modelPricing.output;
  
  return inputCost + outputCost;
}

export function getVariantComparison(experimentId: string) {
  const experiment = getExperiment(experimentId);
  if (!experiment) throw new Error('Experiment not found');

  const totalRequests = experiment.results.reduce((sum, r) => sum + r.requests, 0);
  
  const comparisons = experiment.variants.map(variant => {
    const result = experiment.results.find(r => r.variantId === variant.id);
    if (!result) return null;

    const costPerRequest = result.requests > 0 ? result.totalCost / result.requests : 0;
    const efficiency = costPerRequest > 0 ? result.successRate / (costPerRequest * 1000) : 0;
    const shareOfRequests = totalRequests > 0 ? (result.requests / totalRequests) * 100 : 0;

    return {
      variantId: variant.id,
      name: variant.name,
      model: variant.model,
      requests: result.requests,
      totalCost: result.totalCost,
      avgLatency: result.avgLatency,
      totalTokens: result.totalTokens,
      successRate: result.successRate,
      costPerRequest,
      efficiency,
      shareOfRequests,
    };
  }).filter(Boolean);

  const bestVariant = comparisons.reduce((best, current) => 
    current.efficiency > best.efficiency ? current : best
  , comparisons[0]);

  return {
    variants: comparisons,
    bestVariant: bestVariant?.variantId,
    totalRequests,
    totalCost: experiment.spent,
    budget: experiment.budget,
    budgetUtilization: (experiment.spent / experiment.budget) * 100,
  };
}

export function getOptimizationSuggestions(experimentId: string) {
  const experiment = getExperiment(experimentId);
  if (!experiment) throw new Error('Experiment not found');

  const suggestions = [];
  const variants = experiment.results.map(r => {
    const v = experiment.variants.find(v => v.id === r.variantId);
    return { ...r, variant: v };
  });

  const best = variants.reduce((best, curr) =>
    (curr.successRate / (curr.totalCost || 1)) > (best.successRate / (best.totalCost || 1)) ? curr : best
  );

  variants.forEach(v => {
    if (v.variantId !== best.variantId && v.requests > 2) {
      const currentCostPerReq = v.totalCost / v.requests;
      const bestCostPerReq = best.totalCost / best.requests;
      const potentialSavings = ((currentCostPerReq - bestCostPerReq) * v.requests).toFixed(4);
      
      suggestions.push({
        type: 'model_switch',
        from: v.variant?.model,
        to: best.variant?.model,
        reason: `${best.variant?.name} has higher efficiency than ${v.variant?.name}`,
        estimatedSavings: potentialSavings
      });
    }
  });

  return { suggestions, bestVariant: best.variant?.name };
}

export async function getOtariBudgets(): Promise<Budget[]> {
  try {
    const budgets = await getBudgets();
    return budgets.map(b => ({
      ...b,
      status: b.spent / b.limit < 0.8 ? 'green' : b.spent / b.limit < 1 ? 'yellow' : 'red',
    }));
  } catch (error) {
    console.error('Failed to fetch Otari budgets:', error);
    return [];
  }
}
