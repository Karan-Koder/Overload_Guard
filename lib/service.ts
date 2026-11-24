import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { demoItems } from './data/seed';
import { addDays, dateKey, prettyDate } from './dates';
import { scoreTimeline } from './engine/score';
import { generateSuggestions, projectScores } from './engine/suggest';
import { draftExtension, providerName } from './llm';
import { assertAllowed, evaluate } from './policy/tiers';
import { detectInjection } from './security/injection';
import { store } from './store';
import type { Store } from './store';
import type { AuditEntry, Snapshot, StoreState, Suggestion } from './types';
export const draftSchema = z.object({ to: z.string().email().max(254), subject: z.string().trim().min(1).max(300), body: z.string().trim().min(1).max(8000) }).strict();
export const settingsSchema = z.object({ connected: z.object({ calendar: z.boolean(), gmail: z.boolean(), classroom: z.boolean() }).strict(), language: z.enum(['en', 'kn', 'hi']) }).strict();
export function activeItems(state: StoreState) { return state.items.filter(i => i.source === 'manual' || state.settings.connected[i.source]); }
export function record(state: StoreState, entry: Omit<AuditEntry, 'id' | 'at'>) { state.audit.unshift({ id: randomUUID(), at: new Date().toISOString(), ...entry }); }
export function snapshot(database: Store = store): Snapshot {
  const state = database.read(); const scores = scoreTimeline(activeItems(state), state.startDate, state.settings.connected.gmail ? state.sentEmails : [], state.sleep);
  return { ...state, scores, projections: projectScores({ ...state, items: activeItems(state), sentEmails: state.settings.connected.gmail ? state.sentEmails : [] }, scores), provider: providerName() };
}
export function scan(database: Store = store) {
  database.update(state => {
    if (state.deleted) return;
    const items = activeItems(state);
    const scores = scoreTimeline(items, state.startDate, state.settings.connected.gmail ? state.sentEmails : [], state.sleep);
    for (const proposal of generateSuggestions({ ...state, items }, scores)) {
      if (state.suggestions.some(s => s.id === proposal.id)) continue;
      const policy = evaluate({ type: proposal.type, origin: 'trusted' });
      if (!policy.allowed) { record(state, { actor: 'agent', action: 'Blocked by policy', tier: 'red', detail: policy.reason, reversible: false }); continue; }
      proposal.tier = policy.tier;
      if (policy.tier === 'green') {
        assertAllowed({ type: proposal.type });
        proposal.status = 'auto_applied'; proposal.createdItemId = `block-${proposal.id}`;
        state.items.push({ id: proposal.createdItemId, title: 'Recovery time · protected', source: 'manual', category: 'personal', kind: 'event', start: proposal.proposedStart, end: proposal.proposedEnd, movable: false, priority: 1, recovery: true });
        record(state, { actor: 'agent', action: 'Recovery time protected', tier: 'green', detail: `Reserved two hours on ${prettyDate(dateKey(proposal.proposedStart!))}. Local demo calendar only.`, reversible: true, suggestionId: proposal.id });
      } else record(state, { actor: 'agent', action: 'Approval requested', tier: 'amber', detail: proposal.title, reversible: false, suggestionId: proposal.id });
      state.suggestions.push(proposal);
    }
  });
  return snapshot(database);
}
export async function addDemo(database: Store = store) {
  database.update(state => {
    if (state.deleted) throw new Error('Reset the demo before adding sample load.');
    if (state.demoAdded) return;
    state.items.push(...demoItems(state.demoDate).map(i => ({ ...i, flagged: detectInjection(i.rawText) })));
    state.demoAdded = true;
    record(state, { actor: 'user', action: 'Demo load added', tier: 'green', detail: 'Added DAA problem set, project proposal and a two-hour team sync.', reversible: false });
  });
  scan(database);
  const state = database.read();
  // Providers only write prose; deterministic code creates and authorizes every action.
  if (process.env.LLM_PROVIDER && process.env.LLM_PROVIDER !== 'mock') {
    for (const suggestion of state.suggestions.filter(s => s.draft && s.status === 'awaiting_approval')) {
      const target = state.items.find(i => i.id === suggestion.targetItemId);
      if (!target || target.flagged) continue;
      const body = await draftExtension({ student: state.student, title: target.title, owner: target.owner?.name ?? 'Professor', date: prettyDate(suggestion.date), proposedDate: prettyDate(dateKey(suggestion.proposedDue!)), evaluations: state.items.filter(i => i.due && dateKey(i.due) === suggestion.date).map(i => i.title) });
      database.update(current => { const s = current.suggestions.find(s => s.id === suggestion.id); if (s?.draft && s.status === 'awaiting_approval' && s.draft.body === suggestion.draft!.body) s.draft.body = body; });
    }
  }
  return snapshot(database);
}
export function act(id: string, command: 'approve' | 'reject' | 'edit' | 'undo', draft?: unknown, database: Store = store) {
  database.update(state => {
    const suggestion = state.suggestions.find(s => s.id === id); if (!suggestion) throw new Error('Suggestion not found');
    if (command === 'undo') {
      if (suggestion.tier !== 'green' || suggestion.status !== 'auto_applied' || !suggestion.createdItemId) throw new Error('Only active reversible green actions can be undone');
      state.items = state.items.filter(i => i.id !== suggestion.createdItemId); suggestion.status = 'undone';
      state.audit.forEach(a => { if (a.suggestionId === id) a.reversible = false; });
      record(state, { actor: 'user', action: 'Recovery block undone', tier: 'green', detail: suggestion.title, reversible: false, suggestionId: id }); return;
    }
    if (suggestion.tier !== 'amber' || suggestion.status !== 'awaiting_approval') throw new Error('This action is no longer awaiting approval');
    if (command === 'reject') {
      suggestion.status = 'rejected'; record(state, { actor: 'user', action: 'Suggestion rejected', tier: 'amber', detail: suggestion.title, reversible: false, suggestionId: id }); return;
    }
    if (draft !== undefined) {
      if (!suggestion.draft) throw new Error('This suggestion has no email draft');
      suggestion.draft = draftSchema.parse(draft);
    }
    if (command === 'edit') {
      if (!suggestion.draft || draft === undefined) throw new Error('A valid email draft is required');
      record(state, { actor: 'user', action: 'Draft edited', tier: 'amber', detail: suggestion.draft.subject, reversible: false, suggestionId: id }); return;
    }
    assertAllowed({ type: suggestion.type, origin: 'trusted' }, true);
    suggestion.status = 'approved';
    record(state, { actor: 'user', action: suggestion.draft ? 'Draft approved — saved as Gmail draft (prototype)' : 'Meeting move proposal approved (prototype)', tier: 'amber', detail: suggestion.draft ? `To: ${suggestion.draft.to}. Stored locally; no email sent. Deadline stays unchanged until the professor agrees.` : `${suggestion.title}. Proposal stored locally; the original event is unchanged.`, reversible: false, suggestionId: id });
  });
  return snapshot(database);
}
export function resetDemo(database: Store = store) { database.reset(); return snapshot(database); }
export function changeSettings(value: unknown, database: Store = store) {
  const settings = settingsSchema.parse(value);
  database.update(state => {
    state.settings = settings;
    record(state, { actor: 'user', action: 'Settings updated', tier: 'green', detail: `Sample sources: ${Object.entries(settings.connected).filter(([, enabled]) => enabled).map(([name]) => name).join(', ') || 'none'}. Voice: ${settings.language}.`, reversible: false });
  });
  return snapshot(database);
}
export function deleteAllData(database: Store = store) {
  database.update(state => { state.items = []; state.suggestions = []; state.audit = []; state.sentEmails = []; state.sleep = {}; state.student = ''; state.demoAdded = false; state.deleted = true; state.settings = { language: 'en', connected: { calendar: false, gmail: false, classroom: false } }; });
  return snapshot(database);
}
export function briefing(database: Store = store) {
  const state = snapshot(database); const peak = [...state.scores].sort((a, b) => b.score - a.score)[0];
  const pending = state.suggestions.filter(s => s.status === 'awaiting_approval').length;
  const blocks = state.suggestions.filter(s => s.status === 'auto_applied').length;
  const text = state.deleted ? 'Your demo data has been deleted. Reset the demo when you want to explore Overload Guard again.' : `Your next fourteen days look ${peak.score >= 70 ? 'heavy' : 'manageable overall'}. ${prettyDate(peak.date)} is busiest, with a workload score of ${peak.score}. ${blocks ? `I've protected ${blocks} recovery slot${blocks === 1 ? '' : 's'}. ` : ''}${pending ? `${pending} draft${pending === 1 ? ' or proposal is' : 's or proposals are'} waiting for your approval. ` : ''}You stay in control. Nothing is sent automatically.`;
  return { text, language: 'en', note: state.settings.language !== 'en' ? 'Kannada and Hindi translation is planned for Phase B. This briefing is in English.' : undefined };
}
export function queueMcpSuggestion(suggestion: Suggestion, database: Store = store) {
  const policy = evaluate({ type: suggestion.type, origin: 'trusted' });
  if (!policy.allowed || policy.tier !== 'amber') throw new Error('Blocked by policy');
  database.update(state => { if (state.deleted) throw new Error('Demo data deleted; reset first'); state.suggestions.push({ ...suggestion, tier: 'amber', status: 'awaiting_approval' }); record(state, { actor: 'agent', action: 'MCP approval requested', tier: 'amber', detail: suggestion.title, reversible: false, suggestionId: suggestion.id }); });
  return { suggestionId: suggestion.id, status: 'awaiting_approval', message: 'Review in the Approval inbox. Nothing sent or moved.' };
}
export { store };
