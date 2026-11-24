import type { LlmAdapter } from '../types';
import { UNTRUSTED_SYSTEM_NOTE, wrapUntrusted } from '../../security/injection';
export const openai: LlmAdapter = {
  name: 'openai',
  async draftExtension(context) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI key unavailable');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${UNTRUSTED_SYSTEM_NOTE} Write only a concise, polite student extension request email body from these fields.`,
          },
          { role: 'user', content: wrapUntrusted(JSON.stringify(context)) },
        ],
        max_tokens: 300,
      }),
    });
    if (!response.ok) throw new Error('OpenAI request failed');
    const data = await response.json();
    const body = data.choices?.[0]?.message?.content;
    if (typeof body !== 'string' || !body.trim()) throw new Error('Empty response');
    return body;
  },
};
