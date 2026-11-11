import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { listExperiments, getExperiment, getVariantComparison } from './services/experiment-service.js';
import { getGuardrailRules } from './services/guardrails.js';

const server = new Server(
  {
    name: 'optimind-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_active_experiments',
        description: 'Get all active AI optimization experiments, models, and spending metrics in OptiMind.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_experiment_metrics',
        description: 'Get detailed Pareto efficiency and cost comparison for an experiment.',
        inputSchema: {
          type: 'object',
          properties: {
            experimentId: { type: 'string', description: 'ID of the experiment' },
          },
          required: ['experimentId'],
        },
      },
      {
        name: 'check_guardrail_policy',
        description: 'Inspect active security guardrails, rate limits, and model whitelists enforced by Otari.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'knowledge_prompt_techniques',
        description: 'Fetch curated open-weight prompt optimization techniques and guidelines.',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'Prompt technique or model name (e.g. qwen, compression, cot)' },
          },
        },
      },
    ],
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_active_experiments') {
      const exps = listExperiments();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(exps, null, 2),
          },
        ],
      };
    }

    if (name === 'get_experiment_metrics') {
      const expId = (args as any)?.experimentId;
      const comp = getVariantComparison(expId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(comp, null, 2),
          },
        ],
      };
    }

    if (name === 'check_guardrail_policy') {
      const rules = getGuardrailRules();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rules, null, 2),
          },
        ],
      };
    }

    if (name === 'knowledge_prompt_techniques') {
      const topic = ((args as any)?.topic || '').toLowerCase();
      const tips = [
        "Use concise system prompts without conversational filler words to save up to 45% input tokens.",
        "For Qwen 3.5 and Mimo models, direct structured JSON formatting eliminates multi-turn clarification overhead.",
        "Place constraints and guardrail directives at the very beginning of the prompt to avoid context dilution.",
      ];
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ topic: topic || 'general', tips }, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: (error as Error).message,
        },
      ],
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OptiMind MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error running MCP Server:', error);
  process.exit(1);
});

