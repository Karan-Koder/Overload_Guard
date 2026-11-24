import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { addDays, dateKey } from '../lib/dates';
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['--import', 'tsx', 'mcp/workload-server/index.ts'],
  env: {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ),
    MCP_STANDALONE: process.env.MCP_SHARED_TEST === '1' ? '0' : '1',
  },
});
const client = new Client({ name: 'overload-guard-check', version: '1.0.0' });
async function main() {
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 6);
  assert.ok(tools.every((t) => !/send|accept|decline|delete/.test(t.name)));
  const today = dateKey();
  const to = addDays(today, 13);
  for (const name of [
    'list_calendar_events',
    'list_classroom_coursework',
    'search_deadline_emails',
  ]) {
    const result = await client.callTool({ name, arguments: { from: today, to } });
    assert.ok(!result.isError, JSON.stringify(result));
  }
  const draft = await client.callTool({
    name: 'create_gmail_draft',
    arguments: {
      to: 'rao@college.example',
      subject: 'MCP smoke test draft',
      body: 'This is a local prototype draft, never sent.',
    },
  });
  assert.ok(!draft.isError, JSON.stringify(draft));
  assert.match(JSON.stringify(draft), /awaiting_approval/);
  const freeDate = addDays(today, 2);
  const block = await client.callTool({
    name: 'create_calendar_block',
    arguments: { date: freeDate, start: '20:00', end: '21:00', title: 'MCP smoke test recovery' },
  });
  assert.ok(!block.isError, JSON.stringify(block));
  assert.match(JSON.stringify(block), /auto_applied/);
  const proposal = await client.callTool({
    name: 'propose_event_move',
    arguments: {
      eventId: 'club',
      newStart: `${freeDate}T18:00:00+05:30`,
      newEnd: `${freeDate}T19:00:00+05:30`,
    },
  });
  assert.ok(!proposal.isError, JSON.stringify(proposal));
  assert.match(JSON.stringify(proposal), /awaiting_approval/);
  console.log(
    `MCP verified: ${tools.map((t) => t.name).join(', ')}; all six tools called successfully.`,
  );
}
main()
  .finally(() => client.close())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
