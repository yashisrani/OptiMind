import type { Experiment } from '../../shared/src';

export interface GuardrailRule {
  id: string;
  type: 'budget_limit' | 'model_restriction' | 'rate_limit' | 'prompt_safety';
  enabled: boolean;
  config: {
    maxBudget?: number;
    allowedModels?: string[];
    maxRequestsPerMinute?: number;
    blockedPatterns?: string[];
  };
}

const defaultRules: GuardrailRule[] = [
  {
    id: 'budget_safety',
    type: 'budget_limit',
    enabled: true,
    config: {
      maxBudget: 100,
    },
  },
  {
    id: 'model_restriction',
    type: 'model_restriction',
    enabled: false,
    config: {
      allowedModels: ['gpt-4o', 'gpt-3.5-turbo', 'claude-3-haiku'],
    },
  },
  {
    id: 'rate_limit',
    type: 'rate_limit',
    enabled: true,
    config: {
      maxRequestsPerMinute: 60,
    },
  },
  {
    id: 'prompt_safety',
    type: 'prompt_safety',
    enabled: true,
    config: {
      blockedPatterns: ['ignore previous instructions', 'you are now', 'jailbreak'],
    },
  },
];

const experimentRules = new Map<string, GuardrailRule[]>();

export function getGuardrailRules(experimentId?: string): GuardrailRule[] {
  if (experimentId) {
    return experimentRules.get(experimentId) || defaultRules;
  }
  return defaultRules;
}

export function updateGuardrailRules(experimentId: string, rules: GuardrailRule[]): void {
  experimentRules.set(experimentId, rules);
}

export function checkBudgetGuardrail(experiment: Experiment): { allowed: boolean; reason?: string } {
  const rules = getGuardrailRules(experiment.id);
  const budgetRule = rules.find(r => r.type === 'budget_limit' && r.enabled);
  
  if (!budgetRule) return { allowed: true };
  
  if (experiment.spent >= budgetRule.config.maxBudget!) {
    return { allowed: false, reason: `Budget limit of $${budgetRule.config.maxBudget} reached` };
  }
  
  if (experiment.spent >= budgetRule.config.maxBudget! * 0.9) {
    return { allowed: true, reason: `Warning: 90% of budget used` };
  }
  
  return { allowed: true };
}

export function checkModelGuardrail(model: string): { allowed: boolean; reason?: string } {
  const rules = getGuardrailRules();
  const modelRule = rules.find(r => r.type === 'model_restriction' && r.enabled);
  
  if (!modelRule) return { allowed: true };
  
  if (modelRule.config.allowedModels && !modelRule.config.allowedModels.includes(model)) {
    return { allowed: false, reason: `Model ${model} not in allowed list` };
  }
  
  return { allowed: true };
}

export function checkPromptGuardrail(prompt: string): { allowed: boolean; reason?: string } {
  const rules = getGuardrailRules();
  const safetyRule = rules.find(r => r.type === 'prompt_safety' && r.enabled);
  
  if (!safetyRule) return { allowed: true };
  
  const lowerPrompt = prompt.toLowerCase();
  const blockedPattern = safetyRule.config.blockedPatterns?.find(pattern => 
    lowerPrompt.includes(pattern.toLowerCase())
  );
  
  if (blockedPattern) {
    return { allowed: false, reason: `Prompt contains blocked pattern: ${blockedPattern}` };
  }
  
  return { allowed: true };
}
