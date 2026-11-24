'use client';
import { ShieldCheck, Undo2 } from 'lucide-react';
import { useApp } from './AppProvider';
export function AuditTable({ filter }: { filter: string }) {
  const { data, busy, mutate } = useApp();
  const entries = data?.audit.filter((a) => filter === 'all' || a.tier === filter) ?? [];
  return (
    <div className="panel audit-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Policy tier</th>
              <th>Initiated by</th>
              <th>Time (IST)</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.action}</strong>
                  <p>{a.detail}</p>
                </td>
                <td>
                  <span className={`badge ${a.tier}`}>
                    {a.tier === 'green'
                      ? 'Safe & reversible'
                      : a.tier === 'amber'
                        ? 'Approval required'
                        : 'Restricted'}
                  </span>
                </td>
                <td>
                  <span className="actor-label">
                    {a.actor === 'agent' ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <span className="tiny-avatar">A</span>
                    )}
                    {a.actor === 'agent' ? 'Overload Guard' : 'You'}
                  </span>
                </td>
                <td className="audit-time">
                  {new Intl.DateTimeFormat('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                  }).format(new Date(a.at))}
                </td>
                <td>
                  {a.reversible && a.suggestionId ? (
                    <button
                      className="button small-button"
                      disabled={busy}
                      onClick={() =>
                        void mutate(`/api/actions/${a.suggestionId}`, { action: 'undo' })
                      }
                    >
                      <Undo2 size={14} />
                      Undo
                    </button>
                  ) : (
                    <span className="muted">Recorded</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries.length && (
          <div className="calm-empty">
            <h3>No activity in this view.</h3>
            <p>Actions and policy decisions will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
