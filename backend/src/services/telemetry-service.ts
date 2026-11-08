import { getAgentTelemetry } from './otari-client';

export async function getTelemetryMetrics(startDate?: string, endDate?: string) {
  try {
    const telemetry = await getAgentTelemetry(startDate, endDate);
    
    return {
      outcomes: telemetry.outcomes,
      behavior: telemetry.behavior,
      measures: {
        costPerCommit: telemetry.measures.cost_per_commit,
        costPerPullRequest: telemetry.measures.cost_per_pull_request,
        costPerLine: telemetry.measures.cost_per_line,
        spendPerActiveHour: telemetry.measures.spend_per_active_hour,
        toolAcceptanceRate: telemetry.measures.tool_acceptance_rate,
        errorRate: telemetry.measures.error_rate,
        turnsPerSession: telemetry.measures.turns_per_session,
      },
      usage: telemetry.usage,
    };
  } catch (error) {
    console.error('Failed to fetch telemetry:', error);
    return null;
  }
}
