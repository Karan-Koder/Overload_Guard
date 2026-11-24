import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const transport = new StdioClientTransport({ command: process.execPath, args: ['--import', 'tsx', 'mcp/workload-server/index.ts'], env: { ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)), MCP_STANDALONE: process.env.MCP_SHARED_TEST === '1' ? '0' : '1' } });
const client = new Client({ name: 'overload-guard-check', version: '1.0.0' });
async function main() {
  await client.connect(transport);
  const { tools } = await client.listTools(); assert.equal(tools.length, 6); assert.ok(tools.every(t => !/send|accept|decline|delete/.test(t.name)));
  const today = new Date().toISOString().slice(0, 10); const to = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  for (const name of ['list_calendar_events', 'list_classroom_coursework', 'search_deadline_emails']) {
    const result = await client.callTool({ name, arguments: { from: today, to } }); assert.ok(!result.isError, JSON.stringify(result));
  }
  const draft = await client.callTool({ name: 'create_gmail_draft', arguments: { to: 'rao@college.example', subject: 'MCP smoke test draft', body: 'This is a local prototype draft, never sent.' } });
  assert.ok(!draft.isError, JSON.stringify(draft)); assert.match(JSON.stringify(draft), /awaiting_approval/);
  console.log(`MCP verified: ${tools.map(t => t.name).join(', ')}; all read tools and queued draft passed.`);
}
main().finally(() => client.close()).catch(error => { console.error(error); process.exitCode = 1; });
