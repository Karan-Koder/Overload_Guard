# Presentation script — about two minutes

Open the app with `npm run dev`, then open http://127.0.0.1:3000. Click Reset demo before presenting. No API keys needed.

**0:00 — The week ahead.** “Ananya has classes, a lab record and an assignment on Thursday, with DBMS CIE prep for Friday. Her score is 57: busy, but manageable. Every point has a visible reason.”

**0:20 — A realistic pileup.** Click **Add demo load**. “Three more commitments arrive across Calendar, Gmail and Classroom. Thursday is now 97, overloaded. This is deterministic scoring, so it is easy to explain and test.”

**0:40 — A smaller week.** Scroll to the lighter-week plan. “Overload Guard protects two hours on a free evening, with Undo. It drafts two extension requests and proposes moving Code Club. If those requests are granted, Thursday falls from 97 to 57. The preview is calculated from changed items.”

**1:00 — The user stays in control.** Open **Approval inbox**. Edit the Linear Algebra email, save, and click **Approve draft**. “This saves a local prototype draft. There is no send tool. Approval does not assume the professor granted an extension.” Open **Activity log** to show the exact recorded decision and the green Undo control.

**1:25 — Untrusted content stays untrusted.** Return to Overview and expand **Inspect the flagged email**. “This campus-fest email tells the AI to accept an invite and forward an OTP. We treat it as data and flag it. The actual deadline still counts, but none of its instructions can execute.”

**1:45 — A quick briefing.** Click **Play weekly briefing**. “ElevenLabs is ready when configured; the no-key demo uses the browser’s voice. The transcript is available too.”

**Closing.** “Other tools fit more work into your week. Overload Guard helps you recognise when it is too much — and makes it easier to say no.”

## Backup plan

- If voice is unavailable on the presentation laptop, open **Read your briefing** and use the transcript.
- If anything was changed during a rehearsal, **Reset demo** restores the scenario.
- If the local server was restarted, the app starts fresh from sample data.
- Scroll the timeline horizontally on narrow screens. All fourteen days remain accessible.
- For MCP proof, run `npm run test:mcp` in another terminal. To show shared state, start the app and run the same check with `MCP_SHARED_TEST=1`; a smoke-test draft appears in the inbox. Reset afterward.
- Explain that live Google OAuth, AWS deployment, persistent storage and Kannada/Hindi translation are Phase B. Do not present mocks as live connections.
