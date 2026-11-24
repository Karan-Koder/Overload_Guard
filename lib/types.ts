export type Source = 'calendar' | 'gmail' | 'classroom' | 'manual';
export type Category =
  | 'exam'
  | 'project'
  | 'assignment'
  | 'lab_record'
  | 'quiz'
  | 'class'
  | 'meeting'
  | 'club'
  | 'work'
  | 'personal';
export type Tier = 'green' | 'amber' | 'red';
export interface WorkItem {
  id: string;
  title: string;
  source: Source;
  category: Category;
  kind: 'deadline' | 'event';
  start?: string;
  end?: string;
  due?: string;
  owner?: { name: string; email: string };
  movable: boolean;
  priority: 1 | 2 | 3;
  rawText?: string;
  flagged?: { reason: string; matched: string };
  recovery?: boolean;
}
export interface DayScore {
  date: string;
  score: number;
  band: Tier;
  reasons: { label: string; points: number; itemIds: string[] }[];
}
export interface Suggestion {
  id: string;
  date: string;
  tier: Tier;
  type:
    | 'block_recovery'
    | 'set_reminder'
    | 'draft_extension_email'
    | 'propose_reschedule'
    | 'draft_decline';
  title: string;
  explanation: string;
  targetItemId?: string;
  draft?: { to: string; subject: string; body: string };
  proposedStart?: string;
  proposedEnd?: string;
  proposedDue?: string;
  createdItemId?: string;
  status: 'suggested' | 'auto_applied' | 'awaiting_approval' | 'approved' | 'rejected' | 'undone';
}
export interface AuditEntry {
  id: string;
  at: string;
  actor: 'agent' | 'user';
  action: string;
  tier: Tier;
  detail: string;
  reversible: boolean;
  suggestionId?: string;
}
export interface Settings {
  connected: Record<'calendar' | 'gmail' | 'classroom', boolean>;
  language: 'en' | 'kn' | 'hi';
}
export interface StoreState {
  version: 1;
  startDate: string;
  demoDate: string;
  student: string;
  items: WorkItem[];
  suggestions: Suggestion[];
  audit: AuditEntry[];
  sentEmails: string[];
  sleep: Record<string, number>;
  settings: Settings;
  demoAdded: boolean;
  deleted: boolean;
}
export interface Snapshot extends StoreState {
  scores: DayScore[];
  projections: Record<string, { before: number; after: number; suggestionIds: string[] }>;
  provider: string;
}
