import fs from 'fs';
import path from 'path';
import { LogEvent, SessionLog, ToolCallSummary } from '@/types/log';

const LOGS_DIR = '/Users/zhouhua/.openclaw/agents/main/sessions';

// 读取并解析单个日志文件
export async function parseLogFile(fileName: string): Promise<SessionLog | null> {
  try {
    const filePath = path.join(LOGS_DIR, fileName);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const events: LogEvent[] = [];

    // 从文件名提取 sessionId
    // 支持格式: xxx.jsonl 或 xxx.jsonl.reset.timestamp 等
    const sessionIdMatch = fileName.match(/^([a-f0-9-]+)\.jsonl/);
    const sessionId = sessionIdMatch ? sessionIdMatch[1] : path.basename(fileName, '.jsonl');

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event: LogEvent = JSON.parse(line);
        events.push(event);
      } catch (e) {
        console.error(`Failed to parse line: ${line}`, e);
      }
    }

    if (events.length === 0) return null;

    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;

    return {
      sessionId,
      events,
      startTime,
      endTime,
      fileName,
    };
  } catch (error) {
    console.error(`Error parsing file ${fileName}:`, error);
    return null;
  }
}

// 获取所有日志文件
export async function getAllLogFiles(): Promise<string[]> {
  try {
    const files = fs.readdirSync(LOGS_DIR);
    return files
      .filter((f) => f.includes('.jsonl') && !f.includes('.lock'))
      .sort((a, b) => {
        // 按修改时间排序
        const statA = fs.statSync(path.join(LOGS_DIR, a));
        const statB = fs.statSync(path.join(LOGS_DIR, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });
  } catch (error) {
    console.error('Error reading logs directory:', error);
    return [];
  }
}

// 解析所有日志文件
export async function parseAllLogs(): Promise<SessionLog[]> {
  const files = await getAllLogFiles();
  const logs: SessionLog[] = [];

  for (const file of files) {
    const log = await parseLogFile(file);
    if (log) {
      logs.push(log);
    }
  }

  return logs;
}

// 从事件中提取工具调用信息
export function extractToolCalls(events: LogEvent[]): ToolCallSummary[] {
  const toolMap = new Map<string, { count: number; success: number; fail: number }>();

  for (const event of events) {
    if (event.type === 'tool') {
      const toolName = event.tool.name;
      const current = toolMap.get(toolName) || { count: 0, success: 0, fail: 0 };
      current.count++;
      toolMap.set(toolName, current);
    }

    if (event.type === 'tool_result') {
      const toolCallId = event.toolResult.toolCallId;
      // 查找对应的 tool 事件获取工具名
      const toolEvent = events.find((e) => e.type === 'tool' && e.id === toolCallId);
      if (toolEvent) {
        const toolName = toolEvent.tool.name;
        const current = toolMap.get(toolName) || { count: 0, success: 0, fail: 0 };
        if (event.toolResult.error) {
          current.fail++;
        } else {
          current.success++;
        }
        toolMap.set(toolName, current);
      }
    }
  }

  return Array.from(toolMap.entries()).map(([toolName, stats]) => ({
    toolName,
    count: stats.count,
    successCount: stats.success,
    failCount: stats.fail,
  }));
}

// 计算 token 使用统计
export function calculateTokenUsage(events: LogEvent[]) {
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let totalTokens = 0;
  let totalCost = 0;

  for (const event of events) {
    if (event.type === 'message' && event.message.usage) {
      const usage = event.message.usage;
      totalInput += usage.input;
      totalOutput += usage.output;
      totalCacheRead += usage.cacheRead;
      totalCacheWrite += usage.cacheWrite;
      totalTokens += usage.totalTokens;
      totalCost += usage.cost.total;
    }
  }

  return {
    totalInput,
    totalOutput,
    totalCacheRead,
    totalCacheWrite,
    totalTokens,
    totalCost,
  };
}

// 构建事件树（父子关系）
export function buildEventTree(events: LogEvent[]) {
  const eventMap = new Map<string, LogEvent & { children: LogEvent[] }>();
  const rootEvents: (LogEvent & { children: LogEvent[] })[] = [];

  // 第一遍：创建所有节点
  for (const event of events) {
    eventMap.set(event.id, { ...event, children: [] });
  }

  // 第二遍：建立父子关系
  for (const event of events) {
    const node = eventMap.get(event.id)!;
    if (event.parentId != null && eventMap.has(event.parentId)) {
      const parent = eventMap.get(event.parentId)!;
      parent.children.push(node);
    } else {
      rootEvents.push(node);
    }
  }

  return rootEvents;
}
