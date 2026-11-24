import { ZodError } from 'zod';
export function localMutation(request: Request) {
  const origin = request.headers.get('origin');
  // Next.js may normalize request.url to localhost even when the browser uses
  // 127.0.0.1. Compare against the actual Host header, preserving CSRF checks.
  const host = request.headers.get('host') ?? new URL(request.url).host;
  if (origin && new URL(origin).host !== host)
    throw new Error('Cross-origin mutations are forbidden');
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site') throw new Error('Cross-origin mutations are forbidden');
}
export async function api(run: () => unknown | Promise<unknown>) {
  try {
    return Response.json(await run(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? 'Invalid request fields'
        : error instanceof Error
          ? error.message
          : 'Request failed';
    return Response.json(
      { error: message },
      { status: message.includes('not found') ? 404 : message.includes('forbidden') ? 403 : 400 },
    );
  }
}
