import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createExperiment } from '@/services/api';
import type { ExperimentVariant } from '../../../shared/src';

interface CreateExperimentPageProps {
  onCreated: () => void;
}

export function CreateExperimentPage({ onCreated }: CreateExperimentPageProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('10');
  const [variants, setVariants] = useState<Omit<ExperimentVariant, 'id'>[]>([
    { name: 'Variant A', prompt: '', model: 'gpt-4o', temperature: 0.7 },
    { name: 'Variant B', prompt: '', model: 'gpt-3.5-turbo', temperature: 0.7 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addVariant = () => {
    setVariants([...variants, { name: `Variant ${String.fromCharCode(65 + variants.length)}`, prompt: '', model: 'gpt-4o', temperature: 0.7 }]);
  };

  const updateVariant = (index: number, field: keyof ExperimentVariant, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createExperiment(name, description, variants, parseFloat(budget));
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create Experiment</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Experiment Details</CardTitle>
            <CardDescription>Define your A/B testing experiment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Experiment" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you testing?" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Budget ($)</label>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="10" min="1" step="0.01" required />
            </div>
          </CardContent>
        </Card>

        {variants.map((variant, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{variant.name}</CardTitle>
                {variants.length > 2 && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(index)}>
                    Remove
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Model</label>
                <select
                  value={variant.model}
                  onChange={(e) => updateVariant(index, 'model', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">System Prompt</label>
                <Textarea
                  value={variant.prompt}
                  onChange={(e) => updateVariant(index, 'prompt', e.target.value)}
                  placeholder="You are a helpful assistant..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Temperature</label>
                <Input
                  type="number"
                  value={variant.temperature}
                  onChange={(e) => updateVariant(index, 'temperature', parseFloat(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addVariant}>
          Add Variant
        </Button>

        {error && <p className="text-destructive">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Experiment'}
        </Button>
      </form>
    </div>
  );
}
