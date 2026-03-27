// OpenClaw 日志类型定义

export type LogEventType =
  | 'session'
  | 'message'
  | 'thinking_level_change'
  | 'custom'
  | 'tool'
  | 'tool_result'
  | 'error';

export interface BaseLogEvent {
  type: LogEventType;
  id: string;
  parentId: string | null;
  timestamp: string;
}

export interface SessionEvent extends BaseLogEvent {
  type: 'session';
  version: number;
  cwd: string;
}

export interface MessageContent {
  type: 'text' | 'image' | 'file' | 'thinking';
  text?: string;
  [key: string]: any;
}

export interface MessageUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}

export interface MessageEvent extends BaseLogEvent {
  type: 'message';
  message: {
    role: 'user' | 'assistant' | 'system';
    content: MessageContent[];
    api?: string;
    provider?: string;
    model?: string;
    usage?: MessageUsage;
    stopReason?: string;
    timestamp: number;
  };
}

export interface ThinkingLevelChangeEvent extends BaseLogEvent {
  type: 'thinking_level_change';
  thinkingLevel: 'low' | 'medium' | 'high';
}

export interface CustomEvent extends BaseLogEvent {
  type: 'custom';
  customType: string;
  data: Record<string, any>;
}

export interface ToolEvent extends BaseLogEvent {
  type: 'tool';
  tool: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface ToolResultEvent extends BaseLogEvent {
  type: 'tool_result';
  toolResult: {
    toolCallId: string;
    result: any;
    error?: string;
  };
}

export type LogEvent =
  | SessionEvent
  | MessageEvent
  | ThinkingLevelChangeEvent
  | CustomEvent
  | ToolEvent
  | ToolResultEvent;

export interface SessionLog {
  sessionId: string;
  events: LogEvent[];
  startTime: string;
  endTime?: string;
  fileName: string;
}

export interface ToolCallSummary {
  toolName: string;
  count: number;
  successCount: number;
  failCount: number;
  avgDuration?: number;
}
