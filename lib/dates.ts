// All workload days use Asia/Kolkata, independent of the server/browser timezone.
export const TIME_ZONE = 'Asia/Kolkata';
export function dateKey(value: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00+05:30`); d.setUTCDate(d.getUTCDate() + days); return dateKey(d);
}
export function at(date: string, hour: number, minute = 0): string {
  return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`;
}
export function minutes(value: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  return Number(parts.find(p => p.type === 'hour')?.value) * 60 + Number(parts.find(p => p.type === 'minute')?.value);
}
export function prettyDate(date: string, short = false): string {
  return new Intl.DateTimeFormat('en-IN', { timeZone: TIME_ZONE, weekday: short ? 'short' : 'long', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00+05:30`));
}
