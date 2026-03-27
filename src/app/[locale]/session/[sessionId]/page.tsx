'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface TokenUsage {
  totalInput: number;
  totalOutput: number;
  totalCacheRead: number;
  totalCacheWrite: number;
  totalTokens: number;
  totalCost: number;
}

interface ToolCallSummary {
  toolName: string;
  count: number;
  successCount: number;
  failCount: number;
}

interface LogEvent {
  type: string;
  id: string;
  parentId: string | null;
  timestamp: string;
  children?: LogEvent[];
  message?: any;
  tool?: any;
  toolResult?: any;
  [key: string]: any;
}

interface SessionDetail {
  sessionId: string;
  startTime: string;
  endTime?: string;
  events: LogEvent[];
  eventTree: LogEvent[];
  eventCount?: number;
  toolCalls: ToolCallSummary[];
  tokenUsage: TokenUsage;
  fileName: string;
}

// Flatten event tree to timeline
function flattenEvents(events: LogEvent[]): LogEvent[] {
  const result: LogEvent[] = [];

  function flatten(event: LogEvent) {
    result.push(event);
    if (event.children && event.children.length > 0) {
      event.children.forEach(flatten);
    }
  }

  events.forEach(flatten);
  return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Render message content
function renderMessageContent(content: any[], t: ReturnType<typeof useTranslations>): (React.JSX.Element | null)[] {
  return content.map((item: any, index: number) => {
    if (item.type === 'text') {
      return (
        <div key={index} className="text-gray-100 whitespace-pre-wrap break-words">
          {item.text}
        </div>
      );
    }
    if (item.type === 'thinking') {
      return (
        <div key={index} className="bg-gray-900/50 rounded-lg p-3 mb-2 border-l-2 border-purple-500">
          <div className="text-xs text-purple-400 mb-1">💭 {t('session.systemMessages.thinkingProcess')}</div>
          <div className="text-xs text-gray-400 whitespace-pre-wrap">{item.thinking}</div>
        </div>
      );
    }
    if (item.type === 'toolCall') {
      return (
        <div key={index} className="mt-3 mb-2">
          <div className="bg-green-900/20 rounded-lg border border-green-800/50 overflow-hidden">
            <div className="bg-green-900/30 px-3 py-2 border-b border-green-800/50">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded bg-green-600 flex items-center justify-center">
                  <span className="text-xs font-bold">⚙</span>
                </div>
                <div className="font-medium text-green-400 text-sm">{item.name}</div>
              </div>
            </div>
            <div className="p-2">
              <div className="text-xs text-gray-400 mb-1">{t('session.parameters')}:</div>
              <pre className="text-xs text-gray-300 bg-gray-900 rounded p-2 overflow-x-auto">
                {JSON.stringify(item.arguments, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      );
    }
    if (item.type === 'toolResult') {
      return (
        <div key={index} className="mt-2 mb-2">
          <div className={`rounded-lg border overflow-hidden ${
            item.isError ? 'bg-red-950/20 border-red-900/50' : 'bg-gray-800 border-gray-700'
          }`}>
            <div className={`px-3 py-2 border-b ${
              item.isError ? 'bg-red-900/20 border-red-900/30' : 'bg-gray-700/50 border-gray-700'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                  item.isError ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
                  <span className="text-xs font-bold">{item.isError ? '✕' : '✓'}</span>
                </div>
                <div className={`font-medium text-sm ${
                  item.isError ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {item.toolName || t('session.toolResult')}
                </div>
              </div>
            </div>
            <div className="p-2">
              <div className="text-xs text-gray-300 bg-gray-900 rounded p-2 max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words text-xs">
                  {typeof item.content === 'string'
                    ? item.content
                    : JSON.stringify(item.content, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  });
}

export default function SessionDetail({ params }: { params: Promise<{ sessionId: string; locale: string }> }) {
  const t = useTranslations('session');
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setSessionId(p.sessionId));
  }, [params]);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/logs/${sessionId}`);
      const data = await response.json();
      setSession(data);
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div>{t('notFound')}</div>
      </div>
    );
  }

  const timeline = flattenEvents(session.eventTree || []);

  // Collect all system messages and display in one line
  const systemMessages = timeline.filter(e =>
    e.type === 'session' || e.type === 'model_change' || e.type === 'thinking_level_change' || e.type === 'custom'
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top Navigation */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
            >
              ← {t('backToHome')}
            </Link>
            <div className="text-sm text-gray-400">
              {new Date(session.startTime).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">{session.sessionId.slice(0, 8)}...</h1>
            <div className="text-xs text-gray-500">{session.fileName}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-blue-400">{session.eventCount || 0}</div>
              <div className="text-xs text-gray-500">{t('stats.totalEvents')}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-green-400">
                {session.tokenUsage?.totalTokens?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-gray-500">{t('stats.totalTokens')}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-yellow-400">
                ${session.tokenUsage?.totalCost?.toFixed(4) || '0.0000'}
              </div>
              <div className="text-xs text-gray-500">{t('stats.cost')}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-purple-400">
                {session.toolCalls?.reduce((sum, t) => sum + (t.count || 0), 0) || 0}
              </div>
              <div className="text-xs text-gray-500">{t('stats.toolCalls')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* System Messages Bar */}
        {systemMessages.length > 0 && (
          <div className="mb-6 flex justify-center">
            <div className="flex flex-wrap items-center gap-2 bg-gray-800/30 rounded-lg px-4 py-2 border border-gray-800">
              {systemMessages.map((event, idx) => (
                <div key={event.id} className="flex items-center">
                  {idx > 0 && <div className="w-px h-3 bg-gray-700 mx-2"></div>}
                  <span className="text-xs text-gray-500">
                    {event.type === 'session' && '🚀 ' + t('sessionStart')}
                    {event.type === 'model_change' && `🤖 ${event.provider}/${event.modelId}`}
                    {event.type === 'thinking_level_change' && `🧠 ${event.thinkingLevel}`}
                    {event.type === 'custom' && `📋 ${event.customType}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {timeline.map((event, index) => {
            // Skip system messages (already displayed in the bar above)
            if (event.type === 'session' || event.type === 'model_change' || event.type === 'thinking_level_change' || event.type === 'custom') {
              return null;
            }

            // User message
            if (event.type === 'message' && event.message?.role === 'user') {
              return (
                <div key={event.id} className="flex justify-end">
                  <div className="max-w-2xl">
                    <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold">
                          👤
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-blue-200 mb-1 font-medium">{t('roles.user')}</div>
                          {renderMessageContent(event.message.content || [], t)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            }

            // Assistant/System message
            if (event.type === 'message' && (event.message?.role === 'assistant' || event.message?.role === 'system')) {
              const isSystem = event.message?.role === 'system';
              return (
                <div key={event.id} className="flex justify-start">
                  <div className="max-w-2xl">
                    <div className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg ${
                      isSystem ? 'bg-gray-700' : 'bg-gray-700'
                    }`}>
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                          AI
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400 mb-1 font-medium">
                            {isSystem ? t('roles.system') : t('roles.assistant')}
                          </div>
                          {renderMessageContent(event.message.content || [], t)}
                          {event.message.usage && (
                            <div className="mt-3 pt-2 border-t border-gray-600/50">
                              <div className="text-xs text-gray-400">
                                📊 {event.message.usage.input.toLocaleString()} in +
                                {event.message.usage.output.toLocaleString()} out =
                                {event.message.usage.totalTokens.toLocaleString()} {t('tokenUsage')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* End Marker */}
        {session.endTime && (
          <div className="flex justify-center mt-8">
            <div className="bg-gray-800/30 rounded-lg px-4 py-2 text-xs text-gray-500 border border-gray-800">
              🏁 {t('sessionEnd')} · {new Date(session.endTime).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
