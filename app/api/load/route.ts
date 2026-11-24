import { api } from '@/lib/http';
import { snapshot } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function GET() { return api(() => snapshot()); }
