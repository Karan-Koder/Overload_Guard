import { beforeEach, describe, expect, it } from 'vitest';
import { createSeed } from '../lib/data/seed';
import { addDays, dateKey } from '../lib/dates';
import { MemoryStore } from '../lib/store/memory';
import {
  act,
  addDemo,
  briefing,
  changeSettings,
  deleteAllData,
  scan,
  snapshot,
} from '../lib/service';
import { runTool, toolNames } from '../mcp/workload-server/tools';
let db: MemoryStore;
beforeEach(() => {
  db = new MemoryStore(createSeed(new Date('2026-11-24T12:00:00+05:30')));
});
describe('demo lifecycle and approvals', () => {
  it('generates honest 97 → 57 preview, green Undo, and amber proposals', async () => {
    const state = await addDemo(db);
    expect(state.projections[state.demoDate]).toMatchObject({ before: 97, after: 57 });
    expect(state.suggestions.filter((s) => s.tier === 'amber').length).toBeGreaterThanOrEqual(2);
    const recovery = state.suggestions.find((s) => s.status === 'auto_applied')!;
    expect(recovery.createdItemId).toBeTruthy();
    const block = state.items.find((i) => i.id === recovery.createdItemId)!;
    expect(
      state.items.some(
        (i) =>
          i.id !== block.id &&
          i.start &&
          i.end &&
          new Date(i.start) < new Date(block.end!) &&
          new Date(i.end) > new Date(block.start!),
      ),
    ).toBe(false);
    const after = act(recovery.id, 'undo', undefined, db);
    expect(after.items.some((i) => i.id === block.id)).toBe(false);
    expect(after.audit.some((a) => a.suggestionId === recovery.id && a.reversible)).toBe(false);
    expect(scan(db).suggestions.find((s) => s.id === recovery.id)?.status).toBe('undone');
  });
  it('does not duplicate load, suggestions, or blocks on repeated scans', async () => {
    const one = await addDemo(db);
    const two = await addDemo(db);
    expect(two.items).toEqual(one.items);
    expect(two.suggestions).toEqual(one.suggestions);
    expect(two.audit).toEqual(one.audit);
  });
  it('approves edited drafts without changing deadlines or sending email', async () => {
    const state = await addDemo(db);
    const suggestion = state.suggestions.find((s) => s.draft)!;
    const draft = { ...suggestion.draft!, body: 'Edited extension request for review.' };
    const edited = act(suggestion.id, 'edit', draft, db);
    expect(edited.suggestions.find((s) => s.id === suggestion.id)?.draft?.body).toBe(draft.body);
    const after = act(suggestion.id, 'approve', draft, db);
    expect(after.items).toEqual(state.items);
    expect(after.sentEmails).toEqual(state.sentEmails);
    expect(after.audit[0].action).toBe('Draft approved — saved as Gmail draft (prototype)');
    expect(() => act(suggestion.id, 'approve', draft, db)).toThrow('no longer');
  });
  it('rejects malformed drafts atomically', async () => {
    const state = await addDemo(db);
    const id = state.suggestions.find((s) => s.draft)!.id;
    expect(() => act(id, 'approve', { to: 'not-email', subject: '', body: '' }, db)).toThrow();
    expect(snapshot(db).suggestions.find((s) => s.id === id)?.status).toBe('awaiting_approval');
  });
  it('rejects a proposal with no event change and excludes it from projection', async () => {
    const state = await addDemo(db);
    const s = state.suggestions.find((s) => s.type === 'propose_reschedule')!;
    const after = act(s.id, 'reject', undefined, db);
    expect(after.items).toEqual(state.items);
    expect(after.projections[state.demoDate].after).toBeGreaterThan(
      state.projections[state.demoDate].after,
    );
  });
  it('keeps injection deadlines in load and never generates actions from its text', async () => {
    const state = await addDemo(db);
    const item = state.items.find((i) => i.flagged)!;
    expect(
      state.scores
        .find((s) => s.date === dateKey(item.due!))
        ?.reasons.some((r) => r.itemIds.includes(item.id)),
    ).toBe(true);
    expect(state.suggestions.some((s) => s.targetItemId === item.id)).toBe(false);
    expect(state.audit.some((a) => a.tier === 'red')).toBe(true);
  });
  it('disables sources in scoring without destroying data', () => {
    const state = snapshot(db);
    const after = changeSettings(
      { ...state.settings, connected: { calendar: false, gmail: false, classroom: false } },
      db,
    );
    expect(after.scores.every((d) => d.score === 0)).toBe(true);
    expect(after.items.length).toBe(state.items.length);
  });
  it('deletes data and does not silently reseed', async () => {
    await addDemo(db);
    deleteAllData(db);
    const after = scan(db);
    expect(after.items).toEqual([]);
    expect(after.suggestions).toEqual([]);
    expect(after.audit).toEqual([]);
    expect(after.sentEmails).toEqual([]);
    expect(after.student).toBe('');
    await expect(addDemo(db)).rejects.toThrow('Reset');
  });
  it('keeps briefings under sixty words', async () => {
    await addDemo(db);
    expect(briefing(db).text.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
  });
});
describe('MCP tool contracts', () => {
  it('exposes only the six limited tools', () => {
    expect(toolNames).toHaveLength(6);
    expect(toolNames.some((t) => /send|delete|accept|decline/.test(t))).toBe(false);
  });
  it('marks email content untrusted', () => {
    const s = db.read();
    const results = runTool(
      'search_deadline_emails',
      { from: s.startDate, to: addDays(s.startDate, 13) },
      db,
    ) as { untrusted: boolean }[];
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.untrusted)).toBe(true);
  });
  it('queues a draft, requiring approval before saving', () => {
    const result = runTool(
      'create_gmail_draft',
      {
        to: 'prof@college.example',
        subject: 'Extension request',
        body: 'May I have an extension?',
      },
      db,
    ) as { status: string };
    expect(result.status).toBe('awaiting_approval');
    expect(db.read().sentEmails).toEqual(
      createSeed(new Date('2026-11-24T12:00:00+05:30')).sentEmails,
    );
  });
  it('rejects mismatched date ranges and impossible dates', () => {
    expect(() =>
      runTool('list_calendar_events', { from: '2026-02-30', to: '2026-03-01' }, db),
    ).toThrow();
    expect(() =>
      runTool('list_calendar_events', { from: '2026-11-30', to: '2026-11-01' }, db),
    ).toThrow();
  });
  it('creates a reversible recovery block and logs it', () => {
    const result = runTool(
      'create_calendar_block',
      { date: '2026-11-25', start: '18:00', end: '20:00', title: 'Recovery' },
      db,
    ) as { suggestionId: string };
    expect(db.read().audit[0].reversible).toBe(true);
    const calendar = runTool(
      'list_calendar_events',
      { from: '2026-11-25', to: '2026-11-25' },
      db,
    ) as { title: string }[];
    expect(calendar.some((item) => item.title === 'Recovery')).toBe(true);
    act(result.suggestionId, 'undo', undefined, db);
    expect(db.read().items.some((i) => i.recovery)).toBe(false);
  });
  it('rejects calendar conflicts, immovable events, and reversed intervals', () => {
    expect(() =>
      runTool(
        'create_calendar_block',
        { date: '2026-11-25', start: '10:00', end: '12:00', title: 'Conflict' },
        db,
      ),
    ).toThrow('overlaps');
    expect(() =>
      runTool(
        'propose_event_move',
        {
          eventId: 'classes-2026-11-25',
          newStart: '2026-11-25T18:00:00+05:30',
          newEnd: '2026-11-25T20:00:00+05:30',
        },
        db,
      ),
    ).toThrow('cannot be moved');
    expect(() =>
      runTool(
        'create_calendar_block',
        { date: '2026-11-25', start: '20:00', end: '18:00', title: 'Reversed' },
        db,
      ),
    ).toThrow();
  });
});
