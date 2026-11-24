import type { LlmAdapter } from '../types';
// Phase B seam: implement Bedrock Converse with the deployment's IAM role.
export const bedrock: LlmAdapter = { name: 'bedrock', async draftExtension() { throw new Error('Bedrock is a Phase B adapter. Using offline template.'); } };
