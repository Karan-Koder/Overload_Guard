'use client';
import { useState } from 'react';
import { CheckCheck, Inbox, ShieldCheck } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { DraftEditor } from '@/components/DraftEditor';
export default function ApprovalInbox() {
  const { data } = useApp(); const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');
  if (!data) return null;
  const amber = data.suggestions.filter(s => s.tier === 'amber'); const pending = amber.filter(s => s.status === 'awaiting_approval');
  const visible = amber.filter(s => filter === 'all' || (filter === 'pending' ? s.status === 'awaiting_approval' : s.status !== 'awaiting_approval'));
  return <div className="page inner-page"><div className="page-heading"><div><span className="eyebrow">YOU HAVE THE FINAL WORD</span><h1>Approval inbox</h1><p>A little help saying “can we make this work?” Review every draft and proposal here.</p></div><span className="heading-icon"><Inbox size={26} /></span></div><div className="info-banner"><ShieldCheck size={21} /><div><strong>Your approval is the starting point.</strong><p>Approved drafts stay in this prototype. No email is sent, no invite is accepted, and original deadlines and events stay unchanged.</p></div></div><div className="tabs" role="group" aria-label="Filter suggestions">{[{ id: 'pending', label: 'Needs your approval', count: pending.length }, { id: 'reviewed', label: 'Reviewed', count: amber.length - pending.length }, { id: 'all', label: 'All', count: amber.length }].map(tab => <button key={tab.id} className={filter === tab.id ? 'selected' : ''} onClick={() => setFilter(tab.id as typeof filter)}>{tab.label}<span>{tab.count}</span></button>)}</div><div className="draft-list">{visible.map(s => <DraftEditor key={`${s.id}-${s.status}`} suggestion={s} />)}{!visible.length && <div className="panel calm-empty large-empty"><span><CheckCheck size={32} /></span><h2>{filter === 'pending' ? 'You’re all caught up.' : 'Nothing here yet.'}</h2><p>{amber.length ? 'Your reviewed suggestions are saved in the Reviewed tab and activity log.' : 'Add demo load on the Overview page to generate extension drafts and a meeting proposal.'}</p></div>}</div></div>;
}
