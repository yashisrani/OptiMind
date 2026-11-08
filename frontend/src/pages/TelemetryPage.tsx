import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTelemetryMetrics } from '@/services/api';

interface TelemetryMetrics {
  outcomes: {
    commits: number;
    pull_requests: number;
    lines_of_code: number;
    active_time: number;
  };
  behavior: {
    tool_calls: number;
    tool_accepts: number;
    tool_rejects: number;
    turns: number;
    api_errors: number;
  };
  measures: {
    costPerCommit: number | null;
    costPerPullRequest: number | null;
    costPerLine: number | null;
    spendPerActiveHour: number | null;
    toolAcceptanceRate: number | null;
    errorRate: number | null;
    turnsPerSession: number | null;
  };
  usage: {
    cost: number;
    requests: number;
  };
}

export function TelemetryPage() {
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await getTelemetryMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading telemetry...</div>;
  }

  if (!metrics) {
    return <div className="container mx-auto px-4 py-8">Failed to load telemetry. Ensure Otari API key is configured.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agent Telemetry</h1>
      <p className="text-muted-foreground mb-8">Real-time metrics from Otari Agent Telemetry API</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Commits</CardTitle>
            <CardDescription>Total commits</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.outcomes.commits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pull Requests</CardTitle>
            <CardDescription>Total PRs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.outcomes.pull_requests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lines of Code</CardTitle>
            <CardDescription>Total changed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.outcomes.lines_of_code.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Time</CardTitle>
            <CardDescription>In seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.outcomes.active_time}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Behavior Metrics</CardTitle>
            <CardDescription>Agent activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Tool Calls</span>
                <span className="font-medium">{metrics.behavior.tool_calls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tool Accepts</span>
                <span className="font-medium text-green-600">{metrics.behavior.tool_accepts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tool Rejects</span>
                <span className="font-medium text-destructive">{metrics.behavior.tool_rejects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Turns</span>
                <span className="font-medium">{metrics.behavior.turns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">API Errors</span>
                <span className="font-medium text-destructive">{metrics.behavior.api_errors}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Cost and requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Cost</span>
                <span className="font-medium">${metrics.usage.cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Requests</span>
                <span className="font-medium">{metrics.usage.requests}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Efficiency Measures</CardTitle>
          <CardDescription>Cost and quality per unit of work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Cost per Commit</p>
              <p className="text-2xl font-bold">
                {metrics.measures.costPerCommit ? `$${metrics.measures.costPerCommit.toFixed(4)}` : 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Cost per PR</p>
              <p className="text-2xl font-bold">
                {metrics.measures.costPerPullRequest ? `$${metrics.measures.costPerPullRequest.toFixed(4)}` : 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Cost per Line</p>
              <p className="text-2xl font-bold">
                {metrics.measures.costPerLine ? `$${metrics.measures.costPerLine.toFixed(6)}` : 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Spend per Active Hour</p>
              <p className="text-2xl font-bold">
                {metrics.measures.spendPerActiveHour ? `$${metrics.measures.spendPerActiveHour.toFixed(4)}` : 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Tool Acceptance Rate</p>
              <p className="text-2xl font-bold">
                {metrics.measures.toolAcceptanceRate ? `${(metrics.measures.toolAcceptanceRate * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Error Rate</p>
              <p className="text-2xl font-bold">
                {metrics.measures.errorRate ? `${(metrics.measures.errorRate * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Turns per Session</p>
              <p className="text-2xl font-bold">
                {metrics.measures.turnsPerSession ? metrics.measures.turnsPerSession.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
