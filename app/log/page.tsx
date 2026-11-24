'use client';
import { useState } from 'react';
import { FileClock, ShieldCheck } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { AuditTable } from '@/components/AuditTable';
export default function ActivityLog() {
  const { data } = useApp(); const [filter, setFilter] = useState('all'); if (!data) return null;
  return <div className="page inner-page"><div className="page-heading"><div><span className="eyebrow">NO INVISIBLE ACTIONS</span><h1>A clear trail, every time.</h1><p>See what happened, why it happened, and where you gave the go-ahead.</p></div><span className="heading-icon"><FileClock size={26} /></span></div><div className="info-banner"><ShieldCheck size={21} /><div><strong>Everything is accountable.</strong><p>Green actions offer Undo while active. Amber actions record your decision. Restricted agent actions are blocked and logged.</p></div><span className="subtle-pill">{data.audit.length} entries</span></div><div className="tabs" role="group" aria-label="Filter activity by tier">{[{ id: 'all', label: 'All activity' }, { id: 'green', label: 'Safe actions' }, { id: 'amber', label: 'Approvals' }, { id: 'red', label: 'Policy blocks' }].map(tab => <button key={tab.id} onClick={() => setFilter(tab.id)} className={filter === tab.id ? 'selected' : ''}>{tab.label}<span>{data.audit.filter(a => tab.id === 'all' || a.tier === tab.id).length}</span></button>)}</div><AuditTable filter={filter} /><p className="storage-note">This demo keeps its activity in server memory. Restarting the server or resetting the demo clears the history.</p></div>;
}
