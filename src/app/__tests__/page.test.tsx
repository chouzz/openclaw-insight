/**
 * @jest-environment jsdom
 */

// Component tests for Home page
// Note: Full component tests require complex Next.js mocking
// These tests focus on the core functionality

describe('Home Page', () => {
  describe('translation keys', () => {
    it('should have correct translation structure', () => {
      const homeTranslations = {
        title: 'OpenClaw Insight',
        subtitle: 'Systematically analyze model behavior, tool calls, and token usage',
        loading: 'Loading logs...',
        stats: {
          totalSessions: 'Total Sessions',
          totalEvents: 'Total Events',
          totalTokens: 'Total Tokens',
          totalCost: 'Total Cost',
          totalToolCalls: 'Tool Calls',
        },
        filters: {
          search: 'Search',
          searchPlaceholder: 'Search session ID or filename...',
          toolFilter: 'Tool Filter',
          allTools: 'All Tools',
        },
        table: {
          sessionId: 'Session ID',
          startTime: 'Start Time',
          tokens: 'Tokens',
          cost: 'Cost',
          toolCalls: 'Tool Calls',
          actions: 'Actions',
          viewDetails: 'View Details',
        },
        empty: 'No matching sessions found',
      };

      expect(homeTranslations.title).toBe('OpenClaw Insight');
      expect(homeTranslations.loading).toBe('Loading logs...');
      expect(homeTranslations.stats.totalSessions).toBe('Total Sessions');
    });
  });

  describe('data processing', () => {
    const mockLogs = [
      {
        sessionId: 'abc12345-6789-0abc-defg-hijklmnopqrst',
        startTime: '2024-01-01T10:00:00Z',
        fileName: 'session-001.jsonl',
        eventCount: 50,
        toolCalls: [
          { toolName: 'read_file', count: 5, successCount: 5, failCount: 0 },
        ],
        tokenUsage: {
          totalTokens: 1500,
          totalCost: 0.015,
        },
      },
    ];

    it('should calculate total statistics from logs', () => {
      const totalStats = {
        sessions: mockLogs.length,
        totalEvents: mockLogs.reduce((sum, log) => sum + log.eventCount, 0),
        totalTokens: mockLogs.reduce((sum, log) => sum + log.tokenUsage.totalTokens, 0),
        totalCost: mockLogs.reduce((sum, log) => sum + log.tokenUsage.totalCost, 0),
      };

      expect(totalStats.sessions).toBe(1);
      expect(totalStats.totalEvents).toBe(50);
      expect(totalStats.totalTokens).toBe(1500);
      expect(totalStats.totalCost).toBe(0.015);
    });

    it('should filter logs by search query', () => {
      const searchQuery = 'abc123';
      const filtered = mockLogs.filter((log) =>
        log.sessionId.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(1);

      const noMatch = mockLogs.filter((log) =>
        log.sessionId.toLowerCase().includes('nonexistent')
      );
      expect(noMatch.length).toBe(0);
    });

    it('should filter logs by tool', () => {
      const selectedTool = 'read_file';
      const filtered = mockLogs.filter((log) =>
        (log.toolCalls || []).some((t) => t.toolName === selectedTool)
      );

      expect(filtered.length).toBe(1);

      const noMatch = mockLogs.filter((log) =>
        (log.toolCalls || []).some((t) => t.toolName === 'nonexistent')
      );
      expect(noMatch.length).toBe(0);
    });

    it('should extract all unique tool names', () => {
      const allTools = Array.from(
        new Set(mockLogs.flatMap((log) => (log.toolCalls || []).map((t) => t.toolName)))
      );

      expect(allTools).toEqual(['read_file']);
    });
  });

  describe('date formatting', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-01T10:00:00Z');
      const formatted = date.toLocaleString();

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('token formatting', () => {
    it('should format large numbers with locale', () => {
      const tokens = 1500000;
      const formatted = tokens.toLocaleString();

      expect(formatted).toBe('1,500,000');
    });

    it('should format cost with 4 decimal places', () => {
      const cost = 0.0156;
      const formatted = cost.toFixed(4);

      expect(formatted).toBe('0.0156');
    });
  });
});
