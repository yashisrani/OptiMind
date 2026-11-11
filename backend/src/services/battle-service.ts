import { chatCompletion } from './otari-client';
import { calculateCost } from './experiment-service';

interface BattleResult {
  model: string;
  response: string;
  latency: number;
  cost: number;
  tokens: number;
  status: 'success' | 'failed';
  error?: string;
  costScore?: number;
  speedScore?: number;
}

interface BattleResponse {
  results: BattleResult[];
  totalCost: number;
  avgLatency: number;
  duration: number;
  winner: string;
}

export async function runModelBattle(
  systemPrompt: string,
  userInput: string,
  models: string[] = [
    'deepseek/deepseek-v4-pro',
    'meta-llama/Llama-3.1-70B-Instruct',
    'Qwen/Qwen2.5-72B-Instruct',
    'mistral/mistral-large-latest',
    'openai/gpt-4o'
  ]
): Promise<BattleResponse> {
  const startTime = Date.now();

  const results = await Promise.allSettled(
    models.map(async (model) => {
      const modelStart = Date.now();
      try {
        const response = await chatCompletion({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
          ]
        });
        const latency = Date.now() - modelStart;
        const cost = calculateCost(response.usage, model);

        return {
          model,
          response: response.choices[0].message.content,
          latency,
          cost,
          tokens: response.usage.total_tokens,
          status: 'success' as const
        };
      } catch (error) {
        return {
          model,
          response: '',
          latency: Date.now() - modelStart,
          cost: 0,
          tokens: 0,
          status: 'failed' as const,
          error: (error as Error).message
        };
      }
    })
  );

  const battleResults: BattleResult[] = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { model: '', response: '', latency: 0, cost: 0, tokens: 0, status: 'failed', error: 'Unknown error' }
  );

  const successfulResults = battleResults.filter((r) => r.status === 'success');
  const minCost = Math.min(...successfulResults.map((r) => r.cost));
  const minLatency = Math.min(...successfulResults.map((r) => r.latency));

  battleResults.forEach((r) => {
    if (r.status === 'success') {
      r.costScore = minCost > 0 ? Math.round((minCost / r.cost) * 100) : 100;
      r.speedScore = Math.round((minLatency / r.latency) * 100);
    }
  });

  // Determine winner based on combined score (cost + speed)
  const scored = battleResults
    .filter((r) => r.status === 'success')
    .map((r) => ({
      ...r,
      totalScore: (r.costScore || 0) + (r.speedScore || 0)
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const winner = scored.length > 0 ? scored[0].model : 'N/A';

  return {
    results: battleResults,
    totalCost: successfulResults.reduce((sum, r) => sum + r.cost, 0),
    avgLatency: successfulResults.length > 0 ? successfulResults.reduce((sum, r) => sum + r.latency, 0) / successfulResults.length : 0,
    duration: Date.now() - startTime,
    winner
  };
}
