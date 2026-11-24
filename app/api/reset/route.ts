import { api, localMutation } from '@/lib/http';
import { resetDemo } from '@/lib/service';
export async function POST(request: Request) { return api(() => { localMutation(request); return resetDemo(); }); }
