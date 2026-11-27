import { execFileSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

test('exposes the existing tools and their descriptions over stdio', async () => {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc']);
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key !== 'MCP_SERVER_TYPE') env[key] = value;
  }
  Object.assign(env, {
    PLANKA_BASE_URL: 'http://127.0.0.1:9',
    PLANKA_AGENT_EMAIL: 'test@example.com',
    PLANKA_AGENT_PASSWORD: 'test',
  });
  const client = new Client({ name: 'smoke-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/index.js'],
    env,
    stderr: 'pipe',
  });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools.map(tool => tool.name).sort()).toEqual([
      'mcp_kanban_project_board_manager', 'mcp_kanban_list_manager',
      'mcp_kanban_card_manager', 'mcp_kanban_stopwatch',
      'mcp_kanban_label_manager', 'mcp_kanban_task_manager',
      'mcp_kanban_comment_manager', 'mcp_kanban_membership_manager',
    ].sort());
    const project = tools.find(tool => tool.name === 'mcp_kanban_project_board_manager')!;
    const list = tools.find(tool => tool.name === 'mcp_kanban_list_manager')!;
    expect((project.inputSchema.properties!.id as { description: string }).description).toBe('The ID of the project or board');
    expect((list.inputSchema.properties!.id as { description: string }).description).toBe('The ID of the list');
    const invalid = await client.callTool({ name: 'mcp_kanban_stopwatch', arguments: {} });
    expect(invalid.isError).toBe(true);
  } finally {
    await client.close();
  }
}, 30_000);
