import { Router } from 'express';
import { getUsage } from '../services/otari-client';

const router = Router();

router.get('/usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const usage = await getUsage(
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(usage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch usage';
    res.status(500).json({ error: message });
  }
});

export default router;
