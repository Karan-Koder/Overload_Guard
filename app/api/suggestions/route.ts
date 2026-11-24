import { api } from '@/lib/http';
import { snapshot } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function GET() { return api(() => { const s = snapshot(); return { suggestions: s.suggestions, projections: s.projections }; }); }
