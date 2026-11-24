import { z } from 'zod';
import { localMutation } from '@/lib/http';
export async function POST(request: Request) {
  try {
    localMutation(request); const { text } = z.object({ text: z.string().trim().min(1).max(1200) }).strict().parse(await request.json());
    const key = process.env.ELEVENLABS_API_KEY; const voice = process.env.ELEVENLABS_VOICE_ID;
    if (!key || !voice) return new Response(null, { status: 204 });
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}`, { method: 'POST', signal: AbortSignal.timeout(12000), headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }) });
    if (!response.ok) return new Response(null, { status: 204 });
    return new Response(await response.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch { return new Response(null, { status: 204 }); }
}
