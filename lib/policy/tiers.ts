import type { Tier } from '../types';
const allowed: Record<string, Tier> = {
  block_recovery: 'green',
  set_reminder: 'green',
  reorder_tasks: 'green',
  create_calendar_block: 'green',
  draft_extension_email: 'amber',
  propose_reschedule: 'amber',
  draft_decline: 'amber',
  create_gmail_draft: 'amber',
  propose_event_move: 'amber',
};
export interface Proposal {
  type: string;
  origin?: 'trusted' | 'untrusted';
  tier?: Tier;
}
export function evaluate(proposal: Proposal): {
  allowed: boolean;
  tier: Tier;
  requiresApproval: boolean;
  reason: string;
} {
  const tier = Object.hasOwn(allowed, proposal.type) ? allowed[proposal.type] : undefined;
  if (!tier || proposal.origin === 'untrusted')
    return {
      allowed: false,
      tier: 'red',
      requiresApproval: false,
      reason:
        'Blocked by policy: unknown, destructive, sending, invite, or untrusted-content action.',
    };
  return {
    allowed: true,
    tier,
    requiresApproval: tier === 'amber',
    reason:
      tier === 'green'
        ? 'Reversible local action; log and offer Undo.'
        : 'Explicit user approval required; draft or proposal only.',
  };
}
export function assertAllowed(proposal: Proposal, userApproved = false): Tier {
  const decision = evaluate(proposal);
  if (!decision.allowed || (decision.requiresApproval && !userApproved))
    throw new Error(decision.allowed ? 'User approval required' : decision.reason);
  return decision.tier;
}
