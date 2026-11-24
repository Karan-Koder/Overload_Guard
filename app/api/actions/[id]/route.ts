import { z } from 'zod';
import { api, localMutation } from '@/lib/http';
import { act } from '@/lib/service';
const schema = z.object({ action: z.enum(['approve', 'reject', 'edit', 'undo']), draft: z.unknown().optional() }).strict();
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => { localMutation(request); const { id } = await context.params; const body = schema.parse(await request.json()); return act(id, body.action, body.draft); }); }
