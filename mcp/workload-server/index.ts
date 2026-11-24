import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { runTool, toolDescriptions, toolNames, toolSchemas, type ToolName } from './tools';
const server = new McpServer({ name: 'overload-guard-workload', version: '0.1.0' });
async function execute(name: ToolName, args: unknown) {
  if (process.env.MCP_STANDALONE === '1') return runTool(name, args);
  const response = await fetch('http://127.0.0.1:3000/api/mcp/tools', { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool: name, arguments: args }) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Tool failed'); return result;
}
for (const name of toolNames) {
  server.registerTool(name, { description: toolDescriptions[name], inputSchema: toolSchemas[name], annotations: { readOnlyHint: name.startsWith('list_') || name.startsWith('search_'), destructiveHint: false, idempotentHint: name.startsWith('list_') || name.startsWith('search_'), openWorldHint: false } }, async (args: unknown) => {
    try { return { content: [{ type: 'text' as const, text: JSON.stringify(await execute(name, args)) }] }; }
    catch (error) { return { isError: true, content: [{ type: 'text' as const, text: `Tool failed: ${error instanceof Error ? error.message : 'unknown error'}. Start npm run dev to share dashboard state, or set MCP_STANDALONE=1 for an isolated offline store.` }] }; }
  });
}
server.connect(new StdioServerTransport()).catch(error => { console.error('MCP server failed:', error instanceof Error ? error.message : 'unknown error'); process.exitCode = 1; });
