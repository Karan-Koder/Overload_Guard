import type { DayScore } from '@/lib/types';
export function ReasonList({ reasons }: { reasons: DayScore['reasons'] }) {
  return (
    <ul className="reason-list">
      {reasons.map((r, i) => (
        <li key={i}>
          <span>{r.label}</span>
          <b className={r.points < 0 ? 'negative' : ''}>
            {r.points > 0 ? '+' : ''}
            {r.points}
          </b>
        </li>
      ))}
      {!reasons.length && <li>No scheduled workload. A little breathing room.</li>}
    </ul>
  );
}
