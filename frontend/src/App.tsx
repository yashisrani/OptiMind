import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateExperimentPage } from '@/pages/CreateExperimentPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { GuardrailsPage } from '@/pages/GuardrailsPage';
import { TelemetryPage } from '@/pages/TelemetryPage';
import { TracesPage } from '@/pages/TracesPage';

type Page = 'dashboard' | 'create' | 'guardrails' | 'telemetry' | 'traces';

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">OptiMind</h1>
            <div className="flex gap-2">
              <Button
                variant={page === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPage('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={page === 'create' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPage('create')}
              >
                Create Experiment
              </Button>
              <Button
                variant={page === 'guardrails' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPage('guardrails')}
              >
                Guardrails
              </Button>
              <Button
                variant={page === 'telemetry' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPage('telemetry')}
              >
                Telemetry
              </Button>
              <Button
                variant={page === 'traces' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPage('traces')}
              >
                Traces
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Powered by Otari</p>
        </div>
      </nav>

      {page === 'dashboard' && <DashboardPage />}
      {page === 'create' && <CreateExperimentPage onCreated={() => setPage('dashboard')} />}
      {page === 'guardrails' && <GuardrailsPage />}
      {page === 'telemetry' && <TelemetryPage />}
      {page === 'traces' && <TracesPage />}
    </div>
  );
}

export default App;
