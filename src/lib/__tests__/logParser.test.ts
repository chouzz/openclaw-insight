import {
  extractToolCalls,
  calculateTokenUsage,
  buildEventTree,
} from '../logParser';
import { LogEvent } from '@/types/log';

describe('logParser', () => {
  describe('extractToolCalls', () => {
    it('should extract tool calls from events', () => {
      const events: LogEvent[] = [
        {
          type: 'tool',
          id: 'tool-1',
          parentId: null,
          timestamp: '2024-01-01T00:00:00Z',
          tool: { name: 'read_file', arguments: { path: '/test.txt' } },
        },
        {
          type: 'tool',
          id: 'tool-2',
          parentId: null,
          timestamp: '2024-01-01T00:01:00Z',
          tool: { name: 'read_file', arguments: { path: '/test2.txt' } },
        },
        {
          type: 'tool',
          id: 'tool-3',
          parentId: null,
          timestamp: '2024-01-01T00:02:00Z',
          tool: { name: 'write_file', arguments: { path: '/output.txt' } },
        },
        {
          type: 'tool_result',
          id: 'result-1',
          parentId: null,
          timestamp: '2024-01-01T00:00:01Z',
          toolResult: { toolCallId: 'tool-1', result: 'success' },
        },
        {
          type: 'tool_result',
          id: 'result-2',
          parentId: null,
          timestamp: '2024-01-01T00:01:01Z',
          toolResult: { toolCallId: 'tool-2', result: 'success' },
        },
        {
          type: 'tool_result',
          id: 'result-3',
          parentId: null,
          timestamp: '2024-01-01T00:02:01Z',
          toolResult: { toolCallId: 'tool-3', result: 'success', error: 'Permission denied' },
        },
      ];

      const result = extractToolCalls(events);

      expect(result).toHaveLength(2);
      expect(result.find((t) => t.toolName === 'read_file')).toEqual({
        toolName: 'read_file',
        count: 2,
        successCount: 2,
        failCount: 0,
      });
      expect(result.find((t) => t.toolName === 'write_file')).toEqual({
        toolName: 'write_file',
        count: 1,
        successCount: 0,
        failCount: 1,
      });
    });

    it('should handle empty events array', () => {
      const result = extractToolCalls([]);
      expect(result).toEqual([]);
    });

    it('should handle events with no tool calls', () => {
      const events: LogEvent[] = [
        {
          type: 'message',
          id: 'msg-1',
          parentId: null,
          timestamp: '2024-01-01T00:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
            timestamp: Date.now(),
          },
        },
      ];

      const result = extractToolCalls(events);
      expect(result).toEqual([]);
    });
  });

  describe('calculateTokenUsage', () => {
    it('should calculate total token usage from events', () => {
      const events: LogEvent[] = [
        {
          type: 'message',
          id: 'msg-1',
          parentId: null,
          timestamp: '2024-01-01T00:00:00Z',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hello' }],
            timestamp: Date.now(),
            usage: {
              input: 100,
              output: 50,
              cacheRead: 10,
              cacheWrite: 5,
              totalTokens: 150,
              cost: {
                input: 0.001,
                output: 0.002,
                cacheRead: 0.0001,
                cacheWrite: 0.0002,
                total: 0.0033,
              },
            },
          },
        },
        {
          type: 'message',
          id: 'msg-2',
          parentId: null,
          timestamp: '2024-01-01T00:01:00Z',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'World' }],
            timestamp: Date.now(),
            usage: {
              input: 200,
              output: 100,
              cacheRead: 20,
              cacheWrite: 10,
              totalTokens: 300,
              cost: {
                input: 0.002,
                output: 0.004,
                cacheRead: 0.0002,
                cacheWrite: 0.0004,
                total: 0.0066,
              },
            },
          },
        },
      ];

      const result = calculateTokenUsage(events);

      expect(result).toEqual({
        totalInput: 300,
        totalOutput: 150,
        totalCacheRead: 30,
        totalCacheWrite: 15,
        totalTokens: 450,
        totalCost: expect.closeTo(0.0099, 4),
      });
    });

    it('should handle events without usage data', () => {
      const events: LogEvent[] = [
        {
          type: 'message',
          id: 'msg-1',
          parentId: null,
          timestamp: '2024-01-01T00:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
            timestamp: Date.now(),
          },
        },
      ];

      const result = calculateTokenUsage(events);

      expect(result).toEqual({
        totalInput: 0,
        totalOutput: 0,
        totalCacheRead: 0,
        totalCacheWrite: 0,
        totalTokens: 0,
        totalCost: 0,
      });
    });

    it('should handle empty events array', () => {
      const result = calculateTokenUsage([]);
      expect(result).toEqual({
        totalInput: 0,
        totalOutput: 0,
        totalCacheRead: 0,
        totalCacheWrite: 0,
        totalTokens: 0,
        totalCost: 0,
      });
    });
  });

  describe('buildEventTree', () => {
    it('should build a tree from events with parent-child relationships', () => {
      const events: LogEvent[] = [
        {
          type: 'message',
          id: 'root-1',
          parentId: null,
          timestamp: '2024-01-01T00:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Hello' }],
            timestamp: Date.now(),
          },
        },
        {
          type: 'message',
          id: 'child-1',
          parentId: 'root-1',
          timestamp: '2024-01-01T00:00:01Z',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Hi' }],
            timestamp: Date.now(),
          },
        },
        {
          type: 'message',
          id: 'child-2',
          parentId: 'root-1',
          timestamp: '2024-01-01T00:00:02Z',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'There' }],
            timestamp: Date.now(),
          },
        },
      ];

      const result = buildEventTree(events);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('root-1');
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children.map((c) => c.id)).toEqual(['child-1', 'child-2']);
    });

    it('should handle multiple root events', () => {
      const events: LogEvent[] = [
        {
          type: 'message',
          id: 'root-1',
          parentId: null,
          timestamp: '2024-01-01T00:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'First' }],
            timestamp: Date.now(),
          },
        },
        {
          type: 'message',
          id: 'root-2',
          parentId: null,
          timestamp: '2024-01-01T00:01:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Second' }],
            timestamp: Date.now(),
          },
        },
      ];

      const result = buildEventTree(events);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(['root-1', 'root-2']);
    });

    it('should handle nested children', () => {
      const events: LogEvent[] = [
        {
          type: 'message',
          id: 'root',
          parentId: null,
          timestamp: '2024-01-01T00:00:00Z',
          message: {
            role: 'user',
            content: [{ type: 'text', text: 'Root' }],
            timestamp: Date.now(),
          },
        },
        {
          type: 'message',
          id: 'child',
          parentId: 'root',
          timestamp: '2024-01-01T00:00:01Z',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Child' }],
            timestamp: Date.now(),
          },
        },
        {
          type: 'message',
          id: 'grandchild',
          parentId: 'child',
          timestamp: '2024-01-01T00:00:02Z',
          message: {
            role: 'system',
            content: [{ type: 'text', text: 'Grandchild' }],
            timestamp: Date.now(),
          },
        },
      ];

      const result = buildEventTree(events);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('root');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('child');
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].id).toBe('grandchild');
    });

    it('should handle empty events array', () => {
      const result = buildEventTree([]);
      expect(result).toEqual([]);
    });
  });
});
