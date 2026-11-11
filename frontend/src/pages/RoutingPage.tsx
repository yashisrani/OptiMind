import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    id: 'test',
    name: 'Otari Active Policy (test)',
    primaryModel: 'Qwen/Qwen3.8-Flash (DeepInfra)',
    fallbackModels: ['deepseek-ai/DeepSeek-V4-Flash (DeepInfra)'],
    enabled: true,
    description: 'Active Otari Gateway routing policy: primary fast Qwen model with automated DeepSeek-V4-Flash failover on error or rate-limit.',
  },
  {
    id: 'quality-first',
    name: 'Quality Reasoning Policy',
    primaryModel: 'deepseek/deepseek-v4-pro',
    fallbackModels: ['alibaba/qwen3.5-27b', 'xiaomi/mimo-v2.6-pro'],
    enabled: false,
    description: 'Use large open-weight reasoning models first, failover to mid-tier alternatives on latency spike.',
  },
  {
    id: 'cost-optimized',
    name: 'Budget Shield Policy',
    primaryModel: 'xiaomi/mimo-v2.6-pro',
    fallbackModels: ['alibaba/qwen3.8-flash', 'deepseek/deepseek-v4-flash'],
    enabled: false,
    description: 'Ultra-low-cost token routing with automated fallback for mission-critical prompts.',
  },
];

export function RoutingPage() {
  const [rules] = useState<RoutingRule[]>(defaultRules);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Routing Policies</h1>
        <p className="text-muted-foreground mt-1">
          Multi-provider fallback chains managed via Otari Dashboard
        </p>
      </div>

      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Routing policies are configured in the Otari Dashboard (Routing → Policies). 
            This page shows your current configuration. Changes must be made in Otari to take effect.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rules.map(rule => (
          <Card key={rule.id} className={rule.enabled ? 'border-primary/50' : 'opacity-60'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <CardDescription>{rule.description}</CardDescription>
                </div>
                <span className={`text-xs px-3 py-1 rounded ${
                  rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {rule.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <strong>Routing Flow:</strong> {rule.primaryModel} → {rule.fallbackModels.join(' → ')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  If {rule.primaryModel} fails (rate limit, error, budget), Otari automatically tries the next model in the chain.
                </p>
              </div>
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
              <span>Otari checks the routing policy configured in the dashboard</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>If the primary model fails, Otari automatically tries the next fallback</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              <span>The response includes the actual model used in the `model` field</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">5.</span>
              <span>All usage is tracked in Otari's dashboard with the actual provider</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
