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
    { name: 'Variant A', prompt: '', model: 'alibaba/qwen3.8-flash', temperature: 0.7 },
    { name: 'Variant B', prompt: '', model: 'deepseek/deepseek-v4-flash', temperature: 0.7 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addVariant = () => {
    setVariants([...variants, { name: `Variant ${String.fromCharCode(65 + variants.length)}`, prompt: '', model: 'alibaba/qwen3.8-flash', temperature: 0.7 }]);
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
                  <optgroup label="Alibaba Qwen">
                    <option value="alibaba/qwen3.8-flash">Qwen 3.8 Flash</option>
                    <option value="alibaba/qwen3.5-9b">Qwen 3.5 9B</option>
                    <option value="alibaba/qwen3.6-35b-a3b">Qwen 3.6 35B A3B</option>
                  </optgroup>
                  
                  <optgroup label="DeepSeek">
                    <option value="deepseek/deepseek-v4-pro">DeepSeek V4 Pro</option>
                    <option value="deepseek/deepseek-v4-flash">DeepSeek V4 Flash</option>
                    <option value="deepseek/deepseek-v3">DeepSeek V3</option>
                  </optgroup>
                  
                  <optgroup label="Meta Llama">
                    <option value="meta/llama-4-scout-17b">Llama 4 Scout 17B</option>
                    <option value="meta/llama-3.3-70b-instruct">Llama 3.3 70B Instruct</option>
                    <option value="meta/llama-3.1-70b-instruct">Llama 3.1 70B Instruct</option>
                  </optgroup>
                  
                  <optgroup label="Mistral">
                    <option value="mistralai/mistral-small-4">Mistral Small 4</option>
                    <option value="mistralai/mistral-large-latest">Mistral Large (Latest)</option>
                    <option value="mistralai/ministral-3b-latest">Ministral 3B (Latest)</option>
                  </optgroup>
                  
                  <optgroup label="Nvidia">
                    <option value="nvidia/nemotron-3.5-super-vl-120b-a12b">Nemotron 3.5 Super VL 120B</option>
                  </optgroup>
                  
                  <optgroup label="Xiaomi">
                    <option value="xiaomi/mimo-v2.6-pro">MiMo V2.6 Pro</option>
                  </optgroup>
                  
                  <optgroup label="Bytedance">
                    <option value="bytedance/seed-2.0-pro">Seed 2.0 Pro</option>
                  </optgroup>
                  
                  <optgroup label="NousResearch">
                    <option value="nousresearch/hermes-4-405b">Hermes 4 405B</option>
                  </optgroup>
                  
                  <optgroup label="OpenAI (Open Weight)">
                    <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
                  </optgroup>
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
