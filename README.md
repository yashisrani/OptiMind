# OptiMind

Self-optimizing AI agent powered by Otari.

## Overview

OptiMind monitors its own performance and optimizes itself through:
- A/B testing prompt variants in production
- Auto-switching models based on cost/performance
- Learning from failures and adjusting behavior
- Real-time optimization tracking

## Project Structure

```
mozilla-hackathon/
├── backend/          # Express.js API
├── frontend/         # React + Vite + Tailwind
├── shared/           # Shared TypeScript types
└── package.json
```

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, TypeScript
- AI Gateway: Otari.ai

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Otari Features

- Virtual API Keys (per experiment)
- Budgets (daily/weekly/monthly caps)
- Usage Tracking (cost, tokens, requests)
- Multi-Provider Routing (fallback chains)
- Code Execution (self-analysis)
- Web Search (learning)
- Agent Telemetry (performance metrics)
- Agent Traces (optimization history)
- Guardrails (safety)

## License

ISC
