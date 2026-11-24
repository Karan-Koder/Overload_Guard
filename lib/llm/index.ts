import { mock } from './adapters/mock';
import { anthropic } from './adapters/anthropic';
import { openai } from './adapters/openai';
import { bedrock } from './adapters/bedrock';
import type { DraftContext, LlmAdapter } from './types';
import { detectInjection } from '../security/injection';
const adapters: Record<string, LlmAdapter> = { mock, anthropic, openai, bedrock };
export function providerName() { const name = process.env.LLM_PROVIDER || 'mock'; return name === 'mock' ? 'Offline templates' : `${name} · template fallback enabled`; }
export async function draftExtension(context: DraftContext): Promise<string> {
  try { const body = await (adapters[process.env.LLM_PROVIDER || 'mock'] ?? mock).draftExtension(context); return detectInjection(body) ? mock.draftExtension(context) : body; }
  catch { return mock.draftExtension(context); }
}
