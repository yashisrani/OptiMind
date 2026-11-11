import type { Experiment } from '../../shared/src';
import { getDatabase } from './database';

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
      allowedModels: ['xiaomi/mimo-v2.6-pro', 'alibaba/qwen3.5-27b', 'deepseek/deepseek-v4-pro'],
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
      blockedPatterns: ['ignore previous instructions', 'ignore all previous', 'you are now', 'jailbreak', 'DAN mode'],
    },
  },
];

export function getGuardrailRules(experimentId: string = 'global'): GuardrailRule[] {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM guardrail_rules WHERE experiment_id = ?').all(experimentId) as any[];
    
    if (rows && rows.length > 0) {
      return rows.map(r => ({
        id: r.id,
        type: r.type,
        enabled: Boolean(r.enabled),
        config: JSON.parse(r.config || '{}'),
      }));
    }
  } catch (err) {
    console.warn('Error reading guardrails from db:', err);
  }
  return defaultRules;
}

export function updateGuardrailRules(experimentId: string = 'global', rules: GuardrailRule[]): void {
  try {
    const db = getDatabase();
    // Ensure table without strict foreign key failure for 'global'
    db.exec(`
      CREATE TABLE IF NOT EXISTS guardrail_rules (
        id TEXT PRIMARY KEY,
        experiment_id TEXT,
        type TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        config TEXT
      );
    `);

    const upsert = db.prepare(`
      INSERT INTO guardrail_rules (id, experiment_id, type, enabled, config)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        experiment_id = excluded.experiment_id,
        type = excluded.type,
        enabled = excluded.enabled,
        config = excluded.config
    `);

    const transaction = db.transaction(() => {
      for (const rule of rules) {
        upsert.run(rule.id, experimentId, rule.type, rule.enabled ? 1 : 0, JSON.stringify(rule.config || {}));
      }
    });

    transaction();
  } catch (error) {
    console.error('Failed to save guardrail rules to DB:', error);
    throw error;
  }
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

export function checkModelGuardrail(model: string, experimentId?: string): { allowed: boolean; reason?: string } {
  const rules = getGuardrailRules(experimentId);
  const modelRule = rules.find(r => r.type === 'model_restriction' && r.enabled);
  
  if (!modelRule) return { allowed: true };
  
  if (modelRule.config.allowedModels && !modelRule.config.allowedModels.includes(model)) {
    return { allowed: false, reason: `Model ${model} not in allowed list` };
  }
  
  return { allowed: true };
}

export function checkPromptGuardrail(prompt: string, experimentId?: string): { allowed: boolean; reason?: string } {
  const rules = getGuardrailRules(experimentId);
  const safetyRule = rules.find(r => r.type === 'prompt_safety' && r.enabled);
  
  if (!safetyRule) return { allowed: true };
  
  const lowerPrompt = prompt.toLowerCase();
  const blockedPattern = safetyRule.config.blockedPatterns?.find(pattern => 
    lowerPrompt.includes(pattern.toLowerCase())
  );
  
  if (blockedPattern) {
    return { allowed: false, reason: `Prompt blocked by Otari Policy: contains prohibited pattern "${blockedPattern}"` };
  }
  
  return { allowed: true };
}
