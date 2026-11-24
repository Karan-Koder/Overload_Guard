import { describe, expect, it } from 'vitest';
import { addDays, at, dateKey } from '../lib/dates';
import { hasRealBreak, scoreDay, scoreTimeline } from '../lib/engine/score';
import { createSeed, demoItems } from '../lib/data/seed';
import type { WorkItem } from '../lib/types';
const date = '2026-11-26';
const deadline = (category: WorkItem['category'], due = date): WorkItem => ({
  id: category,
  title: category,
  category,
  source: 'classroom',
  kind: 'deadline',
  due: at(due, 19),
  priority: 1,
  movable: false,
});
const event = (
  start: number,
  end: number,
  category: WorkItem['category'] = 'meeting',
  id = 'event',
): WorkItem => ({
  id,
  title: id,
  category,
  source: 'calendar',
  kind: 'event',
  start: at(date, start),
  end: at(date, end),
  priority: 2,
  movable: false,
});
describe('explainable deterministic scoring', () => {
  it.each([
    ['exam', 30],
    ['project', 20],
    ['assignment', 12],
    ['lab_record', 10],
    ['quiz', 8],
    ['work', 15],
  ] as const)('weights %s deadlines at %i', (category, weight) => {
    const score = scoreDay([deadline(category)], date);
    expect(score.score).toBe(weight);
    expect(score.reasons[0].itemIds).toEqual([category]);
  });
  it.each([
    ['exam', 15, 7.5],
    ['project', 10, 5],
  ] as const)('adds one- and two-day prep for %s', (category, one, two) => {
    expect(scoreDay([deadline(category, addDays(date, 1))], date).score).toBe(one);
    expect(scoreDay([deadline(category, addDays(date, 2))], date).score).toBe(two);
    expect(scoreDay([deadline(category, addDays(date, 3))], date).score).toBe(0);
  });
  it('does not spill assignment prep', () =>
    expect(scoreDay([deadline('assignment', addDays(date, 1))], date).score).toBe(0));
  it('scores classes at 2 per hour, other events at 4', () => {
    expect(scoreDay([event(9, 13, 'class')], date).score).toBe(8);
    expect(scoreDay([event(14, 16)], date).score).toBe(8);
  });
  it('handles fractional hours and midnight boundaries', () => {
    const item = event(21, 23);
    item.start = at(date, 23);
    item.end = at(addDays(date, 1), 1);
    expect(scoreDay([item], date).score).toBe(4);
    expect(scoreDay([item], addDays(date, 1)).score).toBe(4);
    const half = event(14, 15);
    half.end = at(date, 14, 30);
    expect(scoreDay([half], date).score).toBe(2);
  });
  it('adds no-break penalty only when every gap is shorter than two hours', () => {
    const items = [
      event(9, 13),
      event(14, 18, 'meeting', 'second'),
      event(19, 21, 'meeting', 'third'),
    ];
    const result = scoreDay(items, date);
    expect(result.reasons.find((r) => r.label.startsWith('No two-hour'))?.points).toBe(10);
    expect(
      hasRealBreak([
        { start: 540, end: 780 },
        { start: 900, end: 1260 },
      ]),
    ).toBe(true);
  });
  it('merges overlapping intervals for gap detection', () =>
    expect(
      hasRealBreak([
        { start: 540, end: 1000 },
        { start: 600, end: 700 },
        { start: 1100, end: 1260 },
      ]),
    ).toBe(false));
  it('counts a late event only after 22:00', () => {
    expect(scoreDay([event(21, 22)], date).score).toBe(4);
    expect(scoreDay([event(21, 23)], date).score).toBe(14);
  });
  it('scores previous-night emails strictly after 23:30, capped at 12', () => {
    const previous = addDays(date, -1);
    expect(scoreDay([], date, { sentEmails: [at(previous, 23, 30)] }).score).toBe(0);
    expect(scoreDay([], date, { sentEmails: [at(previous, 23, 31)] }).score).toBe(4);
    expect(scoreDay([], date, { sentEmails: Array(8).fill(at(previous, 23, 45)) }).score).toBe(12);
    expect(scoreDay([], date, { sentEmails: [at(date, 23, 45)] }).score).toBe(0);
  });
  it('adds fatigue at 70 and optional sleep strictly below 6h', () => {
    expect(scoreDay([], date, { previousScore: 69 }).score).toBe(0);
    expect(scoreDay([], date, { previousScore: 70 }).score).toBe(10);
    expect(scoreDay([], date, { sleepHours: 5.9 }).score).toBe(10);
    expect(scoreDay([], date, { sleepHours: 6 }).score).toBe(0);
  });
  it('caps at 100 and accounts for every capped point', () => {
    const result = scoreDay(
      Array.from({ length: 6 }, (_, i) => ({ ...deadline('exam'), id: `exam-${i}` })),
      date,
    );
    expect(result.score).toBe(100);
    expect(result.reasons.reduce((sum, r) => sum + r.points, 0)).toBe(100);
    expect(result.reasons.every((r, i, arr) => !i || arr[i - 1].points >= r.points)).toBe(true);
  });
  it.each([
    [39, 'green'],
    [40, 'amber'],
    [69, 'amber'],
    [70, 'red'],
  ] as const)('maps score %i to %s', (hours, band) => {
    const items = Array.from({ length: hours }, (_, i) => ({
      ...event(14, 15, 'class'),
      id: `c${i}`,
      end: at(date, 14, 30),
    }));
    expect(scoreDay(items, date).band).toBe(band);
  });
  it('carries fatigue into next-day timeline score', () => {
    const result = scoreTimeline(
      [deadline('exam'), deadline('exam'), deadline('project')],
      date,
      [],
      {},
      2,
    );
    expect(result[0].score).toBe(80);
    expect(result[1].score).toBe(10);
  });
  it('ignores recovery time as workload', () =>
    expect(scoreDay([{ ...event(18, 20), recovery: true }], date).score).toBe(0));
  it('uses IST even for UTC dates across midnight', () =>
    expect(dateKey('2026-11-25T20:00:00Z')).toBe(date));
  it.each([
    '2026-11-23',
    '2026-11-24',
    '2026-11-25',
    '2026-11-26',
    '2026-11-27',
    '2026-11-28',
    '2026-11-29',
  ])('keeps coming Thursday amber and added load red when today is %s', (today) => {
    const seed = createSeed(new Date(`${today}T12:00:00+05:30`));
    const scores = scoreTimeline(seed.items, seed.startDate, seed.sentEmails);
    expect(scores).toHaveLength(14);
    expect(scores.find((d) => d.date === seed.demoDate)?.score).toBe(57);
    const after = scoreTimeline(
      [...seed.items, ...demoItems(seed.demoDate)],
      seed.startDate,
      seed.sentEmails,
    ).find((d) => d.date === seed.demoDate)!;
    expect(after.score).toBe(97);
    expect(after.band).toBe('red');
    expect(after.reasons.length).toBeGreaterThanOrEqual(4);
  });
});
