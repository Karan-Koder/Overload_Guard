import { describe, expect, it } from 'vitest';
import { localMutation } from '../lib/http';
describe('local mutation origin boundary', () => {
  it('accepts same-origin requests when Next normalizes the internal URL', () => expect(() => localMutation(new Request('http://localhost:3000/api/items', { headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000', 'sec-fetch-site': 'same-origin' } }))).not.toThrow());
  it('rejects a different origin', () => expect(() => localMutation(new Request('http://localhost:3000/api/items', { headers: { host: 'localhost:3000', origin: 'https://attacker.example' } }))).toThrow('forbidden'));
  it('rejects cross-site fetch metadata even without an Origin', () => expect(() => localMutation(new Request('http://localhost:3000/api/items', { headers: { 'sec-fetch-site': 'cross-site' } }))).toThrow('forbidden'));
});
