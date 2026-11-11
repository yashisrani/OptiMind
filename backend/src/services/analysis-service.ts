import { getExperiment } from './experiment-service';
import { executeCode } from './otari-client';

export async function analyzeExperiment(experimentId: string) {
  const experiment = getExperiment(experimentId);
  if (!experiment) throw new Error('Experiment not found');

  const pythonCode = `
import json

data = ${JSON.stringify(experiment.results)}
variants = ${JSON.stringify(experiment.variants)}

results = []
for r in data:
    v = next((x for x in variants if x['id'] == r['variantId']), None)
    if v:
        efficiency = r['successRate'] / (r['totalCost'] if r['totalCost'] > 0 else 1)
        results.append({
            "name": v['name'],
            "model": v['model'],
            "efficiency": round(efficiency, 4),
            "cost": r['totalCost'],
            "requests": r['requests']
        })

results.sort(key=lambda x: x['efficiency'], reverse=True)
print(json.dumps({"ranking": results, "best": results[0]['name'] if results else None}))
`;

  try {
    const result = await executeCode(pythonCode);
    
    if (result.exit_code !== 0) {
      throw new Error('Code execution failed');
    }

    try {
      return JSON.parse(result.output);
    } catch {
      return { raw: result.output };
    }
  } catch (error) {
    console.log('Otari code execution not available, using local analysis');
    
    const results = experiment.results.map(r => {
      const v = experiment.variants.find(v => v.id === r.variantId);
      if (!v) return null;
      const efficiency = r.successRate / (r.totalCost > 0 ? r.totalCost : 1);
      return {
        name: v.name,
        model: v.model,
        efficiency: Math.round(efficiency * 10000) / 10000,
        cost: r.totalCost,
        requests: r.requests,
      };
    }).filter(Boolean);

    results.sort((a: any, b: any) => b.efficiency - a.efficiency);

    return {
      ranking: results,
      best: results[0]?.name || null,
      fallback: true,
      message: 'Analysis performed locally (Otari sandbox not available)',
    };
  }
}
