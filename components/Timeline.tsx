'use client';
import { dateKey, prettyDate } from '@/lib/dates';
import type { DayScore } from '@/lib/types';
import { bandLabels } from './ScoreBadge';
const color = { green: '#42866c', amber: '#b9791b', red: '#cf5c52' };
export function Timeline({
  scores,
  selected,
  onSelect,
  demoDate,
}: {
  scores: DayScore[];
  selected: string;
  onSelect: (date: string) => void;
  demoDate: string;
}) {
  const width = 920,
    height = 160,
    pad = 25;
  const x = (i: number) => pad + i * ((width - pad * 2) / 13);
  const y = (score: number) => height - 14 - score * 1.12;
  const points = scores.map((d, i) => `${x(i)},${y(d.score)}`).join(' ');
  return (
    <div className="timeline">
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} aria-label="Fourteen-day workload chart" role="img">
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8fb5a3" stopOpacity=".26" />
              <stop offset="100%" stopColor="#8fb5a3" stopOpacity=".015" />
            </linearGradient>
          </defs>
          {[40, 70].map((s) => (
            <g key={s}>
              <line x1="0" x2={width} y1={y(s)} y2={y(s)} stroke="#e2e8e5" strokeDasharray="4 5" />
              <text x={width - 3} y={y(s) - 5} textAnchor="end" fill="#78827d" fontSize="11">
                {s === 70 ? 'OVERLOAD' : 'BUSY'}
              </text>
            </g>
          ))}
          <polygon
            points={`${pad},${height} ${points} ${width - pad},${height}`}
            fill="url(#chart-fill)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#8aaa9c"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {scores.map((d, i) => (
            <g key={d.date}>
              {d.date === selected && (
                <line
                  x1={x(i)}
                  x2={x(i)}
                  y1="4"
                  y2={height}
                  stroke={color[d.band]}
                  strokeOpacity=".35"
                  strokeDasharray="3 3"
                />
              )}
              <circle
                cx={x(i)}
                cy={y(d.score)}
                r={d.date === selected ? 7 : 4.5}
                fill={color[d.band]}
                stroke="white"
                strokeWidth="2.5"
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="day-grid">
        {scores.map((d, i) => (
          <button
            key={d.date}
            onClick={() => onSelect(d.date)}
            aria-pressed={d.date === selected}
            aria-label={`${prettyDate(d.date)}, ${d.score}, ${bandLabels[d.band]}`}
            className={`day-card ${d.band} ${d.date === selected ? 'selected' : ''}`}
          >
            <span className="day-name">
              {new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata',
                weekday: 'short',
              }).format(new Date(`${d.date}T12:00:00+05:30`))}
            </span>
            <span className="day-number">{d.date.slice(-2)}</span>
            <strong>{d.score}</strong>
            <span className="day-status">{bandLabels[d.band]}</span>
            <span className="day-bottom">
              {d.date === dateKey()
                ? 'Today'
                : d.date === demoDate
                  ? 'Focus day'
                  : i === 7
                    ? 'Next week'
                    : ' '}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
