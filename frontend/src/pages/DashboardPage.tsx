import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listExperiments, runExperiment } from '@/services/api';
import type { Experiment } from '../../../shared/src';

export function DashboardPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ response: string; variant: string; latency: number; tokens: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    const data = await listExperiments();
    setExperiments(data);
  };

  const handleRun = async () => {
    if (!selectedExperiment || !input) return;
    setLoading(true);
    try {
      const res = await runExperiment(selectedExperiment.id, input);
      setResult({ response: res.response, variant: res.variant.name, latency: res.latency, tokens: res.tokens });
      await loadExperiments();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Experiments</CardTitle>
            <CardDescription>Total experiments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{experiments.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
            <CardDescription>Running experiments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{experiments.filter(e => e.status === 'active').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Spent</CardTitle>
            <CardDescription>Across all experiments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${experiments.reduce((sum, e) => sum + e.spent, 0).toFixed(4)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Experiments</CardTitle>
            <CardDescription>Click to select</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {experiments.length === 0 ? (
              <p className="text-muted-foreground">No experiments yet</p>
            ) : (
              experiments.map(exp => (
                <div
                  key={exp.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedExperiment?.id === exp.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedExperiment(exp)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{exp.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      exp.status === 'active' ? 'bg-green-100 text-green-800' :
                      exp.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exp.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{exp.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Spent: ${exp.spent.toFixed(4)}</span>
                    <span>Budget: ${exp.budget}</span>
                    <span>Variants: {exp.variants.length}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Experiment</CardTitle>
            <CardDescription>Test with input</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedExperiment ? (
              <p className="text-muted-foreground">Select an experiment</p>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Input</label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter your test input..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <Button onClick={handleRun} disabled={loading || !input}>
                  {loading ? 'Running...' : 'Run'}
                </Button>

                {result && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="text-sm">
                      <span className="font-medium">Variant: </span>
                      <span className="text-muted-foreground">{result.variant}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Latency: </span>
                      <span className="text-muted-foreground">{result.latency}ms</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Tokens: </span>
                      <span className="text-muted-foreground">{result.tokens}</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Response</label>
                      <div className="p-3 rounded-md bg-muted text-sm whitespace-pre-wrap">
                        {result.response}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedExperiment && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Variant Comparison</CardTitle>
            <CardDescription>Performance metrics by variant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Variant</th>
                    <th className="text-left py-2 px-3">Model</th>
                    <th className="text-right py-2 px-3">Requests</th>
                    <th className="text-right py-2 px-3">Cost</th>
                    <th className="text-right py-2 px-3">Avg Latency</th>
                    <th className="text-right py-2 px-3">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExperiment.variants.map(variant => {
                    const result = selectedExperiment.results.find(r => r.variantId === variant.id);
                    return (
                      <tr key={variant.id} className="border-b">
                        <td className="py-2 px-3 font-medium">{variant.name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{variant.model}</td>
                        <td className="py-2 px-3 text-right">{result?.requests || 0}</td>
                        <td className="py-2 px-3 text-right">${(result?.totalCost || 0).toFixed(4)}</td>
                        <td className="py-2 px-3 text-right">{Math.round(result?.avgLatency || 0)}ms</td>
                        <td className="py-2 px-3 text-right">{result?.totalTokens || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
