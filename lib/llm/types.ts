export interface DraftContext {
  student: string;
  title: string;
  owner: string;
  date: string;
  proposedDate: string;
  evaluations: string[];
}
export interface LlmAdapter {
  name: string;
  draftExtension(context: DraftContext): Promise<string>;
}
