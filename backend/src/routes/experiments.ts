import { Router } from 'express';
import { z } from 'zod';
import {
  createExperiment,
  getExperiment,
  listExperiments,
  runExperiment,
} from '../services/experiment-service';

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

export default router;
