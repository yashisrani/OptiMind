import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGuardrailRules, updateGuardrailRules } from '@/services/api';

interface GuardrailRule {
  id: string;
  type: string;
  enabled: boolean;
  config: {
    maxBudget?: number;
    allowedModels?: string[];
    maxRequestsPerMinute?: number;
    blockedPatterns?: string[];
  };
}

export function GuardrailsPage() {
  const [rules, setRules] = useState<GuardrailRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await getGuardrailRules();
      setRules(data);
    } catch (error) {
      console.error('Failed to load guardrails:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const updateConfig = (id: string, key: string, value: any) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, config: { ...rule.config, [key]: value } } : rule
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGuardrailRules('default', rules);
      alert('Guardrails updated');
    } catch (error) {
      alert('Failed to update guardrails');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Guardrails</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-4">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{rule.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                  <CardDescription>
                    {rule.type === 'budget_limit' && 'Set maximum budget per experiment'}
                    {rule.type === 'model_restriction' && 'Restrict which models can be used'}
                    {rule.type === 'rate_limit' && 'Limit requests per minute'}
                    {rule.type === 'prompt_safety' && 'Block unsafe prompt patterns'}
                  </CardDescription>
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
            <CardContent>
              {rule.enabled && (
                <div className="space-y-4">
                  {rule.type === 'budget_limit' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Budget ($)</label>
                      <input
                        type="number"
                        value={rule.config.maxBudget || 100}
                        onChange={(e) => updateConfig(rule.id, 'maxBudget', parseFloat(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                      />
                    </div>
                  )}
                  {rule.type === 'model_restriction' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Allowed Models (comma-separated)</label>
                      <input
                        type="text"
                        value={rule.config.allowedModels?.join(', ') || ''}
                        onChange={(e) => updateConfig(rule.id, 'allowedModels', e.target.value.split(',').map(s => s.trim()))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                        placeholder="gpt-4o, gpt-3.5-turbo"
                      />
                    </div>
                  )}
                  {rule.type === 'rate_limit' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Requests Per Minute</label>
                      <input
                        type="number"
                        value={rule.config.maxRequestsPerMinute || 60}
                        onChange={(e) => updateConfig(rule.id, 'maxRequestsPerMinute', parseInt(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                      />
                    </div>
                  )}
                  {rule.type === 'prompt_safety' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Blocked Patterns (comma-separated)</label>
                      <input
                        type="text"
                        value={rule.config.blockedPatterns?.join(', ') || ''}
                        onChange={(e) => updateConfig(rule.id, 'blockedPatterns', e.target.value.split(',').map(s => s.trim()))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                        placeholder="ignore previous instructions, jailbreak"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
