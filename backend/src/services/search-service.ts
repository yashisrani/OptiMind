import { webSearch } from './otari-client';
import { getExperiment } from './experiment-service';

export async function searchOptimizationTechniques(experimentId: string) {
  const experiment = getExperiment(experimentId);
  if (!experiment) throw new Error('Experiment not found');

  const models = experiment.variants.map(v => v.model).join(', ');
  const query = `best practices for optimizing ${models} LLM prompts cost efficiency 2024`;

  const results = await webSearch(query);

  const techniques = results.results.slice(0, 5).map(r => ({
    title: r.title,
    url: r.url,
    summary: r.snippet.substring(0, 200),
  }));

  return {
    query,
    techniques,
    count: techniques.length,
  };
}

export async function searchPromptEngineeringTips(experimentId: string) {
  const experiment = getExperiment(experimentId);
  if (!experiment) throw new Error('Experiment not found');

  const bestVariant = experiment.results.reduce((best, curr) =>
    (curr.successRate / (curr.totalCost || 1)) > (best.successRate / (best.totalCost || 1)) ? curr : best
  );

  const bestModel = experiment.variants.find(v => v.id === bestVariant.variantId)?.model || 'GPT-4';
  const query = `${bestModel} prompt engineering tips reduce tokens improve accuracy`;

  const results = await webSearch(query);

  const tips = results.results.slice(0, 5).map(r => ({
    title: r.title,
    url: r.url,
    summary: r.snippet.substring(0, 200),
  }));

  return {
    query,
    tips,
    bestModel,
    count: tips.length,
  };
}
