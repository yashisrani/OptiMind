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
import { searchOptimizationTechniques, searchPromptEngineeringTips } from '../services/search-service';
import { getTelemetryMetrics } from '../services/telemetry-service';
import { fetchTraces, fetchTraceDetail } from '../services/traces-service';

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

router.get('/:id/search/techniques', async (req, res) => {
  try {
    const result = await searchOptimizationTechniques(req.params.id);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search';
    res.status(500).json({ error: message });
  }
});

router.get('/:id/search/tips', async (req, res) => {
  try {
    const result = await searchPromptEngineeringTips(req.params.id);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search';
    res.status(500).json({ error: message });
  }
});

router.get('/telemetry', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await getTelemetryMetrics(
      startDate as string | undefined,
      endDate as string | undefined
    );
    
    if (!metrics) {
      res.status(500).json({ error: 'Failed to fetch telemetry' });
      return;
    }
    
    res.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get telemetry';
    res.status(500).json({ error: message });
  }
});

router.get('/traces', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const traces = await fetchTraces(limit);
    res.json(traces);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch traces';
    res.status(500).json({ error: message });
  }
});

router.get('/traces/:traceId', async (req, res) => {
  try {
    const trace = await fetchTraceDetail(req.params.traceId);
    if (!trace) {
      res.status(404).json({ error: 'Trace not found' });
      return;
    }
    res.json(trace);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch trace';
    res.status(500).json({ error: message });
  }
});

router.get('/:id/export', (req, res) => {
  const experiment = getExperiment(req.params.id);
  if (!experiment) {
    res.status(404).json({ error: 'Experiment not found' });
    return;
  }

  const history = getOptimizationHistory(req.params.id);

  let csv = 'Type,ID,Name,Model,Requests,Total Cost,Avg Latency,Success Rate,Total Tokens\n';
  experiment.results.forEach(r => {
    const v = experiment.variants.find(v => v.id === r.variantId);
    csv += `Result,${r.variantId},"${v?.name || ''}","${v?.model || ''}",${r.requests},${r.totalCost},${r.avgLatency},${r.successRate},${r.totalTokens}\n`;
  });

  csv += '\nType,Timestamp,Event,Description,Metadata\n';
  history.forEach(h => {
    const meta = JSON.stringify(h.metadata).replace(/"/g, '""');
    csv += `Event,${h.timestamp},${h.type},"${h.description.replace(/"/g, '""')}","${meta}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=optimind-experiment-${experiment.id}.csv`);
  res.send(csv);
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
