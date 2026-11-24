import type { DraftContext, LlmAdapter } from '../types';
export function templateDraft(c: DraftContext): string {
  return `Dear ${c.owner},\n\nI have ${c.evaluations.length} evaluations scheduled around ${c.date} (${c.evaluations.join(', ')}). Could I submit ${c.title} by ${c.proposedDate} instead? I will make sure the quality is not affected.\n\nThank you,\n${c.student}`;
}
export const mock: LlmAdapter = { name: 'mock', draftExtension: async (c) => templateDraft(c) };
