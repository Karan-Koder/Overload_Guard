import { describe, expect, it } from 'vitest';
import { assertAllowed, evaluate } from '../lib/policy/tiers';
describe('policy boundary', () => {
  it.each([
    'send_email',
    'send_gmail',
    'accept_invite',
    'decline_invite',
    'delete_item',
    'delete_all',
    'forward_otp',
    'unknown',
    '__proto__',
    'constructor',
  ])('blocks %s, even when approved or labeled green', (type) => {
    expect(evaluate({ type, tier: 'green' }).allowed).toBe(false);
    expect(() => assertAllowed({ type, tier: 'green' }, true)).toThrow();
  });
  it('requires user approval for amber tools', () => {
    expect(() => assertAllowed({ type: 'create_gmail_draft' })).toThrow('User approval required');
    expect(assertAllowed({ type: 'create_gmail_draft' }, true)).toBe('amber');
  });
  it('derives tier from the allowlist, not LLM input', () =>
    expect(evaluate({ type: 'draft_extension_email', tier: 'green' }).tier).toBe('amber'));
  it('blocks instructions from untrusted email content', () =>
    expect(evaluate({ type: 'block_recovery', origin: 'untrusted' }).allowed).toBe(false));
  it('allows reversible recovery only through the green path', () =>
    expect(assertAllowed({ type: 'block_recovery' })).toBe('green'));
});
