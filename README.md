# AgentForge 🤖

**Self-Optimizing AI Agent powered by Otari**

Built for Mozilla Hackathon 2026 - Developers Wilding

## Overview

AgentForge is an AI agent that monitors its own performance via Otari and automatically optimizes itself through:
- A/B testing different prompts in production
- Auto-switching models based on cost/performance tradeoffs
- Learning from failures and adjusting behavior
- Real-time optimization journey tracking

## Project Structure

```
mozilla-hackathon/
├── backend/          # Express.js backend
│   └── src/
│       ├── routes/   # API routes
│       ├── services/ # Business logic
│       ├── types/    # TypeScript types
│       └── middleware/
├── frontend/         # React + Vite frontend
│   └── src/
│       ├── components/
│       │   └── ui/   # shadcn/ui components
│       ├── lib/      # Utilities
│       ├── hooks/    # React hooks
│       ├── pages/    # Page components
│       └── services/ # API clients
├── shared/           # Shared types/utils
└── package.json      # Root package
```

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **AI Gateway**: Otari.ai
- **Styling**: Tailwind CSS v4

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your Otari API key
```

3. Run development servers:
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Otari Features Used

- ✅ Virtual API Keys (per experiment)
- ✅ Budgets (daily/weekly/monthly caps)
- ✅ Usage Tracking (cost, tokens, requests)
- ✅ Multi-Provider Routing (fallback chains)
- ✅ Code Execution (self-analysis)
- ✅ Web Search (learning)
- ✅ Agent Telemetry (performance metrics)
- ✅ Agent Traces (optimization history)
- ✅ Guardrails (safety)

## Hackathon Timeline

- **Day 1**: Project setup + Otari integration ✅
- **Day 2**: A/B testing framework + tracking
- **Day 3**: Self-optimization engine
- **Day 4**: Polish + demo video

## License

ISC
