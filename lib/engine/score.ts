import { addDays, at, dateKey, minutes, prettyDate } from '../dates';
import type { DayScore, WorkItem } from '../types';
export const DEADLINE_WEIGHTS: Partial<Record<WorkItem['category'], number>> = { exam: 30, project: 20, assignment: 12, lab_record: 10, quiz: 8, work: 15 };
export function eventIntervals(items: WorkItem[], date: string): { start: number; end: number; item: WorkItem }[] {
  const dayStart = new Date(at(date, 0)).getTime();
  const dayEnd = new Date(at(addDays(date, 1), 0)).getTime();
  return items.filter(i => i.kind === 'event' && !i.recovery && i.start && i.end).flatMap(item => {
    const start = Math.max(new Date(item.start!).getTime(), dayStart);
    const end = Math.min(new Date(item.end!).getTime(), dayEnd);
    return end > start ? [{ start: (start - dayStart) / 60000, end: (end - dayStart) / 60000, item }] : [];
  });
}
export function hasRealBreak(intervals: { start: number; end: number }[]): boolean {
  const sorted = intervals.map(i => ({ start: Math.max(540, i.start), end: Math.min(1260, i.end) })).filter(i => i.end > i.start).sort((a, b) => a.start - b.start);
  let cursor = 540;
  for (const interval of sorted) { if (interval.start - cursor >= 120) return true; cursor = Math.max(cursor, interval.end); }
  return 1260 - cursor >= 120;
}
export function scoreDay(items: WorkItem[], date: string, options: { previousScore?: number; sentEmails?: string[]; sleepHours?: number } = {}): DayScore {
  const reasons: DayScore['reasons'] = [];
  const add = (label: string, points: number, itemIds: string[] = []) => { if (points) reasons.push({ label, points, itemIds }); };
  for (const item of items) {
    if (item.kind !== 'deadline' || !item.due) continue;
    const dueDate = dateKey(item.due); const weight = DEADLINE_WEIGHTS[item.category] ?? 0;
    if (dueDate === date) add(item.title, weight, [item.id]);
    else if ((item.category === 'exam' || item.category === 'project') && (dueDate === addDays(date, 1) || dueDate === addDays(date, 2))) {
      add(`Prep for ${item.title} (due ${prettyDate(dueDate, true)})`, weight * (dueDate === addDays(date, 1) ? 0.5 : 0.25), [item.id]);
    }
  }
  const intervals = eventIntervals(items, date);
  for (const interval of intervals) {
    const hours = (interval.end - interval.start) / 60;
    add(`${interval.item.title} · ${hours}h scheduled`, hours * (interval.item.category === 'class' ? 2 : 4), [interval.item.id]);
  }
  if (!hasRealBreak(intervals)) add('No two-hour break between 9 AM and 9 PM', 10, intervals.map(i => i.item.id));
  for (const item of items) {
    if (item.kind === 'event' && !item.recovery && item.end && dateKey(item.end) === date && minutes(item.end) > 1320) add(`Late night: ${item.title}`, 6, [item.id]);
  }
  const lateEmails = (options.sentEmails ?? []).filter(t => dateKey(t) === addDays(date, -1) && minutes(t) > 1410);
  if (lateEmails.length) add(`${lateEmails.length} late-night email${lateEmails.length === 1 ? '' : 's'} the previous night`, Math.min(12, lateEmails.length * 4));
  if ((options.previousScore ?? 0) >= 70) add('Fatigue carried over from an overloaded day', 10);
  if (options.sleepHours !== undefined && options.sleepHours < 6) add('Less than six hours of sleep the previous night', 10);
  const total = reasons.reduce((sum, r) => sum + r.points, 0);
  if (total > 100) add('Score capped at 100', 100 - total);
  const score = Math.min(100, total);
  return { date, score, band: score >= 70 ? 'red' : score >= 40 ? 'amber' : 'green', reasons: reasons.sort((a, b) => b.points - a.points) };
}
export function scoreTimeline(items: WorkItem[], startDate: string, sentEmails: string[] = [], sleep: Record<string, number> = {}, days = 14): DayScore[] {
  let previousScore = scoreDay(items, addDays(startDate, -1), { sentEmails, sleepHours: sleep[addDays(startDate, -1)] }).score;
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(startDate, i); const result = scoreDay(items, date, { previousScore, sentEmails, sleepHours: sleep[date] });
    previousScore = result.score; return result;
  });
}
