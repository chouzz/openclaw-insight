import { NextResponse } from 'next/server';
import { parseAllLogs, extractToolCalls, calculateTokenUsage } from '@/lib/logParser';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const logs = await parseAllLogs();

    const enrichedLogs = logs.map((log) => ({
      ...log,
      toolCalls: extractToolCalls(log.events),
      tokenUsage: calculateTokenUsage(log.events),
      eventCount: log.events.length,
    }));

    return NextResponse.json({ logs: enrichedLogs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
