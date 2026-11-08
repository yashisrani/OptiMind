import { getTraces, getTraceById } from './otari-client';

export async function fetchTraces(limit: number = 50) {
  try {
    const traces = await getTraces(limit);
    return traces;
  } catch (error) {
    console.error('Failed to fetch traces:', error);
    return [];
  }
}

export async function fetchTraceDetail(traceId: string) {
  try {
    const trace = await getTraceById(traceId);
    return trace;
  } catch (error) {
    console.error('Failed to fetch trace detail:', error);
    return null;
  }
}
