'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  // 获取所有使用过的工具名称
  const allTools = Array.from(
    new Set(logs.flatMap((log) => (log.toolCalls || []).map((t) => t.toolName)))
  );

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    // 工具过滤
    if (selectedTool !== 'all') {
      const usesTool = (log.toolCalls || []).some((t) => t.toolName === selectedTool);
      if (!usesTool) return false;
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.sessionId.toLowerCase().includes(query) ||
        log.fileName.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // 总体统计
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
          <p>加载日志中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            OpenClaw 日志分析器
          </h1>
          <p className="text-gray-400">
            系统化分析模型行为、工具调用和 token 使用
          </p>
        </div>

        {/* 总体统计 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{totalStats.sessions}</div>
            <div className="text-sm text-gray-400">会话总数</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">{totalStats.totalEvents}</div>
            <div className="text-sm text-gray-400">事件总数</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-yellow-400">
              {totalStats.totalTokens.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">总 Token 数</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">
              ${totalStats.totalCost.toFixed(4)}
            </div>
            <div className="text-sm text-gray-400">总花费</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-pink-400">{totalStats.totalToolCalls}</div>
            <div className="text-sm text-gray-400">工具调用次数</div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">搜索</label>
              <input
                type="text"
                placeholder="搜索会话 ID 或文件名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">工具筛选</label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有工具</option>
                {allTools.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 会话列表 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  会话 ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  开始时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  花费
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  工具调用
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  操作
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
                    {new Date(log.startTime).toLocaleString('zh-CN')}
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
                      查看详情 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-gray-400">没有找到匹配的会话</div>
          )}
        </div>
      </div>
    </div>
  );
}
