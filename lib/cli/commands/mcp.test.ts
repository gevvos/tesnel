import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolve } from 'path';
import { mcpCommand } from './mcp.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mcpCommand', () => {
  it('exits with error when data file does not exist', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(
      mcpCommand({ data: '/nonexistent/path/output.json' }),
    ).rejects.toThrow('process.exit');

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('tesnel data not found'),
    );
  });

  it('shows hint to run analyze first', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(
      mcpCommand({ data: '/nonexistent/output.json' }),
    ).rejects.toThrow();

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('tesnel analyze'),
    );
  });

  it('defaults to .tesnel/output.json path', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(mcpCommand({})).rejects.toThrow('process.exit');

    const errorCall = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(errorCall).toContain('.tesnel/output.json');
  });
});
