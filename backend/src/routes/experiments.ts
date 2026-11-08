import { Router } from 'express';
import { z } from 'zod';
import {
  createExperiment,
  getExperiment,
  listExperiments,
  runExperiment,
  getVariantComparison,
  getOptimizationSuggestions,
  getOtariBudgets,
} from '../services/experiment-service';
import { getOptimizationHistory } from '../services/optimization-history';
import { getGuardrailRules, updateGuardrailRules } from '../services/guardrails';
import { analyzeExperiment } from '../services/analysis-service';

const router = Router();

const createExperimentSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  variants: z.array(z.object({
    name: z.string(),
    prompt: z.string(),
    model: z.string(),
    temperature: z.number().min(0).max(2).optional(),
  })).min(2),
  budget: z.number().positive(),
});

router.post('/', (req, res) => {
  const result = createExperimentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid input', details: result.error.errors });
    return;
  }

  const { name, description, variants, budget } = result.data;
  const experiment = createExperiment(name, description, variants, budget);
  res.status(201).json(experiment);
});

router.get('/', (_req, res) => {
  const experiments = listExperiments();
  res.json(experiments);
});

router.get('/:id', (req, res) => {
  const experiment = getExperiment(req.params.id);
  if (!experiment) {
    res.status(404).json({ error: 'Experiment not found' });
    return;
  }
  res.json(experiment);
});

router.get('/:id/comparison', (req, res) => {
  try {
    const comparison = getVariantComparison(req.params.id);
    res.json(comparison);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get comparison';
    res.status(404).json({ error: message });
  }
});

router.get('/:id/optimize', (req, res) => {
  try {
    const suggestions = getOptimizationSuggestions(req.params.id);
    res.json(suggestions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get suggestions';
    res.status(404).json({ error: message });
  }
});

router.get('/:id/history', (req, res) => {
  try {
    const history = getOptimizationHistory(req.params.id);
    res.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get history';
    res.status(500).json({ error: message });
  }
});

router.get('/guardrails', (_req, res) => {
  const rules = getGuardrailRules();
  res.json(rules);
});

router.get('/:id/guardrails', (req, res) => {
  const rules = getGuardrailRules(req.params.id);
  res.json(rules);
});

router.put('/:id/guardrails', (req, res) => {
  try {
    updateGuardrailRules(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update guardrails';
    res.status(500).json({ error: message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const result = await analyzeExperiment(req.params.id);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze';
    res.status(500).json({ error: message });
  }
});

router.post('/:id/run', async (req, res) => {
  try {
    const { input } = z.object({ input: z.string() }).parse(req.body);
    const result = await runExperiment(req.params.id, input);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run experiment';
    res.status(500).json({ error: message });
  }
});

router.get('/otari/budgets', async (_req, res) => {
  try {
    const budgets = await getOtariBudgets();
    res.json(budgets);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch budgets';
    res.status(500).json({ error: message });
  }
});

export default router;
