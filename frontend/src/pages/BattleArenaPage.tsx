import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { runModelBattle } from '@/services/api';

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

const AVAILABLE_MODELS = [
  'alibaba/qwen3.8-flash',
  'mistralai/mistral-small-4',
  'openai/gpt-oss-120b',
  'nvidia/nemotron-3.5-super-vl-120b-a12b',
  'deepseek/deepseek-v4-pro',
  'xiaomi/mimo-v2.6-pro',
  'bytedance/seed-2.0-pro',
  'nousresearch/hermes-4-405b',
];

export function BattleArenaPage() {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [userInput, setUserInput] = useState('Explain quantum computing in one sentence.');
  const [selectedModels, setSelectedModels] = useState<string[]>(AVAILABLE_MODELS);
  const [battleResult, setBattleResult] = useState<BattleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const handleBattle = async () => {
    if (selectedModels.length < 2) {
      alert('Select at least 2 models');
      return;
    }
    setLoading(true);
    setBattleResult(null);
    try {
      const result = await runModelBattle(systemPrompt, userInput, selectedModels);
      setBattleResult(result);
    } catch (error) {
      console.error('Battle failed:', error);
      alert('Battle failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Model Battle Arena</h1>
        <p className="text-muted-foreground">
          Run the same prompt through multiple models simultaneously. Compare cost, speed, and quality in real-time.
        </p>
      </div>

      {/* Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Battle Configuration</CardTitle>
          <CardDescription>Set up your prompt and select models to compete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">System Prompt</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              placeholder="You are a helpful assistant..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">User Input</label>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
              placeholder="Enter your test question..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Models (min 2)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AVAILABLE_MODELS.map((model) => (
                <label
                  key={model}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedModels.includes(model)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model)}
                    onChange={() => toggleModel(model)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium truncate">{model.split('/')[1] || model}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleBattle} disabled={loading || selectedModels.length < 2} className="w-full">
            {loading ? 'Battling...' : `Start Battle (${selectedModels.length} models)`}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {battleResult && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Winner</p>
                <p className="text-2xl font-bold text-primary">{battleResult.winner.split('/')[1] || battleResult.winner}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${battleResult.totalCost.toFixed(6)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">{Math.round(battleResult.avgLatency)}ms</p>
              </CardContent>
            </Card>
          </div>

          {/* Model Results */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Results</h2>
            {battleResult.results.map((result, index) => (
              <Card key={index} className={result.model === battleResult.winner ? 'border-primary border-2' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{result.model}</CardTitle>
                        {result.model === battleResult.winner && (
                          <span className="text-xs text-primary font-medium">🏆 Winner</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                </CardHeader>

                {result.status === 'success' && (
                  <CardContent className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Cost</p>
                        <p className="text-lg font-mono font-bold">${result.cost.toFixed(6)}</p>
                        <div className="h-2 bg-secondary rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${result.costScore || 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Latency</p>
                        <p className="text-lg font-mono font-bold">{result.latency}ms</p>
                        <div className="h-2 bg-secondary rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${result.speedScore || 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tokens</p>
                        <p className="text-lg font-mono font-bold">{result.tokens}</p>
                      </div>
                    </div>

                    {/* Response */}
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedModel(expandedModel === result.model ? null : result.model)}
                        className="text-sm"
                      >
                        {expandedModel === result.model ? 'Hide' : 'Show'} Response
                      </Button>
                      {expandedModel === result.model && (
                        <div className="mt-2 p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                          {result.response}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}

                {result.status === 'failed' && (
                  <CardContent>
                    <p className="text-sm text-red-600">{result.error}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
