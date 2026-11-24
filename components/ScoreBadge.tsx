import type { Tier } from '@/lib/types';
export const bandLabels = { green: 'Manageable', amber: 'Busy', red: 'Overloaded' };
export function ScoreBadge({ band, label }: { band: Tier; label?: string }) { return <span className={`badge ${band}`}><span className="badge-dot" />{label ?? bandLabels[band]}</span>; }
