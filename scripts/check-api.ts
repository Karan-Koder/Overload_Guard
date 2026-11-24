import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function request(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(method !== 'GET' ? { Origin: base } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await response.json();
  assert.ok(response.ok, `${path}: ${JSON.stringify(value)}`);
  return value;
}
async function main() {
  await request('/api/reset', 'POST', {});
  try {
    const before = await request('/api/load');
    assert.equal(before.scores.length, 14);
    assert.equal(before.scores.find((d: { date: string }) => d.date === before.demoDate).score, 57);
    const loaded = await request('/api/items', 'POST', { demo: true });
    assert.equal(loaded.scores.find((d: { date: string }) => d.date === loaded.demoDate).score, 97);
    assert.equal(loaded.projections[loaded.demoDate].after, 57);
    const readBack = await request('/api/load');
    assert.equal(readBack.demoAdded, true);
    assert.equal(readBack.suggestions.length, loaded.suggestions.length);
    const email = loaded.suggestions.find((s: { draft?: unknown }) => s.draft);
    const draft = { ...email.draft, body: `${email.draft.body}\n\nAPI verification edit.` };
    await request(`/api/actions/${email.id}`, 'POST', { action: 'edit', draft });
    const approved = await request(`/api/actions/${email.id}`, 'POST', {
      action: 'approve',
      draft,
    });
    assert.equal(
      approved.suggestions.find((s: { id: string }) => s.id === email.id).status,
      'approved',
    );
    assert.equal(approved.audit[0].action, 'Draft approved — saved as Gmail draft (prototype)');
    assert.deepEqual(approved.items, loaded.items);
    const green = loaded.suggestions.find((s: { tier: string }) => s.tier === 'green');
    const undone = await request(`/api/actions/${green.id}`, 'POST', { action: 'undo' });
    assert.ok(!undone.items.some((i: { id: string }) => i.id === green.createdItemId));
    const rejected = await fetch(`${base}/api/mcp/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'send_email', arguments: {} }),
    });
    assert.equal(rejected.status, 400);
    const crossOrigin = await fetch(`${base}/api/reset`, {
      method: 'POST',
      headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(crossOrigin.status, 403);
    const brief = await request('/api/briefing');
    assert.ok(brief.text.split(/\s+/).length <= 60);
    const voice = await fetch(`${base}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ text: brief.text }),
    });
    assert.ok([200, 204].includes(voice.status));
    const settings = await request('/api/settings', 'POST', { ...loaded.settings, language: 'hi' });
    assert.equal(settings.settings.language, 'hi');
    assert.match((await request('/api/briefing')).note, /English/);
    const deleted = await request('/api/settings', 'DELETE', { confirm: 'DELETE' });
    assert.equal(deleted.items.length, 0);
    assert.equal(deleted.audit.length, 0);
    assert.equal((await request('/api/load')).deleted, true);
    console.log(
      'HTTP verified: seed → demo load → edit/approve → undo → policy/origin rejection → briefing/voice → settings → deletion.',
    );
  } finally {
    await request('/api/reset', 'POST', {});
    console.log('Restored a clean demo scenario.');
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
