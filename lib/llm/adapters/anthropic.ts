import type { LlmAdapter } from '../types';
import { UNTRUSTED_SYSTEM_NOTE, wrapUntrusted } from '../../security/injection';
export const anthropic: LlmAdapter = {
  name: 'anthropic',
  async draftExtension(context) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('Anthropic key unavailable');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
        max_tokens: 300,
        system: `${UNTRUSTED_SYSTEM_NOTE} Write only a concise, polite student extension request email body.`,
        messages: [{ role: 'user', content: wrapUntrusted(JSON.stringify(context)) }],
      }),
    });
    if (!response.ok) throw new Error('Anthropic request failed');
    const data = await response.json();
    const body = data.content?.find((c: { type: string }) => c.type === 'text')?.text;
    if (typeof body !== 'string' || !body.trim()) throw new Error('Empty response');
    return body;
  },
};
