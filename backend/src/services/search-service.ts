import { getExperiment } from './experiment-service';
import { webSearch as otariWebSearch } from './otari-client';

interface ExaClient {
  search: (query: string, options?: any) => Promise<{ results: any[] }>;
}

let exaClient: ExaClient | null = null;
let exaLoadPromise: Promise<ExaClient | null> | null = null;

async function getExa(): Promise<ExaClient | null> {
  if (exaClient) return exaClient;
  if (exaLoadPromise) return exaLoadPromise;

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey || apiKey === 'your-exa-api-key-here') {
    return null;
  }

  exaLoadPromise = (async () => {
    try {
      const ExaModule = await import('exa-js');
      const Exa = ExaModule.default || ExaModule;
      exaClient = new Exa(apiKey);
      return exaClient;
    } catch {
      return null;
    }
  })();

  return exaLoadPromise;
}

function cleanSummary(text: string, maxChars: number = 220): string {
  if (!text) return 'No summary available';

  const cleaned = text
    .replace(/^(Summary:|Here’s a concise summary[^:]*:|Tip:)\s*/i, '')
    .replace(/###+\s*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\|[^\n]+\|/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\.\.\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If the summary starts with the title, remove the duplicate title at the beginning
  return cleaned.length <= maxChars ? cleaned : cleaned.substring(0, maxChars) + '...';
}

async function performSearch(query: string, summaryPrompt: string) {
  // 1. First try Otari native search (uses Exa configured in Otari dashboard)
  try {
    const otariRes = await otariWebSearch(query);
    if (otariRes.results && otariRes.results.length > 0) {
      return otariRes.results.slice(0, 3).map((r: any) => {
        let snippet = (r.snippet || r.text || '').trim();
        // Remove duplicate title prefix in snippet if present
        if (r.title && snippet.startsWith(r.title)) {
          snippet = snippet.substring(r.title.length).trim();
        }
        return {
          title: r.title || 'Search Result',
          url: r.url,
          summary: cleanSummary(snippet, 180),
        };
      });
    }
  } catch (err) {
    console.warn('Otari web search fallback to direct Exa SDK:', (err as Error).message);
  }

  // 2. Direct Exa SDK fallback
  const exa = await getExa();
  if (exa) {
    const result = await exa.search(query, {
      type: 'auto',
      numResults: 3,
      contents: {
        summary: { query: summaryPrompt }
      }
    });

    return result.results.slice(0, 3).map((r: any) => {
      const raw = r.summary || r.highlights?.[0] || r.text || 'No summary available';
      return {
        title: r.title || 'Search Result',
        url: r.url,
        summary: cleanSummary(raw, 180),
      };
    });
  }

  throw new Error('Web search not configured in Otari dashboard or EXA_API_KEY');
}

export async function searchOptimizationTechniques(experimentId: string) {
  const experiment = getExperiment(experimentId);
  if (!experiment) throw new Error('Experiment not found');

  const models = experiment.variants.map(v => v.model).join(', ');
  const query = `best practices for optimizing ${models} LLM prompts cost efficiency 2024`;

  try {
    const techniques = await performSearch(
      query,
      'Provide a 1 to 2 sentence concise actionable summary of this prompt and cost optimization tip.'
    );
    return { query, techniques, count: techniques.length };
  } catch (error) {
    return {
      query,
      techniques: [{ title: 'Search Unavailable', url: 'https://otari.ai', summary: (error as Error).message }],
      count: 1,
      fallback: true,
    };
  }
}

export async function searchPromptEngineeringTips(experimentId: string) {
  const experiment = getExperiment(experimentId);
  if (!experiment) throw new Error('Experiment not found');

  const bestVariant = experiment.results.reduce((best, curr) =>
    (curr.successRate / (curr.totalCost || 1)) > (best.successRate / (best.totalCost || 1)) ? curr : best
  );

  const bestModel = experiment.variants.find(v => v.id === bestVariant.variantId)?.model || 'GPT-4';
  const query = `${bestModel} prompt engineering tips reduce tokens improve accuracy`;

  try {
    const tips = await performSearch(
      query,
      'Provide a 1 to 2 sentence concise actionable prompt engineering tip.'
    );
    return { query, tips, bestModel, count: tips.length };
  } catch (error) {
    return {
      query,
      tips: [{ title: 'Search Unavailable', url: 'https://otari.ai', summary: (error as Error).message }],
      bestModel,
      count: 1,
      fallback: true,
    };
  }
}
