import { api, localMutation } from '@/lib/http';
import { changeSettings, deleteAllData, snapshot } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function GET() { return api(() => snapshot().settings); }
export async function POST(request: Request) { return api(async () => { localMutation(request); return changeSettings(await request.json()); }); }
export async function DELETE(request: Request) { return api(async () => { localMutation(request); const body = await request.json(); if (body.confirm !== 'DELETE') throw new Error('Explicit deletion confirmation required'); return deleteAllData(); }); }
