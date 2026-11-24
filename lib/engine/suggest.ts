import { addDays, at, dateKey, prettyDate } from '../dates';
import { scoreTimeline, eventIntervals } from './score';
import { templateDraft } from '../llm/adapters/mock';
import type { DayScore, StoreState, Suggestion, WorkItem } from '../types';
export function findRecoverySlot(state: StoreState, date: string, scores: DayScore[]) {
  const candidates = scores.filter(d => Math.abs((new Date(d.date).getTime() - new Date(date).getTime()) / 86400000) <= 1).sort((a, b) => a.score - b.score || a.date.localeCompare(b.date));
  for (const day of candidates) for (const hour of [18, 19, 20, 16, 17]) {
    const start = new Date(at(day.date, hour)).getTime(); const end = start + 7200000;
    if (!state.items.some(i => i.kind === 'event' && i.start && i.end && new Date(i.start).getTime() < end && new Date(i.end).getTime() > start)) return { start: at(day.date, hour), end: at(day.date, hour + 2) };
  }
}
export function generateSuggestions(state: StoreState, scores: DayScore[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  for (const day of scores.filter(d => d.score >= 60)) {
    const due = state.items.filter(i => i.due && dateKey(i.due) === day.date);
    const scheduled = eventIntervals(state.items, day.date).map(i => i.item);
    const contextItems = [...due, ...scheduled].filter(i => i.category !== 'class');
    const why = `${prettyDate(day.date)} has ${contextItems.map(i => i.title).join(', ')}${day.reasons.some(r => r.label.startsWith('Prep for')) ? ', plus evaluation preparation' : ''}.`;
    const slot = findRecoverySlot(state, day.date, scores);
    if (slot) suggestions.push({ id: `recovery-${day.date}`, date: day.date, tier: 'green', type: 'block_recovery', title: 'Protect two hours to recharge', explanation: `${why} ${prettyDate(dateKey(slot.start), true)} has a free evening slot.`, proposedStart: slot.start, proposedEnd: slot.end, status: 'suggested' });
    for (const target of due.filter(i => i.movable && i.owner && !i.flagged).sort((a, b) => b.priority - a.priority)) {
      const proposedDue = at(addDays(day.date, 3), 19);
      suggestions.push({ id: `extension-${target.id}`, date: day.date, tier: 'amber', type: 'draft_extension_email', targetItemId: target.id, title: `Request an extension: ${target.title}`, explanation: `${why} Asking for a short extension would move this deadline off the busiest day.`, proposedDue, status: 'awaiting_approval', draft: { to: target.owner!.email, subject: `Request for a short extension — ${target.title}`, body: templateDraft({ student: state.student, title: target.title, owner: target.owner!.name, date: prettyDate(day.date), proposedDate: prettyDate(dateKey(proposedDue)), evaluations: contextItems.filter(i => i.kind === 'deadline').map(i => i.title) }) } });
    }
    const target = scheduled.filter(i => i.movable && ['club', 'meeting'].includes(i.category) && !i.flagged).sort((a, b) => (a.category === 'club' ? -1 : 1) - (b.category === 'club' ? -1 : 1))[0];
    if (target?.start && target.end) {
      const candidates = scores.filter(d => d.date > day.date && d.date <= addDays(day.date, 5)).sort((a, b) => a.score - b.score);
      const duration = new Date(target.end).getTime() - new Date(target.start).getTime();
      let slot: { start: string; end: string } | undefined;
      for (const candidate of candidates) {
        for (const hour of [17, 18, 15, 16]) {
          const start = at(candidate.date, hour); const end = new Date(new Date(start).getTime() + duration).toISOString();
          if (!state.items.some(i => i.kind === 'event' && i.start && i.end && new Date(i.start) < new Date(end) && new Date(i.end) > new Date(start))) { slot = { start, end }; break; }
        }
        if (slot) break;
      }
      if (slot) suggestions.push({ id: `move-${target.id}`, date: day.date, tier: 'amber', type: 'propose_reschedule', targetItemId: target.id, title: `Move ${target.title}`, explanation: `${why} Propose ${prettyDate(dateKey(slot.start))}, a lighter day with a free slot.`, proposedStart: slot.start, proposedEnd: slot.end, status: 'awaiting_approval' });
    }
  }
  return suggestions;
}
export function projectScores(state: StoreState, scores: DayScore[]) {
  const result: Record<string, { before: number; after: number; suggestionIds: string[] }> = {};
  for (const day of scores) {
    const proposals = state.suggestions.filter(s => s.date === day.date && s.tier === 'amber' && ['awaiting_approval', 'approved'].includes(s.status));
    if (!proposals.length) continue;
    const items: WorkItem[] = structuredClone(state.items);
    for (const s of proposals) {
      const target = items.find(i => i.id === s.targetItemId); if (!target) continue;
      if (s.proposedDue) target.due = s.proposedDue;
      if (s.type === 'propose_reschedule') { target.start = s.proposedStart; target.end = s.proposedEnd; }
    }
    const after = scoreTimeline(items, state.startDate, state.sentEmails, state.sleep).find(d => d.date === day.date)!.score;
    result[day.date] = { before: day.score, after, suggestionIds: proposals.map(s => s.id) };
  }
  return result;
}
