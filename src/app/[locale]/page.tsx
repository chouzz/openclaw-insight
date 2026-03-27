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
  avgDuration?: number;
}

interface SessionLog {
  sessionId: string;
  startTime: string;
  endTime?: string;
  fileName: string;
  eventCount: number;
  toolCalls: ToolCallSummary[];
  tokenUsage: TokenUsage;
}

export default function Home() {
  const t = useTranslations('home');
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tool names
  const allTools = Array.from(
    new Set(logs.flatMap((log) => (log.toolCalls || []).map((t) => t.toolName)))
  );

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Tool filter
    if (selectedTool !== 'all') {
      const usesTool = (log.toolCalls || []).some((t) => t.toolName === selectedTool);
      if (!usesTool) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.sessionId.toLowerCase().includes(query) ||
        log.fileName.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Overall statistics
  const totalStats = {
    sessions: logs.length,
    totalEvents: logs.reduce((sum, log) => sum + (log.eventCount || 0), 0),
    totalTokens: logs.reduce((sum, log) => sum + (log.tokenUsage?.totalTokens || 0), 0),
    totalCost: logs.reduce((sum, log) => sum + (log.tokenUsage?.totalCost || 0), 0),
    totalToolCalls: logs.reduce(
      (sum, log) => sum + (log.toolCalls || []).reduce((s, t) => s + (t.count || 0), 0),
      0
    ),
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{totalStats.sessions}</div>
            <div className="text-sm text-gray-400">{t('stats.totalSessions')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">{totalStats.totalEvents}</div>
            <div className="text-sm text-gray-400">{t('stats.totalEvents')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-yellow-400">
              {totalStats.totalTokens.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">{t('stats.totalTokens')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">
              ${totalStats.totalCost.toFixed(4)}
            </div>
            <div className="text-sm text-gray-400">{t('stats.totalCost')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-pink-400">{totalStats.totalToolCalls}</div>
            <div className="text-sm text-gray-400">{t('stats.totalToolCalls')}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">{t('filters.search')}</label>
              <input
                type="text"
                placeholder={t('filters.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">{t('filters.toolFilter')}</label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('filters.allTools')}</option>
                {allTools.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Session List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('table.sessionId')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('table.startTime')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('table.tokens')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('table.cost')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('table.toolCalls')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.sessionId} className="hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{log.sessionId.slice(0, 8)}...</div>
                    <div className="text-xs text-gray-400">{log.fileName}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(log.startTime).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {log.tokenUsage?.totalTokens?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    ${log.tokenUsage?.totalCost?.toFixed(4) || '0.0000'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(log.toolCalls || []).slice(0, 3).map((tool) => (
                        <span
                          key={tool.toolName}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-300"
                        >
                          {tool.toolName} ×{tool.count || 0}
                        </span>
                      ))}
                      {(log.toolCalls || []).length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{(log.toolCalls || []).length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/session/${log.sessionId}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      {t('table.viewDetails')} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-gray-400">{t('empty')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
