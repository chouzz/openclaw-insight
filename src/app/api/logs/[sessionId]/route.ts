import { NextResponse } from 'next/server';
import { parseLogFile, buildEventTree, extractToolCalls, calculateTokenUsage, getAllLogFiles } from '@/lib/logParser';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // 查找对应的日志文件
    const files = await getAllLogFiles();

    let targetLog = null;
    for (const file of files) {
      const log = await parseLogFile(file);
      if (log && log.sessionId === sessionId) {
        targetLog = log;
        break;
      }
    }

    if (!targetLog) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const eventTree = buildEventTree(targetLog.events);

    return NextResponse.json({
      ...targetLog,
      eventTree,
      toolCalls: extractToolCalls(targetLog.events),
      tokenUsage: calculateTokenUsage(targetLog.events),
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 });
  }
}
