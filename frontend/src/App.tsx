import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreateExperimentPage } from '@/pages/CreateExperimentPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { GuardrailsPage } from '@/pages/GuardrailsPage';
import { BattleArenaPage } from '@/pages/BattleArenaPage';
import { CompressionPage } from '@/pages/CompressionPage';
import { RoutingPage } from '@/pages/RoutingPage';
import { McpPage } from '@/pages/McpPage';

type Page = 'dashboard' | 'battle' | 'compression' | 'create' | 'guardrails' | 'routing' | 'mcp';

const navItems: { label: string; page: Page }[] = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'Battle Arena', page: 'battle' },
  { label: 'Compress', page: 'compression' },
  { label: 'Create', page: 'create' },
  { label: 'Guardrails', page: 'guardrails' },
  { label: 'Routing', page: 'routing' },
  { label: 'MCP Server', page: 'mcp' },
];

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const navigate = (p: Page) => {
    setPage(p);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('dashboard')}>
              <img
                src={darkMode ? '/logo-dark.svg' : '/logo-light.svg'}
                alt="OptiMind Logo"
                className="h-9 w-9 rounded-xl shadow-sm hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text ">
                  OptiMind
                </h1>
                {/* <p className="text-[10px] text-muted-foreground font-medium -mt-1 leading-none">LLM Gateway & Optimizer</p> */}
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.page}
                  variant={page === item.page ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.page)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Right side: Theme toggle + Mobile menu button */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                )}
              </Button>

              {/* Mobile hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-3 space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.page}
                  variant={page === item.page ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => navigate(item.page)}
                >
                  {item.label}
                </Button>
              ))}
              <p className="text-xs text-muted-foreground pt-2 px-2">Powered by Otari</p>
            </div>
          )}
        </div>
      </nav>

      <main>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'battle' && <BattleArenaPage />}
      {page === 'compression' && <CompressionPage />}
      {page === 'create' && <CreateExperimentPage onCreated={() => setPage('dashboard')} />}
      {page === 'guardrails' && <GuardrailsPage />}
      {page === 'routing' && <RoutingPage />}
      {page === 'mcp' && <McpPage />}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>OptiMind &middot; Powered by Otari</p>
      </footer>
    </div>
  );
}

export default App;
