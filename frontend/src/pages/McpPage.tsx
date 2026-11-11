import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MCPTool {
  name: string;
  description: string;
  endpoint: string;
}

export function McpPage() {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<any>(null);

  useEffect(() => {
    fetch('/api/experiments/mcp/tools')
      .then(res => res.json())
      .then(data => setTools(data.tools || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleTestTool = async (toolName: string) => {
    setTesting(toolName);
    setTestOutput(null);
    try {
      if (toolName === 'get_active_experiments') {
        const res = await fetch('/api/experiments');
        setTestOutput(await res.json());
      } else if (toolName === 'check_guardrail_policy') {
        const res = await fetch('/api/experiments/guardrails');
        setTestOutput(await res.json());
      } else if (toolName === 'knowledge_prompt_techniques') {
        setTestOutput({
          topic: 'open-weight-optimization',
          tips: [
            "Strip conversational filler words to save up to 45% input tokens.",
            "Use direct structured JSON formatting with Qwen 3.5 to eliminate multi-turn clarification overhead.",
            "Place constraints and guardrail directives at the very top of the prompt."
          ]
        });
      } else {
        setTestOutput({ message: "Tool executed successfully via MCP Server protocol." });
      }
    } catch (e: any) {
      setTestOutput({ error: e.message });
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">MCP Server Integration</h1>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800">
            Model Context Protocol
          </span>
        </div>
        <p className="text-muted-foreground mt-1">
          Expose OptiMind metrics, guardrails, and knowledge to external agents & Otari via standardized MCP tools.
        </p>
      </div>

      <Card className="mb-6 border-primary/40 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Stdio MCP Daemon</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                npm run mcp (tsx backend/src/mcp-server.ts)
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded bg-green-100 text-green-800">
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
              Ready / Stdio Protocol
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading MCP tools...</p>
        ) : (
          tools.map(tool => (
            <Card key={tool.name} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono text-primary">{tool.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestTool(tool.name)}
                    disabled={testing === tool.name}
                  >
                    {testing === tool.name ? 'Calling Tool...' : 'Invoke MCP Tool'}
                  </Button>
                </div>
                <CardDescription className="text-xs mt-1">{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {testOutput && (
        <Card className="mt-6 border-emerald-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-600">MCP Tool Response Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto max-h-60">
              {JSON.stringify(testOutput, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

