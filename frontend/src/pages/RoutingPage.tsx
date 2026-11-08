import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface RoutingRule {
  id: string;
  name: string;
  primaryModel: string;
  fallbackModels: string[];
  enabled: boolean;
  description: string;
}

const defaultRules: RoutingRule[] = [
  {
    id: 'cost-optimized',
    name: 'Cost Optimized',
    primaryModel: 'gpt-3.5-turbo',
    fallbackModels: ['gpt-4o-mini', 'claude-3-haiku'],
    enabled: true,
    description: 'Use cheapest model first, fallback to better models on failure',
  },
  {
    id: 'quality-first',
    name: 'Quality First',
    primaryModel: 'gpt-4o',
    fallbackModels: ['claude-3-sonnet', 'gpt-4'],
    enabled: false,
    description: 'Use best model first, fallback to alternatives on rate limits',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    primaryModel: 'gpt-4o-mini',
    fallbackModels: ['claude-3-sonnet', 'gpt-4o'],
    enabled: false,
    description: 'Balance cost and quality with mid-tier primary',
  },
];

export function RoutingPage() {
  const [rules, setRules] = useState<RoutingRule[]>(defaultRules);
  const [saving, setSaving] = useState(false);

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const updateRule = (id: string, field: keyof RoutingRule, value: any) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    alert('Routing policies saved');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Routing Policies</h1>
          <p className="text-muted-foreground mt-1">Configure multi-provider fallback chains via Otari</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Policies'}
        </Button>
      </div>

      <div className="space-y-4">
        {rules.map(rule => (
          <Card key={rule.id} className={rule.enabled ? 'border-primary/50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <CardDescription>{rule.description}</CardDescription>
                </div>
                <Button
                  variant={rule.enabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleRule(rule.id)}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rule.enabled && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary Model</label>
                    <select
                      value={rule.primaryModel}
                      onChange={(e) => updateRule(rule.id, 'primaryModel', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                    >
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku">Claude 3 Haiku</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Fallback Models (comma-separated)</label>
                    <Input
                      value={rule.fallbackModels.join(', ')}
                      onChange={(e) => updateRule(rule.id, 'fallbackModels', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="gpt-4o, claude-3-sonnet"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Otari will try these models in order if the primary fails
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Routing Flow:</strong> {rule.primaryModel} → {rule.fallbackModels.join(' → ')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Otari Routing Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>Your app sends one request to Otari with your preferred model</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Otari checks the routing policy for your workspace</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>If the primary model fails (rate limit, error, budget), Otari automatically tries the next fallback</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              <span>The response comes back with the actual model used in the `model` field</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">5.</span>
              <span>All usage is tracked in Otari's dashboard with the actual provider and model</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
