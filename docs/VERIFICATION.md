# Phase A verification — 24 November 2026

Environment: Windows, Node.js 24.21.0, Next.js 16.4.6, React 19, Tailwind CSS 4, MCP SDK v1, Vitest 5. No provider keys used.

## Automated checks

- `npm test`: **75 tests passed** across scoring, policy, injection, lifecycle, HTTP origin boundaries and MCP contracts.
- `npm run typecheck`: passed.
- `npm run format:check`: passed.
- `npm run build`: passed with Webpack. Turbopack production workers failed on this Windows environment, so the build script uses Next.js’s supported `--webpack` option.
- `npm run test:api`: passed against both the development server and optimized production server. Covers reset, 57 → 97 load, 97 → 57 projection, draft edit/approval, unchanged commitments, Undo, forbidden tool rejection, cross-origin rejection, briefing, voice fallback, settings, deletion and restoring seed data.
- `npm run test:mcp`: a real SDK stdio client listed and invoked all six tools successfully. Shared-store mode was also checked against the running app.
- Latest dependency installation reported **0 npm audit vulnerabilities**.

## Browser checks

- Desktop overview loads the relative-date sample scenario.
- Add demo load changes Thursday to 97 / Overloaded and displays nine reasons.
- Recovery block and three amber suggestions appear; the hypothetical result is calculated as 57.
- Editing and saving the Linear Algebra draft persists the new text.
- Approving the draft removes it from the pending inbox and records the exact prototype-draft audit entry.
- Undo from the activity log removes the recovery block and records the reversal.
- The security disclosure highlights the seeded assistant-directed instruction.
- Voice starts browser speech playback and provides a readable briefing transcript. Audio quality and speaker output were not measured.
- Source toggles and Hindi selection save; Hindi is explicitly an English fallback.
- At a 390 × 844 viewport, the banner and cards fit; document width equals viewport width. The fourteen-day timeline scrolls horizontally.
- The final browser preview was returned to the original sample scenario, with Add demo load ready.

## Deliberate prototype limits

Live Google OAuth, persistent DynamoDB storage, Bedrock orchestration, AWS scheduling, and Kannada/Hindi translation are Phase B scaffolds. Provider-key paths require live credential testing. Approved drafts are stored locally and never sent. Approved meeting proposals leave the original event unchanged. Data is process-wide memory and resets when the server restarts; this is a localhost single-user demo.
