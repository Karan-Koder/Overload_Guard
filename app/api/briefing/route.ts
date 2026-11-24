import { api } from '@/lib/http';
import { briefing } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function GET() {
  return api(() => briefing());
}
