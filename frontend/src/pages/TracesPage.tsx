import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTraces, getTraceById } from '@/services/api';

interface Trace {
  id: string;
  session_id: string;
  model: string;
  duration_ms: number;
  cost: number;
  tokens: number;
  status: string;
  created_at: string;
  turns: number;
  tool_calls: number;
}

interface TraceDetail extends Trace {
  turns: Array<{
    id: string;
    model: string;
    duration_ms: number;
    cost: number;
    tokens: number;
    tool_calls: Array<{
      name: string;
      duration_ms: number;
      status: string;
    }>;
  }>;
}

export function TracesPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraces();
  }, []);

  const loadTraces = async () => {
    try {
      const data = await getTraces(50);
      setTraces(data);
    } catch (error) {
      console.error('Failed to load traces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTraceDetail = async (traceId: string) => {
    try {
      const data = await getTraceById(traceId);
      setSelectedTrace(data);
    } catch (error) {
      console.error('Failed to load trace detail:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading traces...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agent Traces</h1>
      <p className="text-muted-foreground mb-8">Full session traces from Otari</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Traces</CardTitle>
            <CardDescription>Click to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {traces.length === 0 ? (
              <p className="text-muted-foreground">No traces available</p>
            ) : (
              <div className="space-y-2">
                {traces.map(trace => (
                  <div
                    key={trace.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTrace?.id === trace.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => loadTraceDetail(trace.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm">{trace.session_id}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trace.status === 'success' ? 'bg-green-100 text-green-800' :
                        trace.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trace.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{trace.model}</span>
                      <span>{trace.duration_ms}ms</span>
                      <span>${trace.cost.toFixed(4)}</span>
                      <span>{trace.tokens} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTrace && (
          <Card>
            <CardHeader>
              <CardTitle>Trace Details</CardTitle>
              <CardDescription>Session: {selectedTrace.session_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Model:</span>
                    <p className="text-muted-foreground">{selectedTrace.model}</p>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p className="text-muted-foreground">{selectedTrace.duration_ms}ms</p>
                  </div>
                  <div>
                    <span className="font-medium">Cost:</span>
                    <p className="text-muted-foreground">${selectedTrace.cost.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tokens:</span>
                    <p className="text-muted-foreground">{selectedTrace.tokens}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Turns ({selectedTrace.turns.length})</h3>
                  <div className="space-y-2">
                    {selectedTrace.turns.map((turn, index) => (
                      <div key={turn.id} className="p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Turn {index + 1}</span>
                          <span className="text-xs text-muted-foreground">{turn.model}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{turn.duration_ms}ms</span>
                          <span>${turn.cost.toFixed(4)}</span>
                          <span>{turn.tokens} tokens</span>
                        </div>
                        {turn.tool_calls.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium">Tool Calls:</p>
                            {turn.tool_calls.map((tool, toolIndex) => (
                              <div key={toolIndex} className="text-xs text-muted-foreground ml-2">
                                • {tool.name} ({tool.duration_ms}ms) - {tool.status}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
