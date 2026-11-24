import { z } from 'zod';
import { api, localMutation } from '@/lib/http';
import { addDemo, record, scan, store } from '@/lib/service';
export async function POST(request: Request) { return api(async () => { localMutation(request); z.object({ demo: z.literal(true) }).strict().parse(await request.json()); return addDemo(); }); }
// This is an explicit user operation. No deletion tool is exposed to the agent.
export async function DELETE(request: Request) { return api(async () => {
  localMutation(request); const { id } = z.object({ id: z.string().min(1) }).strict().parse(await request.json());
  store.update(state => { if (!state.items.some(i => i.id === id)) throw new Error('Item not found'); state.items = state.items.filter(i => i.id !== id); state.suggestions = state.suggestions.filter(s => s.targetItemId !== id); record(state, { actor: 'user', action: 'Item deleted by user', tier: 'red', detail: id, reversible: false }); });
  return scan();
}); }
