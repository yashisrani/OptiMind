import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { compressPrompt } from '@/services/api';

interface CompressionResult {
  original: { prompt: string; tokens: number; cost: number };
  compressed: { prompt: string; tokens: number; cost: number };
  savings: { tokens: number; cost: number; percentage: number };
}

const MODELS = [
  'alibaba/qwen3.8-flash',
  'deepseek/deepseek-v4-pro',
  'mistralai/mistral-small-4',
];

export function CompressionPage() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(MODELS[0]);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompress = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const data = await compressPrompt(prompt, model);
      setResult(data);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Prompt Compression Engine</h1>
      <p className="text-muted-foreground mb-8">
        Reduce token usage and costs by automatically rewriting verbose prompts.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>Paste a long prompt to compress it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Target Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Original Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste your long, verbose prompt here..."
              rows={6}
            />
          </div>
          <Button onClick={handleCompress} disabled={loading || !prompt} className="w-full">
            {loading ? 'Compressing...' : 'Compress Prompt'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Original</CardTitle>
              <CardDescription>{result.original.tokens} tokens • ${result.original.cost.toFixed(6)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">{result.original.prompt}</p>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Compressed</CardTitle>
              <CardDescription>{result.compressed.tokens} tokens • ${result.compressed.cost.toFixed(6)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">{result.compressed.prompt}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {result && (
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardContent className="py-6 text-center">
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              You saved {result.savings.percentage.toFixed(1)}% on costs!
            </h2>
            <p className="text-green-800">
              Reduced tokens by {result.savings.tokens} and saved ${result.savings.cost.toFixed(6)} per request.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
