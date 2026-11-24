'use client';
import Link from 'next/link';
import { CalendarClock, Check, Coffee, Mail, Undo2 } from 'lucide-react';
import type { Suggestion } from '@/lib/types';
import { useApp } from './AppProvider';
import { prettyDate, dateKey } from '@/lib/dates';
export function SuggestionCard({
  suggestion: s,
  compact = false,
}: {
  suggestion: Suggestion;
  compact?: boolean;
}) {
  const { mutate, busy } = useApp();
  const Icon = s.tier === 'green' ? Coffee : s.draft ? Mail : CalendarClock;
  return (
    <article className={`suggestion-card ${compact ? 'compact' : ''}`}>
      <div className={`suggestion-icon ${s.tier}`}>
        <Icon size={19} />
      </div>
      <div className="suggestion-content">
        <div className="suggestion-top">
          <span className={`tier-label ${s.tier}`}>
            {s.tier === 'green' ? 'SAFE & REVERSIBLE' : 'YOUR APPROVAL NEEDED'}
          </span>
          <span className="suggestion-status">{s.status.replaceAll('_', ' ')}</span>
        </div>
        <h3>{s.title}</h3>
        <p>{s.explanation}</p>
        {s.proposedStart && (
          <span className="slot-label">
            {prettyDate(dateKey(s.proposedStart), true)} ·{' '}
            {new Intl.DateTimeFormat('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date(s.proposedStart))}
            {s.proposedEnd
              ? ` – ${new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(new Date(s.proposedEnd))}`
              : ''}
          </span>
        )}
        <div className="suggestion-bottom">
          {s.status === 'auto_applied' ? (
            <>
              <span className="applied-label">
                <Check size={14} />
                Protected in demo calendar
              </span>
              <button
                disabled={busy}
                className="text-button"
                onClick={() => void mutate(`/api/actions/${s.id}`, { action: 'undo' })}
              >
                <Undo2 size={14} />
                Undo
              </button>
            </>
          ) : s.status === 'awaiting_approval' ? (
            <Link className="text-button amber-text" href={`/inbox#${s.id}`}>
              Review {s.draft ? 'draft' : 'proposal'}
            </Link>
          ) : (
            <span className="muted">
              {s.status === 'approved'
                ? 'Saved locally. Original commitment unchanged.'
                : s.status === 'undone'
                  ? 'Recovery block removed.'
                  : 'No change made.'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
