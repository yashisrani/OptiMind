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
  calculateCost,
} from '../services/experiment-service';
import { getOptimizationHistory, logModelSwitch } from '../services/optimization-history';
import { getGuardrailRules, updateGuardrailRules } from '../services/guardrails';
import { analyzeExperiment } from '../services/analysis-service';
import { searchOptimizationTechniques, searchPromptEngineeringTips } from '../services/search-service';
import { chatCompletion } from '../services/otari-client';
import { getDatabase } from '../services/database';
import { runModelBattle } from '../services/battle-service';
import { compressPrompt } from '../services/compression-service';

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

// MCP Discovery endpoint
router.get('/mcp/tools', (_req, res) => {
  res.json({
    name: 'optimind-mcp-server',
    version: '1.0.0',
    protocol: 'model-context-protocol',
    tools: [
      {
        name: 'get_active_experiments',
        description: 'Get all active AI optimization experiments, models, and spending metrics in OptiMind.',
        endpoint: '/api/experiments',
      },
      {
        name: 'get_experiment_metrics',
        description: 'Get detailed Pareto efficiency and cost comparison for an experiment.',
        endpoint: '/api/experiments/:id/comparison',
      },
      {
        name: 'check_guardrail_policy',
        description: 'Inspect active security guardrails, rate limits, and model whitelists enforced by Otari.',
        endpoint: '/api/experiments/guardrails',
      },
      {
        name: 'knowledge_prompt_techniques',
        description: 'Fetch curated open-weight prompt optimization techniques and guidelines.',
        endpoint: '/api/experiments/:id/search/techniques',
      },
    ],
  });
});

router.get('/guardrails', (_req, res) => {
  const rules = getGuardrailRules('global');
  res.json(rules);
});

router.put('/guardrails', (req, res) => {
  try {
    updateGuardrailRules('global', req.body);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update guardrails';
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

router.get('/otari/budgets', async (_req, res) => {
  try {
    const budgets = await getOtariBudgets();
    res.json(budgets);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch budgets';
    res.status(500).json({ error: message });
  }
});

router.post('/compress', async (req, res) => {
  try {
    const { prompt, model } = z.object({
      prompt: z.string(),
      model: z.string(),
    }).parse(req.body);

    const result = await compressPrompt(prompt, model);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to compress prompt';
    res.status(500).json({ error: message });
  }
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

router.post('/:id/analyze-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ type: 'info', message: 'Initializing analysis engine...' });
    await new Promise(r => setTimeout(r, 600));

    send({ type: 'info', message: 'Fetching experiment data from SQLite...' });
    const experiment = getExperiment(req.params.id);
    if (!experiment) throw new Error('Experiment not found');
    await new Promise(r => setTimeout(r, 600));

    send({ type: 'info', message: 'Generating Python analysis script...' });
    await new Promise(r => setTimeout(r, 600));

    send({ type: 'info', message: 'Executing code via Otari Sandbox...' });
    const result = await analyzeExperiment(req.params.id);
    await new Promise(r => setTimeout(r, 600));

    send({ type: 'info', message: 'Analysis complete.' });
    send({ type: 'result', data: result });
  } catch (error) {
    send({ type: 'error', message: (error as Error).message });
  } finally {
    res.end();
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
    let message = error instanceof Error ? error.message : 'Failed to run experiment';
    
    // Parse Otari guardrail errors into clean user-friendly messages
    if (message.includes('guardrail') || message.includes('blocked') || message.includes('safety') || message.includes('prohibited')) {
      try {
        const jsonMatch = message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const detail = parsed.detail;
          if (detail && typeof detail === 'object' && detail.message) {
            const profile = detail.guardrails?.[0]?.profile ? ` (Profile: ${detail.guardrails[0].profile})` : '';
            message = `${detail.message}${profile}`;
          } else if (typeof detail === 'string') {
            message = detail;
          }
        }
      } catch {
        // Fallback cleanup
        message = message.replace(/Otari API error:\s*\d+\s*-\s*/, '');
      }

      res.status(403).json({ error: message, guardrailBlocked: true });
      return;
    }

    res.status(500).json({ error: message });
  }
});

router.post('/:id/auto-optimize', async (req, res) => {
  try {
    const experiment = getExperiment(req.params.id);
    if (!experiment) throw new Error('Experiment not found');

    // 1. Find the worst performing variant
    const worstResult = experiment.results.reduce((worst, curr) => 
      (curr.successRate / (curr.totalCost || 1)) < (worst.successRate / (worst.totalCost || 1)) ? curr : worst
    );
    const worstVariant = experiment.variants.find(v => v.id === worstResult.variantId);
    if (!worstVariant) throw new Error('No variants found');

    // 2. Get optimization tips via Exa Web Search (limit to 2 short tips to save tokens)
    const searchResults = await searchPromptEngineeringTips(req.params.id);
    const tipsContext = searchResults.tips.slice(0, 2).map((t: any) => t.summary).join(' ');

    // 3. Use LLM to rewrite the prompt with low-token prompt and fast model
    const rewritePrompt = `Rewrite this prompt to be concise and token-efficient. Keep core instructions:\n"${worstVariant.prompt}"\nTips: ${tipsContext}\nReturn ONLY the rewritten prompt.`;

    const rewriteResponse = await chatCompletion({
      model: 'xiaomi/mimo-v2.6-pro',
      messages: [{ role: 'user', content: rewritePrompt }],
      max_tokens: 150,
    });

    const newPrompt = rewriteResponse.choices[0].message.content.trim();

    // 4. Test the new prompt with minimal tokens
    const testInput = "Quantum computing in 5 words.";
    const startTime = Date.now();
    
    const newTestResponse = await chatCompletion({
      model: 'xiaomi/mimo-v2.6-pro',
      messages: [{ role: 'system', content: newPrompt }, { role: 'user', content: testInput }],
      max_tokens: 50,
    });
    
    const newLatency = Date.now() - startTime;
    const newCost = calculateCost(newTestResponse.usage, worstVariant.model);
    const oldCostPerReq = worstResult.requests > 0 ? worstResult.totalCost / worstResult.requests : 1;

    // 5. Compare and Deploy if better
    const isBetter = newCost < oldCostPerReq || newLatency < worstResult.avgLatency;

    if (isBetter) {
      const db = getDatabase();
      db.prepare('UPDATE variants SET prompt = ? WHERE id = ?').run(newPrompt, worstVariant.id);
      logModelSwitch(req.params.id, worstVariant.model, worstVariant.model, oldCostPerReq - newCost);
    }

    res.json({
      success: true,
      optimized: isBetter,
      oldPrompt: worstVariant.prompt,
      newPrompt: newPrompt,
      oldCost: oldCostPerReq,
      newCost: newCost,
      latencyImprovement: Math.max(0, worstResult.avgLatency - newLatency),
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to auto-optimize';
    res.status(500).json({ error: message });
  }
});

router.post('/battle', async (req, res) => {
  try {
    const { systemPrompt, userInput, models } = z.object({
      systemPrompt: z.string(),
      userInput: z.string(),
      models: z.array(z.string()).optional(),
    }).parse(req.body);

    const result = await runModelBattle(systemPrompt, userInput, models);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run battle';
    res.status(500).json({ error: message });
  }
});

export default router;
