import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listExperiments, runExperiment, getVariantComparison } from '@/services/api';
import type { Experiment } from '../../../shared/src';

interface VariantComparison {
  variantId: string;
  name: string;
  model: string;
  requests: number;
  totalCost: number;
  avgLatency: number;
  totalTokens: number;
  successRate: number;
  costPerRequest: number;
  efficiency: number;
  shareOfRequests: number;
}

interface ComparisonData {
  variants: VariantComparison[];
  bestVariant: string;
  totalRequests: number;
  totalCost: number;
  budget: number;
  budgetUtilization: number;
}

export function DashboardPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ response: string; variant: string; latency: number; tokens: number; cost: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    const data = await listExperiments();
    setExperiments(data);
  };

  const loadComparison = async (experimentId: string) => {
    try {
      const data = await getVariantComparison(experimentId);
      setComparison(data);
    } catch (error) {
      console.error('Failed to load comparison:', error);
    }
  };

  const handleSelectExperiment = (exp: Experiment) => {
    setSelectedExperiment(exp);
    loadComparison(exp.id);
  };

  const handleRun = async () => {
    if (!selectedExperiment || !input) return;
    setLoading(true);
    try {
      const res = await runExperiment(selectedExperiment.id, input);
      setResult({ response: res.response, variant: res.variant.name, latency: res.latency, tokens: res.tokens, cost: res.cost });
      await loadExperiments();
      await loadComparison(selectedExperiment.id);
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

      <div className="grid gap-6 md:grid-cols-4 mb-8">
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

        <Card>
          <CardHeader>
            <CardTitle>Total Requests</CardTitle>
            <CardDescription>All experiments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{experiments.reduce((sum, e) => sum + e.results.reduce((s, r) => s + r.requests, 0), 0)}</p>
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
                  onClick={() => handleSelectExperiment(exp)}
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
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Variant</span>
                        <p className="text-muted-foreground">{result.variant}</p>
                      </div>
                      <div>
                        <span className="font-medium">Latency</span>
                        <p className="text-muted-foreground">{result.latency}ms</p>
                      </div>
                      <div>
                        <span className="font-medium">Cost</span>
                        <p className="text-muted-foreground">${result.cost.toFixed(6)}</p>
                      </div>
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

      {comparison && comparison.variants.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Variant Comparison</CardTitle>
            <CardDescription>Performance metrics by variant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Best Variant</h3>
                  <p className="text-sm text-muted-foreground">
                    {comparison.variants.find(v => v.variantId === comparison.bestVariant)?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{comparison.budgetUtilization.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Budget Used</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Variant</th>
                    <th className="text-left py-2 px-3">Model</th>
                    <th className="text-right py-2 px-3">Requests</th>
                    <th className="text-right py-2 px-3">Cost</th>
                    <th className="text-right py-2 px-3">Avg Latency</th>
                    <th className="text-right py-2 px-3">Efficiency</th>
                    <th className="text-right py-2 px-3">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.variants.map(variant => (
                    <tr key={variant.variantId} className={`border-b ${variant.variantId === comparison.bestVariant ? 'bg-primary/5' : ''}`}>
                      <td className="py-2 px-3 font-medium">
                        {variant.name}
                        {variant.variantId === comparison.bestVariant && <span className="ml-2 text-xs text-primary">Best</span>}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{variant.model}</td>
                      <td className="py-2 px-3 text-right">{variant.requests}</td>
                      <td className="py-2 px-3 text-right">${variant.totalCost.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right">{Math.round(variant.avgLatency)}ms</td>
                      <td className="py-2 px-3 text-right">{variant.efficiency.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{variant.shareOfRequests.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
