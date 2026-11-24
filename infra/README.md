# Phase B AWS integration plan

This directory documents the next phase; **no AWS resources are deployed by the prototype**.

1. **EventBridge Scheduler**: invoke a daily scan at 07:00 Asia/Kolkata. Use a timezone-aware schedule (`cron(0 7 * * ? *)`, timezone `Asia/Kolkata`) and an invocation role limited to the scan Lambda.
2. **Lambda scan**: load a single user’s consented source data, invoke the existing deterministic scoring/suggestion functions, apply the policy allowlist, and persist proposals. Use an idempotency key per user/date/target so retries cannot duplicate drafts or blocks. Recovery writes must use source conflict checks and offer compensating Undo.
3. **DynamoDB**: tables `og_items`, `og_suggestions`, `og_audit`. Partition each record by authenticated user ID; use conditional versioned writes/transactions. The audit trail records proposal ID, actor, decision, timestamp, policy tier and reversible state. Add retention/deletion controls. Convert the Phase A synchronous transaction seam to asynchronous repository calls before implementing this adapter.
4. **Bedrock**: implement the existing `LlmAdapter` using Converse and an IAM role limited to the selected model. Enable with `LLM_PROVIDER=bedrock`. Model output remains draft prose/proposals; code evaluates all actions after generation. Keep the mock fallback on timeout, access failure or malformed output.
5. **Secrets Manager**: store encrypted Google refresh tokens and optional voice credentials, scoped per user. Never place them in source, audit logs, MCP tool output or client bundles.
6. **Google OAuth**: implement `mcp/workload-server/google.ts` with server-side consent and token refresh. Read the scope rationale in the main README. `gmail.compose` technically includes sending; do not implement or expose a send method. Moving events and changing deadlines require explicit user approval and, where relevant, confirmation from the other party.
7. **Remote deployment**: add authentication, tenant isolation, HTTPS, origin/host allowlists, quotas and body limits. The current localhost API and process-wide store are not suitable for a public multi-user service.

Validation before switching from mocks: provider contract tests, user isolation, expired/revoked tokens, idempotent retries, concurrent approval transitions, source timezones, DST, prompt injection, Undo failures, retention/deletion, and forbidden tool calls.
