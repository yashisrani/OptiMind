import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            🤖 AgentForge
          </h1>
          <p className="text-xl text-muted-foreground">
            Self-Optimizing AI Agent powered by Otari
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing</CardTitle>
              <CardDescription>Test prompt variants</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Create Experiment</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Track metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$0.00</p>
              <p className="text-sm text-muted-foreground">Total Cost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimization</CardTitle>
              <CardDescription>AI suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Active Suggestions</p>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Built with Otari AI Gateway • Mozilla Hackathon 2026</p>
        </footer>
      </div>
    </div>
  )
}

export default App
