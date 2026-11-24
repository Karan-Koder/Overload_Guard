// Phase B seam. No credentials, OAuth flow, Google API calls, or send methods in Phase A.
export const googleScopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
];
export class GoogleWorkloadAdapter {
  readonly status = 'not_implemented';
  connect(): never {
    throw new Error('Live Google OAuth is planned for Phase B. Use the mock MCP tools.');
  }
}
